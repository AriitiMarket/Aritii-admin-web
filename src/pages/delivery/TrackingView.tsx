/**
 * Tracking — where deliveries are and how they got there.
 *
 * SCOPE RULE: this page is LOCATION + HISTORY only.
 *   - The status shown in the list is the delivery record's own canonical
 *     status (GET /delivery/delivery), never a value derived from the event feed
 *     and never a page-local "tracking status".
 *   - Nothing here writes a status or a coordinate. Status changes live on the
 *     Deliveries page; recording a location ping is provider work.
 *   - Stale or missing location is surfaced as a DATA-FRESHNESS badge, which is
 *     visibly separate from the status pill and never masquerades as one.
 *
 * Existing contracts used, none added:
 *   GET /delivery/delivery?status=<csv>&page&limit   the active tracking list
 *   GET /delivery/tracking/:deliveryId               movement history
 *   GET /delivery/tracking/:deliveryId/latest        current location
 *
 * The list is a TABLE with one "Track" button per row that opens a single
 * scrollable detail panel — deliberately simple; there is no "nearby events"
 * cross-delivery view (it confused operators, and no endpoint asks for one).
 *
 * There is NO "list tracked deliveries" endpoint, so the list is the delivery
 * list narrowed to the ACTIVE statuses (the service accepts a comma-separated
 * status filter), and location is resolved per delivery.
 */
import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { FilterBar } from '@/components/workspace/FilterBar';
import { DataSection } from '@/components/workspace/DataSection';
import { Pagination } from '@/components/common/Pagination';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { ApiError } from '@/types/api';
import { formatDateTime } from '@/utils/format';
import { http } from '@/services/client/httpClient';
import { trackingService, type TrackingEvent, type TrackingLocation } from '@/services/tracking.service';
import type { Delivery } from './types';
import { DeliveryStatusPill } from './components/DeliveryStatusPill';
import { getDeliveryRef, getDeliveryDocumentId, getDeliveryStatusLabel } from './utils/statusHelpers';
import { BLOCKED_DELIVERY_STATUSES, DELIVERY_STATUSES } from './constants';
import { TrackingDetailDrawer } from './tracking/TrackingDetailDrawer';
import {
  LOCATION_FRESHNESS,
  getLocationFreshness,
  relativeAge,
  formatCoordinates,
  type LocationFreshness,
} from './tracking/trackingHelpers';

/**
 * A delivery worth tracking: still moving, not finished.
 *
 * Derived from the canonical `DELIVERY_STATUSES` so this page can never ask the
 * API for a status the Delivery Service does not know (it answers 400 for an
 * unknown filter, which used to blank the tracking list).
 */
// Derived from the ONE blocked/terminal set in the module. This page used to
// carry its own list that omitted `failed`, so a failed delivery stayed in the
// "active tracking" list while the Overview page treated it as finished.
const ACTIVE_TRACKED_STATUSES = DELIVERY_STATUSES.map((s) => s.value).filter(
  (value) => !!value && !BLOCKED_DELIVERY_STATUSES.includes(value)
);

/** One row of the active tracking list. */
interface TrackedDelivery {
  delivery: Delivery;
  location: TrackingLocation | null;
}

const destOf = (d: Delivery) => {
  const a = d.destinationAddress ?? d.deliveryAddress;
  return [a?.cityName, a?.regionName].filter(Boolean).join(', ');
};

/**
 * Tracking as a VIEW of the deliveries screen.
 *
 * It deliberately renders no page header and owns no status editing: the
 * delivery record is the single source of truth, so the operator works on one
 * screen instead of hopping between two lists of the same deliveries.
 *
 * `onOpenRecord` hands the already-loaded record back to the parent
 * (DeliveriesPage), which switches to the Deliveries tab and opens the detail
 * panel. Navigating by URL could not work here: this view is a tab OF that
 * page, so a query-param URL change never remounts it and nothing happened.
 */
export function TrackingView({
  onOpenRecord,
}: {
  onOpenRecord: (delivery: Delivery) => void;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** Bumped by Refresh to re-pull locations as well as the list. */
  const [refreshKey, setRefreshKey] = useState(0);

  const debouncedSearch = useDebounce(search, 300);
  const isFiltered = !!(debouncedSearch || status);

  const list = useAsync(async () => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '25');
    // Narrow to the movement statuses; a comma-separated list is accepted by the
    // delivery list validator, so one request covers the whole active set.
    params.set('status', status || ACTIVE_TRACKED_STATUSES.join(','));
    if (debouncedSearch) params.set('orderId', debouncedSearch);
    const res = await http.get<{
      deliveries?: (Delivery & { _id?: string })[];
      total?: number;
      totalPages?: number;
      page?: number;
    }>(`/delivery/delivery?${params.toString()}`);
    return {
      deliveries: (res.deliveries ?? []).map((d) => ({ ...d, id: d._id || d.id })),
      total: res.total ?? 0,
      totalPages: res.totalPages ?? 1,
      page: res.page ?? page,
    };
  }, [page, status, debouncedSearch, refreshKey]);

  /**
   * Latest location per listed delivery.
   *
   * One request for the whole page (GET /delivery/tracking/latest?deliveryIds=…)
   * instead of one per row — a 25-row page used to cost 25 round trips. A
   * delivery the caller may not read is simply absent from the map and shows
   * as "No location".
   */
  const locations = useAsync(async () => {
    const rows = list.data?.deliveries ?? [];
    if (!rows.length) return new Map<string, TrackingLocation | null>();
    return trackingService.getLatestLocations(rows.map((d) => d.id));
  }, [list.data]);

  const detail = useAsync(async () => {
    if (!selectedId) return { delivery: null, events: [] as TrackingEvent[], location: null };
    // The tracking routes are keyed by delivery id, so a search by ORDER id has
    // to be resolved to the delivery id from the list first.
    const fromList = (list.data?.deliveries ?? []).find((d) => d.id === selectedId);
    const resolved =
      fromList ??
      (await http
        .get<{ delivery?: Delivery & { _id?: string } }>(`/delivery/delivery/${selectedId}`)
        .then((r) => (r.delivery ? { ...r.delivery, id: r.delivery._id || r.delivery.id } : null))
        .catch(() => null));
    if (!resolved) throw new ApiError(404, 'Delivery not found', 'NOT_FOUND');
    const [events, location] = await Promise.all([
      trackingService.getEvents(resolved.id),
      trackingService.getLatestLocation(resolved.id).catch(() => null),
    ]);
    return { delivery: resolved, events, location };
  }, [selectedId, refreshKey]);

  const locationOf = useCallback(
    (id: string): TrackingLocation | null => locations.data?.get(id) ?? null,
    [locations.data]
  );

  const freshnessOf = useCallback((loc: TrackingLocation | null): LocationFreshness => {
    return getLocationFreshness(loc?.timestamp);
  }, []);

  const rows: TrackedDelivery[] = useMemo(
    () => (list.data?.deliveries ?? []).map((delivery) => ({ delivery, location: locationOf(delivery.id) })),
    [list.data, locationOf]
  );

  const selectedLocation = detail.data?.location ?? null;

  const columns: Column<TrackedDelivery>[] = [
    {
      key: 'delivery',
      header: 'Delivery ID',
      render: ({ delivery }) => (
        <div className="min-w-0" title={getDeliveryDocumentId(delivery)}>
          <p className="font-medium text-gray-900 dark:text-white">{getDeliveryRef(delivery)}</p>
          {delivery.orderId ? (
            <p className="text-xs text-gray-500">Order {delivery.orderId}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Current status',
      render: ({ delivery }) => <DeliveryStatusPill status={delivery.status} />,
    },
    {
      key: 'provider',
      header: 'Provider / rider',
      render: ({ delivery }) => (
        <span className="text-sm">
          {delivery.providerName || delivery.partnerName || <span className="text-gray-400">Unassigned</span>}
        </span>
      ),
    },
    {
      key: 'location',
      header: 'Current location',
      render: ({ location, delivery }) => {
        const freshness = freshnessOf(location);
        const coords = formatCoordinates(location?.coordinates);
        if (freshness === 'none' || !coords) {
          return (
            <div>
              <StatusBadge label="No location" variant="neutral" />
              <p className="mt-0.5 text-xs text-gray-400">No ping reported yet</p>
            </div>
          );
        }
        const meta = LOCATION_FRESHNESS[freshness];
        return (
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge label={meta.label} variant={meta.variant} />
              <span className="text-xs text-gray-500">{relativeAge(location?.timestamp)}</span>
            </div>
            <p className="mt-0.5 font-mono text-xs text-gray-500">{coords}</p>
            <p className="text-xs text-gray-400" title={meta.hint}>
              {delivery.status === 'pending'
                ? 'Not moving yet — position is from the pickup area'
                : meta.hint}
            </p>
          </div>
        );
      },
    },
    {
      key: 'updated',
      header: 'Last update',
      render: ({ delivery }) => (
        <div className="whitespace-nowrap">
          <p className="text-sm">{formatDateTime(delivery.updatedAt)}</p>
          <p className="text-xs text-gray-500">{relativeAge(delivery.updatedAt)}</p>
        </div>
      ),
    },
    {
      key: 'destination',
      header: 'Destination',
      render: ({ delivery }) => (
        <span className="text-sm">{destOf(delivery) || <span className="text-gray-400">—</span>}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: ({ delivery }) => (
        <Button size="sm" variant="ghost" onClick={() => setSelectedId(delivery.id)}>
          Track
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Where each active delivery is right now. The status shown is the delivery record&rsquo;s own
          status — tracking never changes it.
        </p>
        <Button variant="outline" size="sm" onClick={() => setRefreshKey((k) => k + 1)}>
          Refresh
        </Button>
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by order ID"
        filters={[
          {
            key: 'status',
            label: 'Status',
            value: status,
            // Tracking follows live movement only: finished deliveries are on
            // the Deliveries list. Derived from the canonical active set, so a
            // new in-flight status cannot be forgotten here (the previous
            // hand-written list still offered `out_for_delivery`, a status the
            // service cannot produce, and silently omitted `pending`).
            options: [
              { value: '', label: 'All active' },
              ...ACTIVE_TRACKED_STATUSES.map((value) => ({
                value,
                label: getDeliveryStatusLabel(value),
              })),
            ],
            onChange: (v) => { setStatus(v); setPage(1); },
          },
        ]}
        onReset={() => { setSearch(''); setStatus(''); setPage(1); }}
        isFiltered={isFiltered}
        resultSummary={
          list.data ? `${list.data.total} active deliver${list.data.total === 1 ? 'y' : 'ies'}` : undefined
        }
      />

      <DataSection
        error={list.error}
        onRetry={list.refetch}
        isEmpty={!list.loading && rows.length === 0}
        emptyTitle={isFiltered ? 'No active deliveries match' : 'Nothing in transit'}
        emptyDescription={
          isFiltered
            ? 'Try clearing the filters.'
            : 'Deliveries appear here once they are assigned and moving.'
        }
      >
        <DataTable<TrackedDelivery>
          columns={columns}
          rows={rows}
          rowKey={(row) => row.delivery.id}
          loading={list.loading || (locations.loading && rows.length > 0)}
          onRowClick={(row) => setSelectedId(row.delivery.id)}
        />
        <Pagination
          className="mt-4"
          page={list.data?.page ?? page}
          totalPages={list.data?.totalPages ?? 1}
          total={list.data?.total}
          onPageChange={setPage}
        />
      </DataSection>

      <TrackingDetailDrawer
        delivery={detail.data?.delivery ?? null}
        events={detail.data?.events ?? []}
        location={selectedLocation}
        open={!!selectedId}
        loading={detail.loading}
        error={detail.error}
        onClose={() => setSelectedId(null)}
        onRetry={detail.refetch}
        onOpenDelivery={() => {
          const d = detail.data?.delivery;
          if (d) onOpenRecord(d);
        }}
      />
    </div>
  );
}
