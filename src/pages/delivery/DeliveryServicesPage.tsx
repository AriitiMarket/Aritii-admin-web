/**
 * Delivery Services — the catalog of delivery services/types Ariiti offers.
 *
 * CATALOG CONFIGURATION ONLY. This page owns what a service IS (name, type,
 * pricing, capacity, duration, where it is offered). It deliberately shows no
 * assignment or rider operations and offers no way to change an individual
 * delivery's status — a service's availability is configuration, never delivery
 * progress. Actual deliveries live on the Deliveries page.
 *
 * Every column is derived from the existing `GET /delivery/service` contract;
 * nothing here is invented.
 */
import { useMemo, useState } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Pagination } from '@/components/common/Pagination';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { FilterBar } from '@/components/workspace/FilterBar';
import { DataSection, RowActions } from '@/components/workspace/DataSection';
import { Facts } from '@/components/workspace/DetailList';
import { RecordDrawer, type DetailTab } from '@/components/workspace/RecordDrawer';
import { ApiError } from '@/types/api';
import { zonesService } from '@/services/locations.service';
import {
  DELIVERY_SERVICE_STATUSES,
  DELIVERY_SERVICE_TYPES,
  deliveryServicesService,
  type DeliveryService,
  type DeliveryServiceStatus,
} from '@/services/deliveryServices.service';
import { DeliveryServiceForm } from './DeliveryServiceForm';
import { useDeliveryStats } from './hooks/useDeliveryStats';
import { truncate } from '@/utils/format';

const LIMIT = 20;
/** Zone rows scanned to resolve the names behind `coverageZones`. */
const ZONE_LOOKUP_LIMIT = 200;

const TYPE_LABELS: Record<string, string> = Object.fromEntries(
  DELIVERY_SERVICE_TYPES.map((t) => [t.value, t.label])
);

const STATUS_VARIANTS: Record<DeliveryServiceStatus, 'success' | 'neutral' | 'warning'> = {
  active: 'success',
  inactive: 'neutral',
  suspended: 'warning',
};

const typeLabel = (value: string) => TYPE_LABELS[value] ?? value ?? '—';

/**
 * Availability is CONFIGURATION: whether the service is switched on AND where it
 * is offered. It never reflects how many deliveries a service currently has.
 */
function availabilityOf(service: DeliveryService): { label: string; variant: 'success' | 'neutral' } {
  const areas = service.coverageZones?.length ?? 0;
  if (service.status !== 'active') return { label: 'Unavailable', variant: 'neutral' };
  if (areas === 0) return { label: 'No areas configured', variant: 'neutral' };
  return {
    label: `Available in ${areas} area${areas === 1 ? '' : 's'}`,
    variant: 'success',
  };
}

export function DeliveryServicesPage() {
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DeliveryService | null>(null);
  const [detail, setDetail] = useState<DeliveryService | null>(null);
  const [deactivating, setDeactivating] = useState<DeliveryService | null>(null);
  const [deleting, setDeleting] = useState<DeliveryService | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const {
    stats,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useDeliveryStats();

  const {
    data: catalog,
    loading: catalogLoading,
    error: catalogError,
    refetch: refetchCatalog,
  } = useAsync(
    () =>
      deliveryServicesService.list({
        page,
        limit: LIMIT,
        search: debouncedSearch || undefined,
        status: status || undefined,
        serviceType: serviceType || undefined,
      }),
    [page, debouncedSearch, status, serviceType]
  );

  /** One read turns the stored zone ids into names for the coverage column. */
  const { data: zoneLookup } = useAsync(
    () => zonesService.list({ page: 1, limit: ZONE_LOOKUP_LIMIT }),
    []
  );

  const zoneNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const zone of zoneLookup?.zones ?? []) map.set(zone._id, zone.name);
    return map;
  }, [zoneLookup]);

  const services = catalog?.items ?? [];
  const isFiltered = !!(search || status || serviceType);

  const handleRefresh = () => {
    refetchStats();
    refetchCatalog();
  };

  const reset = () => { setSearch(''); setStatus(''); setServiceType(''); setPage(1); };

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (service: DeliveryService) => { setFormOpen(true); setEditing(service); };

  const setServiceStatus = async (service: DeliveryService, next: DeliveryServiceStatus) => {
    setBusyId(service._id);
    try {
      await deliveryServicesService.update(service._id, { status: next });
      showToast({
        type: 'success',
        message: `${service.name} is now ${next}.`,
      });
      setDeactivating(null);
      refetchCatalog();
      refetchStats();
    } catch (err) {
      showToast({
        type: 'error',
        message: err instanceof ApiError ? err.message : 'Could not change the service state',
      });
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      await deliveryServicesService.remove(deleting._id);
      showToast({ type: 'success', message: `${deleting.name} deleted` });
      setDeleting(null);
      handleRefresh();
    } catch (err) {
      showToast({
        type: 'error',
        message: err instanceof ApiError ? err.message : 'Could not delete the service',
      });
    } finally {
      setDeletingBusy(false);
    }
  };

  // '—' while loading or on error; a real 0 once the dashboard answered.
  const display = (value: number | undefined) =>
    statsLoading || statsError ? '—' : value ?? 0;

  const cards = [
    { label: 'Total delivery services', value: display(stats?.totalServices), hint: 'in the catalog' },
    { label: 'Active services', value: display(stats?.activeServices), hint: 'available to book' },
  ];

  const areaNames = (service: DeliveryService) =>
    (service.coverageZones ?? [])
      .map((id) => zoneNameById.get(id))
      .filter((name): name is string => !!name);

  const columns: Column<DeliveryService>[] = [
    {
      key: 'name',
      header: 'Service',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-gray-800 dark:text-gray-100">{row.name}</p>
          <p className="font-mono text-xs text-gray-500 dark:text-gray-400">{row.code}</p>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) =>
        row.description ? (
          <span className="text-sm text-gray-600 dark:text-gray-400" title={row.description}>
            {truncate(row.description, 70)}
          </span>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        ),
    },
    {
      key: 'coverage',
      header: 'Supported areas',
      render: (row) => {
        const count = row.coverageZones?.length ?? 0;
        if (count === 0) return <span className="text-sm text-gray-400">No areas set</span>;
        const names = areaNames(row);
        const text = names.length ? names.join(', ') : `${count} area(s)`;
        return (
          <span className="text-sm text-gray-700 dark:text-gray-200" title={text}>
            {truncate(text, 60)}
          </span>
        );
      },
    },
    {
      key: 'serviceType',
      header: 'Type',
      render: (row) => (
        <span className="text-sm text-gray-700 dark:text-gray-200">{typeLabel(row.serviceType)}</span>
      ),
    },
    {
      key: 'availability',
      header: 'Availability',
      render: (row) => {
        const availability = availabilityOf(row);
        return (
          <StatusBadge label={availability.label} variant={availability.variant} />
        );
      },
    },
    {
      key: 'config',
      header: 'Configuration',
      render: (row) => (
        <div className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
          <p>
            {row.baseFee} base + {row.perKmFee} / km
          </p>
          <p>
            max {row.maxWeightKg} kg · est. {row.estimatedDurationMinutes} min
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'State',
      render: (row) => (
        <StatusBadge label={row.status} variant={STATUS_VARIANTS[row.status] ?? 'neutral'} />
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <RowActions
          onView={() => setDetail(row)}
          onEdit={() => openEdit(row)}
          onManage={() =>
            row.status === 'active'
              ? setDeactivating(row)
              : void setServiceStatus(row, 'active')
          }
        />
      ),
    },
  ];

  const detailTabs: DetailTab[] = detail
    ? [
        {
          id: 'overview',
          label: 'Overview',
          content: (
            <Facts
              items={[
                ['Name', detail.name],
                ['Code', detail.code],
                ['Type', typeLabel(detail.serviceType)],
                ['State', detail.status],
                ['Availability', availabilityOf(detail).label],
                ['Description', detail.description || '—'],
              ]}
            />
          ),
        },
        {
          id: 'configuration',
          label: 'Configuration',
          content: (
            <Facts
              items={[
                ['Base fee', detail.baseFee],
                ['Fee per km', detail.perKmFee],
                ['Max weight', `${detail.maxWeightKg} kg`],
                ['Estimated duration', `${detail.estimatedDurationMinutes} min`],
              ]}
            />
          ),
        },
        {
          id: 'coverage',
          label: 'Supported areas',
          content: (
            <Facts
              items={(detail.coverageZones ?? []).map((id) => [
                zoneNameById.get(id) ?? 'Unknown zone',
                '',
              ])}
            />
          ),
        },
      ]
    : [];

  return (
    <div>
      <PageHeader
        title="Delivery Services"
        description="The delivery services Ariiti offers — type, pricing, capacity and where each one is available."
        actions={
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Refresh
          </Button>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Card key={c.label} className="p-4">
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{c.value}</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">{c.label}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{c.hint}</p>
          </Card>
        ))}
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search services…"
        isFiltered={isFiltered}
        onReset={reset}
        resultSummary={
          catalog
            ? `${catalog.total} service${catalog.total === 1 ? '' : 's'}${isFiltered ? ' matching filters' : ''}`
            : undefined
        }
        actions={
          <Button variant="primary" size="sm" onClick={openCreate}>
            Add Delivery Service
          </Button>
        }
        filters={[
          {
            key: 'status',
            label: 'Status',
            value: status,
            onChange: (v: string) => { setStatus(v); setPage(1); },
            options: [{ value: '', label: 'All' }, ...DELIVERY_SERVICE_STATUSES],
          },
          {
            key: 'type',
            label: 'Type',
            value: serviceType,
            onChange: (v: string) => { setServiceType(v); setPage(1); },
            options: [{ value: '', label: 'All' }, ...DELIVERY_SERVICE_TYPES],
          },
        ]}
      />

      <DataSection
        error={catalogError}
        onRetry={refetchCatalog}
        isEmpty={!catalogLoading && services.length === 0}
        emptyTitle={isFiltered ? 'No services match these filters' : 'No delivery services yet'}
        emptyDescription={
          isFiltered
            ? 'Try widening or resetting the filters above.'
            : 'Create the first delivery service to describe what Ariiti offers.'
        }
        emptyAction={isFiltered ? undefined : { label: 'Add Delivery Service', onClick: openCreate }}
      >
        <DataTable<DeliveryService>
          columns={columns}
          rows={services}
          rowKey={(row) => row._id || row.code}
          loading={catalogLoading}
          emptyTitle="No delivery services found"
          onRowClick={(row) => setDetail(row)}
        />
        {(catalog?.total ?? 0) > 0 && (
          <Pagination
            className="mt-4"
            page={page}
            totalPages={catalog?.totalPages ?? 1}
            total={catalog?.total}
            onPageChange={setPage}
          />
        )}
      </DataSection>

      {/* Simple form dialog for create / edit. */}
      <DeliveryServiceForm
        open={formOpen}
        initial={editing}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSaved={() => {
          setFormOpen(false);
          setEditing(null);
          showToast({
            type: 'success',
            message: editing ? `${editing.name} updated` : 'Delivery service created',
          });
          handleRefresh();
        }}
      />

      {/* Deactivating hides the service from booking — worth confirming. */}
      <ConfirmDialog
        open={!!deactivating}
        onClose={() => setDeactivating(null)}
        onConfirm={() => deactivating && void setServiceStatus(deactivating, 'inactive')}
        title={`Deactivate ${deactivating?.name ?? 'service'}?`}
        message="The service stays in the catalog with its configuration, but it is no longer offered. You can activate it again at any time."
        confirmLabel="Deactivate"
        loading={busyId === deactivating?._id}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
        title="Delete delivery service"
        message={
          deleting
            ? `Delete “${deleting.name}” (${deleting.code})? Providers still linked to it must be reassigned first — the backend blocks the delete until then.`
            : ''
        }
        confirmLabel="Delete"
        loading={deletingBusy}
      />

      <RecordDrawer
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.name ?? ''}
        subtitle={detail ? `${detail.code} · ${typeLabel(detail.serviceType)}` : undefined}
        statusLabel={detail?.status}
        statusVariant={detail ? STATUS_VARIANTS[detail.status] ?? 'neutral' : undefined}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => detail && openEdit(detail)}>
              Edit
            </Button>
            <Button
              variant="secondary"
              size="sm"
              loading={busyId === detail?._id}
              onClick={() => {
                if (!detail) return;
                if (detail.status === 'active') setDeactivating(detail);
                else void setServiceStatus(detail, 'active');
              }}
            >
              {detail?.status === 'active' ? 'Deactivate' : 'Activate'}
            </Button>
            <Button variant="danger" size="sm" onClick={() => detail && setDeleting(detail)}>
              Delete
            </Button>
          </>
        }
        summary={[
          { label: 'Type', value: detail ? typeLabel(detail.serviceType) : '—' },
          { label: 'Availability', value: detail ? availabilityOf(detail).label : '—' },
          { label: 'Supported areas', value: detail?.coverageZones?.length ?? 0 },
        ]}
        tabs={detailTabs}
        activeTab="overview"
      />
    </div>
  );
}
