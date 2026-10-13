/**
 * Deliveries — the main operational delivery list.
 *
 * One row per delivery, showing the record's identity, who moves it, and its
 * current position in the CANONICAL lifecycle. The admin views and operates
 * from here: the detail panel offers only the transitions the backend allows
 * from the delivery's CURRENT state, so there is no free-form status editor and
 * no invented status name anywhere.
 */
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { Tabs } from '@/components/common/Tabs';
import { Pagination } from '@/components/common/Pagination';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { FilterBar } from '@/components/workspace/FilterBar';
import { DataSection } from '@/components/workspace/DataSection';
import { formatDateTime } from '@/utils/format';
import { ADMIN_DELIVERY_STATUS_FILTERS, EXCEPTIONAL_DELIVERY_STATUSES } from './constants';
import { deliveryAdmin } from '@/api/admin';
import { deliveryServicesService } from '@/services/deliveryServices.service';
import { locationsService, zonesService } from '@/services/locations.service';
import { DeliveryStatusPill } from './components/DeliveryStatusPill';
import { DeliveryDetailPanel } from './DeliveryDetailPanel';
import { StatusChangeDialog } from './components/StatusChangeDialog';
import { getDeliveryRef, getDeliveryDocumentId, getDeliveryStatusLabel } from './utils/statusHelpers';
import { TrackingView } from './TrackingView';
import type { Delivery } from './types';
import { ApiError } from '@/types/api';

const LIMIT = 20;


const place = (a?: Delivery['destinationAddress']) =>
  [a?.cityName, a?.regionName].filter(Boolean).join(', ');

export function DeliveriesPage() {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(searchParams.get('orderId') ?? '');
  const [status, setStatus] = useState(searchParams.get('status') ?? '');
  const [serviceId, setServiceId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // One operational screen: the delivery list and the tracking view are two
  // views of the SAME records, not two pages with two copies of the state.
  const [view, setView] = useState<'deliveries' | 'tracking'>(
    searchParams.get('view') === 'tracking' ? 'tracking' : 'deliveries'
  );

  const [detail, setDetail] = useState<Delivery | null>(null);
  const [changeReq, setChangeReq] = useState<{ row: Delivery; next: string } | null>(null);
  const [changeError, setChangeError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  // One date picker covers a full day: [00:00, 23:59:59.999].
  const from = dateFrom ? `${dateFrom}T00:00:00` : '';
  const to = dateTo ? `${dateTo}T23:59:59.999` : '';

  const {
    data,
    loading,
    error,
    refetch,
  } = useAsync(
    async () => {
      const extra: Record<string, string> = {};
      if (serviceId) extra.serviceId = serviceId;
      if (zoneId) extra.zoneId = zoneId;
      if (from) extra.dateFrom = from;
      if (to) extra.dateTo = to;
      const res = await deliveryAdmin.listDeliveries(
        page,
        LIMIT,
        status || '',
        debouncedSearch || '',
        extra
      );
      return res;
    },
    [page, status, debouncedSearch, serviceId, zoneId, from, to]
  );

  /** Filter option sources; a failure here must not break the list. */
  const { data: options } = useAsync(async () => {
    const [services, zones, locations] = await Promise.all([
      deliveryServicesService.list({ page: 1, limit: 200 }).catch(() => ({ items: [] })),
      zonesService.list({ page: 1, limit: 200 }).catch(() => ({ zones: [] })),
      locationsService.list({ limit: 200 }).catch(() => []),
    ]);
    return {
      services: services?.items ?? [],
      zones: zones?.zones ?? [],
      locations: locations ?? [],
    };
  }, []);

  const rows = data?.items ?? [];
  const isFiltered = !!(search || status || serviceId || zoneId || dateFrom || dateTo);

  const reset = () => {
    setSearch('');
    setStatus('');
    setServiceId('');
    setZoneId('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  /** Fire a transition the panel already validated against the current state. */
  const confirmStatusChange = async (extra: Record<string, unknown>) => {
    if (!changeReq) return;
    setActionLoading(true);
    setChangeError(null);
    try {
      await deliveryAdmin.updateDeliveryStatus(changeReq.row.id, changeReq.next, extra);
      showToast({
        type: 'success',
        message: `Delivery ${changeReq.row.orderId} → ${getDeliveryStatusLabel(changeReq.next)}`,
      });
      setChangeReq(null);
      refetch();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to change delivery status';
      setChangeError(message);
      showToast({ type: 'error', message });
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<Delivery>[] = [
    {
      key: 'delivery',
      header: 'Delivery',
      render: (row) => (
        <span className="text-sm text-gray-800 dark:text-gray-100" title={getDeliveryDocumentId(row)}>
          {getDeliveryRef(row)}
        </span>
      ),
    },
    {
      key: 'orderId',
      header: 'Order ID',
      render: (row) => (
        <span className="font-medium text-gray-800 dark:text-gray-100">{row.orderId}</span>
      ),
    },
    {
      key: 'seller',
      header: 'Seller / Shop',
      accessor: (row) => row.shopName || row.sellerName || '—',
    },
    {
      key: 'destination',
      header: 'Buyer / Destination',
      render: (row) => {
        const text = place(row.destinationAddress ?? row.deliveryAddress);
        return (
          <span className="text-sm text-gray-600 dark:text-gray-400" title={text}>
            {text || '—'}
          </span>
        );
      },
    },
    {
      key: 'provider',
      header: 'Provider / Rider',
      render: (row) =>
        row.providerName || row.partnerName ? (
          <span className="text-sm text-gray-700 dark:text-gray-200">
            {row.providerName || row.partnerName}
          </span>
        ) : (
          <span className="text-sm text-gray-400">Unassigned</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div className="flex items-center gap-2">
          <DeliveryStatusPill status={row.status} />
          {EXCEPTIONAL_DELIVERY_STATUSES.includes(row.status || '') && (
            <span className="text-[11px] uppercase tracking-wide text-red-600 dark:text-red-400">
              Exceptional
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created time',
      render: (row) => (
        <span className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(row.createdAt)}</span>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Last update',
      render: (row) => (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatDateTime(row.updatedAt ?? row.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setDetail(row);
          }}
          className="text-primary-dark hover:underline"
        >
          View
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Deliveries"
        description="Every delivery, its place in the lifecycle, and where it is right now."
      />

      <Tabs
        activeTab={view}
        onChange={(id) => setView(id as 'deliveries' | 'tracking')}
        tabs={[
          { value: 'deliveries', label: 'Deliveries' },
          { value: 'tracking', label: 'Tracking' },
        ]}
      />

      {view === 'tracking' ? (
        <TrackingView
          onOpenRecord={(row) => {
            // "Open delivery record" from the Track panel: switch to the
            // Deliveries tab, narrow the list to this order and open its
            // panel. A URL navigation could not do this — TrackingView is a
            // tab of THIS page, so only a query string changed and nothing
            // on screen reacted to it. Other filters are cleared so an
            // active status/service filter cannot hide the row we jump to
            // (the backend `search` matches orderId).
            setView('deliveries');
            setStatus('');
            setServiceId('');
            setZoneId('');
            setDateFrom('');
            setDateTo('');
            setSearch(row.orderId ?? '');
            setPage(1);
            setDetail(row);
          }}
        />
      ) : (
        <>

      <FilterBar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search order ID or address"
        isFiltered={isFiltered}
        onReset={reset}
        resultSummary={
          data?.total !== undefined
            ? `${data.total} deliver${data.total === 1 ? 'y' : 'ies'}${isFiltered ? ' matching filters' : ''}`
            : undefined
        }
        filters={[
          {
            key: 'status',
            label: 'Status',
            value: status,
            onChange: (v: string) => { setStatus(v); setPage(1); },
            // Only the states the Admin actually operates on (MVP scope).
            options: ADMIN_DELIVERY_STATUS_FILTERS.map((s) => ({ ...s })),
          },
          {
            key: 'service',
            label: 'Service',
            value: serviceId,
            onChange: (v: string) => { setServiceId(v); setPage(1); },
            options: [
              { value: '', label: 'All Services' },
              ...(options?.services ?? []).map((s) => ({ value: s._id, label: s.name })),
            ],
          },
          {
            key: 'zone',
            label: 'Zone',
            value: zoneId,
            onChange: (v: string) => { setZoneId(v); setPage(1); },
            options: [
              { value: '', label: 'All Zones' },
              ...(options?.zones ?? []).map((z) => ({ value: z._id, label: z.name })),
            ],
          },
          {
            key: 'dateFrom',
            label: 'From',
            value: dateFrom,
            type: 'date',
            onChange: (v: string) => { setDateFrom(v); setPage(1); },
          },
          {
            key: 'dateTo',
            label: 'To',
            value: dateTo,
            type: 'date',
            onChange: (v: string) => { setDateTo(v); setPage(1); },
          },
        ]}
      />

      <DataSection
        error={error}
        onRetry={refetch}
        isEmpty={!loading && rows.length === 0}
        emptyTitle={isFiltered ? 'No deliveries match these filters' : 'No deliveries yet'}
        emptyDescription={
          isFiltered
            ? 'Try widening or resetting the filters above.'
            : 'Deliveries appear here once delivery requests are materialized.'
        }
      >
        <DataTable<Delivery>
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          loading={loading}
          emptyTitle="No deliveries found"
          onRowClick={(row) => setDetail(row)}
        />
        <Pagination
          className="mt-4"
          page={data?.page ?? page}
          totalPages={data?.totalPages ?? 0}
          total={data?.total}
          onPageChange={setPage}
        />
      </DataSection>

      {/* The delivery record: view + operate through valid actions only. */}
      <DeliveryDetailPanel
        delivery={detail}
        open={!!detail}
        onClose={() => setDetail(null)}
        onRequestTransition={(row, next) => { setChangeError(null); setChangeReq({ row, next }); }}
      />

      {/* Collects the reason / proof the transition needs, then confirms it. */}
      <StatusChangeDialog
        open={!!changeReq}
        delivery={changeReq?.row ?? null}
        nextStatus={changeReq?.next ?? ''}
        busy={actionLoading}
        error={changeError}
        onClose={() => { setChangeReq(null); setChangeError(null); }}
        onConfirm={confirmStatusChange}
      />
        </>
      )}
    </div>
  );
}
