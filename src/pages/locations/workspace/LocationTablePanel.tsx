/**
 * The canonical operating-location table used by every location view on this
 * page (Cities, Service areas, Pickup & service locations and the Expansion
 * groups) so the geography screen reads as ONE system.
 *
 * It is geography/configuration ONLY: name, type, parent, status, coverage and
 * the delivery CAPACITY/CONFIGURATION already stored on the location. There is
 * deliberately no delivery status, no rider assignment and no live operations
 * data here — those live on the Delivery pages.
 *
 * Data comes from the existing `GET /delivery/location` contract; nothing here
 * invents a field or a hierarchy level.
 */
import { useCallback, useMemo, useState } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Pagination } from '@/components/common/Pagination';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { FilterBar } from '@/components/workspace/FilterBar';
import { DataSection, RowActions } from '@/components/workspace/DataSection';
import { Facts } from '@/components/workspace/DetailList';
import { RecordDrawer, type DetailTab } from '@/components/workspace/RecordDrawer';
import { locationsService, type Location } from '@/services/locations.service';
import { useToast } from '@/hooks/useToast';
import { ApiError } from '@/types/api';
import { useLocations } from '../hooks/useLocations';
import { EnhancedLocationForm } from '../components/EnhancedLocationForm';
import { EXPANSION_STATUS_LABELS, LOCATION_STATUSES, LOCATION_TYPES } from '../constants';

const LIMIT = 20;
/** Rows scanned to resolve parent names in one round trip. */
const LOOKUP_LIMIT = 500;

/** Clean type labels (no emoji) built from the canonical type list. */
const TYPE_LABELS: Record<string, string> = Object.fromEntries(
  LOCATION_TYPES.filter((t) => t.value).map((t) => [t.value, t.label])
);

const typeLabel = (type: string) => TYPE_LABELS[type] ?? type ?? '—';

function Chip({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ${
        on
          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
          : 'bg-gray-100 text-gray-500 dark:bg-dark-800 dark:text-gray-400'
      }`}
    >
      {children}
    </span>
  );
}

export interface LocationTablePanelProps {
  heading: string;
  description: string;
  /** Types offered in the filter dropdown. Defaults to every location type. */
  typeOptions?: { value: string; label: string }[];
  /** Locks the query to one type server-side (the view's defining level). */
  lockedType?: string;
  /** Preselects a type in the filter when the view covers several. */
  typeDefault?: string;
  /** Keeps only locations whose serviceability allows pickup. */
  pickupOnly?: boolean;
  /**
   * Expansion stages this view covers. A single stage is filtered server-side;
   * several are merged client-side from one request per stage.
   */
  expansionStages?: string[];
  emptyTitle: string;
  emptyDescription: string;
  addLabel: string;
}

export function LocationTablePanel({
  heading,
  description,
  typeOptions,
  lockedType,
  typeDefault,
  pickupOnly,
  expansionStages,
  emptyTitle,
  emptyDescription,
  addLabel,
}: LocationTablePanelProps) {
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState(lockedType ?? typeDefault ?? '');
  const [status, setStatus] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [detail, setDetail] = useState<Location | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<Location | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  /** One request per expansion stage keeps the merged count exact. */
  const stageList = expansionStages?.length ? expansionStages : undefined;
  /** Only "being configured" spans two stages, so it needs its own merged read. */
  const isMultiStage = !!stageList && stageList.length > 1;
  const singleStage = isMultiStage ? undefined : stageList?.[0];

  const { data, loading, error, refetch } = useLocations({
    type: lockedType ?? (type || undefined),
    status,
    expansionStatus: singleStage,
    search: debouncedSearch,
    // Multi-stage views read their merged rows below, so keep this query inert.
    page: isMultiStage ? 1 : page,
    limit: isMultiStage ? 1 : LIMIT,
  });

  /** For multi-stage views the list query above is replaced by per-stage reads. */
  const { data: stagedRows, loading: stagedLoading, error: stagedError, refetch: refetchStaged } =
    useAsync(
      async () => {
        if (!isMultiStage || !stageList) return null;
        const pages = await Promise.all(
          stageList.map((stage) =>
            locationsService.list({
              status: status || 'all',
              expansionStatus: stage,
              q: debouncedSearch || undefined,
              limit: LOOKUP_LIMIT,
            })
          )
        );
        return pages.flat();
      },
      [stageList?.join(','), status, debouncedSearch]
    );

  const { data: lookup } = useAsync(
    () => locationsService.list({ status: 'all', limit: LOOKUP_LIMIT }),
    []
  );

  const nameById = useMemo(() => {
    const map = new Map<string, Location>();
    for (const location of lookup ?? []) map.set(location._id, location);
    return map;
  }, [lookup]);

  const parentOf = useCallback(
    (id: string | null) => (id ? nameById.get(id) ?? null : null),
    [nameById]
  );

  const allRows = isMultiStage ? (stagedRows ?? []) : (data?.items ?? []);
  const visibleRows = pickupOnly
    ? allRows.filter((row) => row.serviceability?.pickupAvailable)
    : allRows;

  const busyState = isMultiStage ? stagedLoading : loading;
  const loadError = isMultiStage ? stagedError : error;
  const reload = isMultiStage ? refetchStaged : refetch;
  const isFiltered = !!(search || type || status);
  const reset = () => { setSearch(''); setType(lockedType ?? typeDefault ?? ''); setStatus(''); setPage(1); };

  const activate = async (location: Location) => {
    setBusy(true);
    setActionError(null);
    try {
      await locationsService.activate(location._id);
      showToast({ type: 'success', message: `${location.name} is now active` });
      reload();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not activate the location';
      setActionError(message);
      showToast({ type: 'error', message });
    } finally {
      setBusy(false);
    }
  };

  const deactivate = async () => {
    if (!confirmDeactivate) return;
    setBusy(true);
    setActionError(null);
    try {
      await locationsService.deactivate(confirmDeactivate._id);
      showToast({ type: 'success', message: `${confirmDeactivate.name} is now inactive` });
      setConfirmDeactivate(null);
      reload();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not deactivate the location';
      setActionError(message);
      showToast({ type: 'error', message });
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<Location>[] = [
    {
      key: 'name',
      header: 'Location',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-gray-800 dark:text-gray-100">{row.name}</p>
          {(row.code || row.localName) && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {[row.code, row.localName].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <span className="text-sm text-gray-700 dark:text-gray-200">{typeLabel(row.type)}</span>
      ),
    },
    {
      key: 'parent',
      header: 'Parent location',
      render: (row) => {
        const parent = parentOf(row.parentId);
        if (!row.parentId) {
          return <span className="text-sm text-gray-400">Top level</span>;
        }
        return (
          <span className="text-sm text-gray-700 dark:text-gray-200" title={row.parentId}>
            {parent ? `${parent.name} (${typeLabel(parent.type)})` : 'Unknown parent'}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <StatusBadge
          label={row.isActive ? 'Active' : 'Inactive'}
          variant={row.isActive ? 'success' : 'neutral'}
        />
      ),
    },
    ...(stageList
      ? [
          {
            key: 'stage',
            header: 'Stage',
            render: (row: Location) => (
              <StatusBadge
                label={EXPANSION_STATUS_LABELS[row.expansionStatus ?? 'active']}
                variant={row.expansionStatus === 'active' ? 'success' : 'warning'}
              />
            ),
          } as Column<Location>,
        ]
      : []),
    {
      key: 'coverage',
      header: 'Coverage',
      render: (row) => {
        const s = row.serviceability;
        if (!s) return <span className="text-sm text-gray-400">Not configured</span>;
        return (
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap gap-1">
              <Chip on={s.serviceable}>Serviceable</Chip>
              <Chip on={s.deliveryAvailable}>Delivery</Chip>
              <Chip on={s.pickupAvailable}>Pickup</Chip>
              <Chip on={s.codAvailable}>COD</Chip>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {s.estimatedDeliveryTime ? `${s.estimatedDeliveryTime} · ` : ''}
              {typeof s.deliveryFee === 'number' ? `fee ${s.deliveryFee}` : ''}
            </span>
          </div>
        );
      },
    },
    {
      key: 'config',
      header: 'Capacity & configuration',
      render: (row) => {
        const port = row.port?.isPort ? row.port : undefined;
        const hours = row.serviceability?.operatingHours;
        const bits: string[] = [];
        if (port) bits.push(`Port: ${port.portName ?? row.name}`);
        if (port?.capacity != null) bits.push(`capacity ${port.capacity}`);
        if (port?.operatingStatus) bits.push(port.operatingStatus);
        if (hours?.open && hours?.close) bits.push(`${hours.open}–${hours.close}`);
        if (row.coordinates?.coordinates?.length === 2) bits.push('mapped');
        if (bits.length === 0) return <span className="text-sm text-gray-400">—</span>;
        return (
          <span className="text-xs text-gray-600 dark:text-gray-400">{bits.join(' · ')}</span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <RowActions
          onView={() => setDetail(row)}
          onEdit={() => setEditing(row)}
          onManage={() =>
            row.isActive ? setConfirmDeactivate(row) : void activate(row)
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
                ['Type', typeLabel(detail.type)],
                ['Code', detail.code],
                ['Parent', parentOf(detail.parentId)?.name ?? (detail.parentId ? 'Unknown parent' : 'Top level')],
                ['Status', detail.isActive ? 'Active' : 'Inactive'],
                ['Serviceable', detail.serviceability?.serviceable ? 'Yes' : 'No'],
                ['Delivery available', detail.serviceability?.deliveryAvailable ? 'Yes' : 'No'],
                ['Pickup available', detail.serviceability?.pickupAvailable ? 'Yes' : 'No'],
                ['COD available', detail.serviceability?.codAvailable ? 'Yes' : 'No'],
                ['Delivery fee', detail.serviceability?.deliveryFee],
                ['Estimated delivery time', detail.serviceability?.estimatedDeliveryTime],
                ['Minimum order', detail.serviceability?.minimumOrder],
              ]}
            />
          ),
        },
        {
          id: 'configuration',
          label: 'Port & configuration',
          content: (
            <Facts
              items={[
                ['Port', detail.port?.isPort ? (detail.port.portName ?? 'Yes') : 'No'],
                ['Port code', detail.port?.portCode],
                ['Port capacity', detail.port?.capacity],
                ['Port status', detail.port?.isPort ? detail.port.operatingStatus : undefined],
                ['Port address', detail.port?.portAddress],
                ['Operating hours', detail.serviceability?.operatingHours?.open
                  ? `${detail.serviceability.operatingHours.open}–${detail.serviceability.operatingHours.close}`
                  : undefined],
                ['Free delivery over', detail.serviceability?.freeDeliveryThreshold],
              ]}
            />
          ),
        },
      ]
    : [];

  return (
    <section aria-labelledby={`panel-${heading.replace(/\s+/g, '-').toLowerCase()}`}>
      <div className="mb-3">
        <h2
          id={`panel-${heading.replace(/\s+/g, '-').toLowerCase()}`}
          className="text-lg font-semibold dark:text-white"
        >
          {heading}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder={`Search ${heading.toLowerCase()}…`}
        isFiltered={isFiltered}
        onReset={reset}
        resultSummary={`${
          isMultiStage
            ? `${visibleRows.length}+`
            : pickupOnly
              ? `${visibleRows.length}`
              : (data?.total ?? 0)
        } record${(isMultiStage ? visibleRows.length : (data?.total ?? 0)) === 1 ? '' : 's'}`}
        actions={
          <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
            {addLabel}
          </Button>
        }
        filters={[
          ...(lockedType || stageList
            ? []
            : [
                {
                  key: 'type',
                  label: 'Type',
                  value: type,
                  onChange: (v: string) => { setType(v); setPage(1); },
                  options: [{ value: '', label: 'All Types' }, ...(typeOptions ?? LOCATION_TYPES.filter((t) => t.value))],
                },
              ]),
          {
            key: 'status',
            label: 'Status',
            value: status,
            onChange: (v: string) => { setStatus(v); setPage(1); },
            options: LOCATION_STATUSES,
          },
        ]}
      />

      <DataSection
        error={loadError}
        onRetry={reload}
        isEmpty={!busyState && visibleRows.length === 0}
        emptyTitle={isFiltered ? `No records match these filters` : emptyTitle}
        emptyDescription={isFiltered ? 'Try resetting the filters above.' : emptyDescription}
        emptyAction={isFiltered ? undefined : { label: addLabel, onClick: () => setCreating(true) }}
      >
        <DataTable
          columns={columns}
          rows={visibleRows}
          rowKey={(row) => row._id}
          loading={busyState}
          emptyTitle={emptyTitle}
          onRowClick={(row) => setDetail(row)}
        />
        {/* Server pagination applies everywhere except the merged multi-stage read. */}
        {!isMultiStage && (
          <Pagination
            className="mt-4"
            page={page}
            totalPages={data?.totalPages ?? 1}
            total={data?.total}
            onPageChange={setPage}
          />
        )}
      </DataSection>

      {creating && (
        <Modal open onClose={() => setCreating(false)} title={addLabel} size="lg">
          <EnhancedLocationForm
            onSuccess={() => { setCreating(false); reload(); }}
            onCancel={() => setCreating(false)}
          />
        </Modal>
      )}
      {editing && (
        <Modal open onClose={() => setEditing(null)} title={`Edit ${editing.name}`} size="lg">
          <EnhancedLocationForm
            initial={editing}
            onSuccess={() => { setEditing(null); reload(); }}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      <ConfirmDialog
        open={!!confirmDeactivate}
        onClose={() => setConfirmDeactivate(null)}
        onConfirm={deactivate}
        title={`Deactivate ${confirmDeactivate?.name ?? 'location'}?`}
        message="The location stops being offered for new delivery coverage. You can activate it again at any time."
        confirmLabel="Deactivate"
        loading={busy}
      />

      <RecordDrawer
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.name ?? ''}
        subtitle={detail ? typeLabel(detail.type) : undefined}
        statusLabel={detail?.isActive ? 'Active' : 'Inactive'}
        statusVariant={detail?.isActive ? 'success' : 'neutral'}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => detail && setEditing(detail)}>
              Edit
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (!detail) return;
                if (detail.isActive) setConfirmDeactivate(detail);
                else void activate(detail);
              }}
            >
              {detail?.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </>
        }
        summary={[
          { label: 'Type', value: detail ? typeLabel(detail.type) : '—' },
          { label: 'Parent', value: detail ? (parentOf(detail.parentId)?.name ?? (detail.parentId ? 'Unknown' : 'Top level')) : '—' },
          { label: 'Serviceable', value: detail?.serviceability?.serviceable ? 'Yes' : 'No' },
        ]}
        tabs={detailTabs}
        activeTab="overview"
      />

      {actionError && <p role="alert" className="mt-2 text-sm text-red-600">{actionError}</p>}
    </section>
  );
}
