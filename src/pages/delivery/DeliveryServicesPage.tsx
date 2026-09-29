import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Pagination } from '@/components/common/Pagination';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { DataSection } from '@/components/workspace/DataSection';
import { FilterBar } from '@/components/workspace/FilterBar';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/useToast';
import { providersService } from '@/services/providers.service';
import { ApiError } from '@/types/api';
import {
  DELIVERY_SERVICE_STATUSES,
  DELIVERY_SERVICE_TYPES,
  deliveryServicesService,
  type DeliveryService,
  type DeliveryServiceStatus,
} from '@/services/deliveryServices.service';
import { DeliveryServiceForm } from './DeliveryServiceForm';
import { useDeliveryStats } from './hooks/useDeliveryStats';

const LIMIT = 20;

/**
 * Delivery Services — the catalog page, fully manageable by the admin.
 *
 *   cards: totals/active from the operations dashboard + linked providers;
 *   table: GET /delivery/service — name, type, pricing, capacity, coverage;
 *   row actions: edit, change status inline, delete (backend blocks delete
 *   while providers are still linked, message surfaces in the toast);
 *   header: Add Delivery Service opens the same form used to edit.
 *
 * With no seed data the table renders its empty state and the counters show
 * 0; nothing is faked and no toast fires on entry.
 */
export function DeliveryServicesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DeliveryService | null>(null);
  const [deleting, setDeleting] = useState<DeliveryService | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { showToast } = useToast();
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

  const {
    data: usage,
    loading: usageLoading,
    refetch: refetchUsage,
  } = useAsync(async () => {
    const res = await providersService.list({ page: 1, limit: 200 });
    const items = res.items ?? [];
    const total = res.total ?? items.length;
    return {
      linked: items.filter((p) => !!p.serviceId).length,
      total,
      partial: total > items.length,
    };
  }, []);

  const handleRefresh = () => {
    refetchStats();
    refetchCatalog();
    refetchUsage();
  };

  const isFiltered = !!(search || status || serviceType);
  const reset = () => {
    setSearch('');
    setStatus('');
    setServiceType('');
    setPage(1);
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (row: DeliveryService) => {
    setEditing(row);
    setFormOpen(true);
  };

  const changeStatus = async (row: DeliveryService, next: DeliveryServiceStatus) => {
    setBusyId(row._id);
    try {
      await deliveryServicesService.update(row._id, { status: next });
      showToast({ type: 'success', message: `${row.name} is now ${next}` });
      handleRefresh();
    } catch (err) {
      showToast({
        type: 'error',
        message: err instanceof ApiError ? err.message : 'Could not change status',
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
      // Last row on this page? Step back so the admin never lands on a blank page.
      if ((catalog?.items.length ?? 0) === 1 && page > 1) setPage(page - 1);
      setDeleting(null);
      handleRefresh();
    } catch (err) {
      showToast({
        type: 'error',
        message: err instanceof ApiError ? err.message : 'Could not delete the service',
      });
      setDeleting(null);
    } finally {
      setDeletingBusy(false);
    }
  };

  // '—' while loading or on error; a real 0 once the dashboard answered.
  const display = (value: number | undefined) =>
    statsLoading || statsError ? '—' : value ?? 0;

  const cards = [
    { label: 'Total Delivery Services', value: display(stats?.totalServices), hint: 'from operations dashboard' },
    { label: 'Active Services', value: display(stats?.activeServices), hint: 'status = active' },
    {
      label: 'Providers with a Service',
      value: usageLoading || !usage ? '—' : usage.linked,
      hint: usage ? `of ${usage.total} providers${usage.partial ? '+' : ''}` : 'from providers list',
    },
  ];

  const columns: Column<DeliveryService>[] = [
    {
      key: 'name',
      header: 'Service',
      render: (row) => (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-gray-800 dark:text-gray-100">{row.name}</span>
          <span className="rounded-full px-2 py-0.5 text-xs font-mono text-gray-500">{row.code}</span>
        </div>
      ),
    },
    {
      key: 'serviceType',
      header: 'Type',
      accessor: (row) => row.serviceType || '—',
    },
    {
      key: 'fees',
      header: 'Fees',
      render: (row) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          base {row.baseFee} + {row.perKmFee} / km · max {row.maxWeightKg} kg
        </span>
      ),
    },
    {
      key: 'duration',
      header: 'Est. Duration',
      accessor: (row) => `${row.estimatedDurationMinutes} min`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            row.status === 'active'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
              : row.status === 'inactive'
              ? 'bg-gray-100 text-gray-700 dark:bg-dark-800 dark:text-gray-300'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: 'coverage',
      header: 'Coverage',
      accessor: (row) => (row.coverageZones?.length ?? 0) || '—',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openEdit(row)}
            className="text-sm text-primary-dark hover:underline dark:text-primary-color"
          >
            Edit
          </button>
          <select
            aria-label={`Status of ${row.name}`}
            value={row.status}
            disabled={busyId === row._id}
            onChange={(e) => void changeStatus(row, e.target.value as DeliveryServiceStatus)}
            className="h-8 rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-700 focus:border-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-dark disabled:opacity-60 dark:border-dark-600 dark:bg-dark-900 dark:text-gray-200"
          >
            {DELIVERY_SERVICE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setDeleting(row)}
            className="text-sm text-red-600 hover:underline"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Delivery Services"
        description="Delivery service catalog — type, pricing, capacity and coverage."
        actions={
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label} className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">{c.hint}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{c.value}</p>
            <p className="text-xs text-gray-500">{c.label}</p>
          </Card>
        ))}
      </div>

      <div className="mt-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Catalog</h3>

        <FilterBar
          searchValue={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          searchPlaceholder="Search services…"
          isFiltered={isFiltered}
          onReset={reset}
          resultSummary={
            catalog ? `${catalog.total} service${catalog.total === 1 ? '' : 's'}` : undefined
          }
          actions={
            <Button variant="primary" onClick={openCreate}>
              Add Delivery Service
            </Button>
          }
          filters={[
            {
              key: 'status',
              label: 'Status',
              value: status,
              onChange: (v) => {
                setStatus(v);
                setPage(1);
              },
              options: [{ value: '', label: 'All' }, ...DELIVERY_SERVICE_STATUSES],
            },
            {
              key: 'type',
              label: 'Type',
              value: serviceType,
              onChange: (v) => {
                setServiceType(v);
                setPage(1);
              },
              options: [{ value: '', label: 'All' }, ...DELIVERY_SERVICE_TYPES],
            },
          ]}
        />

        <DataSection
          error={catalogError}
          onRetry={refetchCatalog}
          isEmpty={!catalogLoading && (catalog?.items.length ?? 0) === 0}
          emptyTitle={isFiltered ? 'No services match these filters' : 'No delivery services yet'}
          emptyDescription={
            isFiltered
              ? 'Try widening or resetting the filters above.'
              : 'Nothing has been added in this environment. Create the first delivery service to get started.'
          }
          emptyAction={
            isFiltered ? undefined : { label: 'Add Delivery Service', onClick: openCreate }
          }
        >
          <DataTable<DeliveryService>
            columns={columns}
            rows={catalog?.items ?? []}
            rowKey={(row) => row._id || row.code}
            loading={catalogLoading}
            emptyTitle="No delivery services found"
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
      </div>

      <DeliveryServiceForm
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
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
    </div>
  );
}
