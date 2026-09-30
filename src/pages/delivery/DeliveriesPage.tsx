import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Pagination } from '@/components/common/Pagination';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { FilterBar } from '@/components/workspace/FilterBar';
import { DataSection } from '@/components/workspace/DataSection';
import { formatDate } from '@/utils/format';
import { DELIVERY_STATUSES } from './constants';
import { deliveryAdmin } from '@/api/admin';
import { deliveryServicesService } from '@/services/deliveryServices.service';
import { locationsService, zonesService } from '@/services/locations.service';
import { getDeliveryStatusColor, getManualTransitions } from './utils/statusHelpers';
import { StatusChangeDialog } from './components/StatusChangeDialog';
import type { Delivery } from './types';
import { useToast } from '@/hooks/useToast';
import { ApiError } from '@/types/api';

/** Delivery detail (history) modal. /delivery/delivery/:id/history -> { timeline, trackingEvents, assignmentHistory }. */
function HistoryModal({ delivery, open, onClose }: { delivery: Delivery | null; open: boolean; onClose: () => void }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [timeline, setTimeline] = useState<{ stage: string; label: string; timestamp: string | null; status: string; note: string }[]>([]);
  const [trackingEvents, setTrackingEvents] = useState<{ stage: string; label: string; timestamp: string; note: string }[]>([]);
  const [assignmentHistory, setAssignmentHistory] = useState<{ status: string; actorName?: string; at?: string }[]>([]);

  useEffect(() => {
    if (!delivery) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await deliveryAdmin.getDeliveryHistory(delivery.id);
        if (cancelled) return;
        const ordered = (res.timeline ?? []).concat(res.trackingEvents ?? []);
        setTimeline(ordered as typeof timeline);
        setTrackingEvents(res.trackingEvents ?? []);
        setAssignmentHistory(res.assignmentHistory ?? []);
      } catch (err) {
        if (!cancelled) {
          showToast({
            type: 'error',
            message: err instanceof ApiError ? err.message : 'Failed to load delivery history',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delivery]);

  if (!open || !delivery) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delivery History: {delivery.orderId}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <>
            <Card className="mb-4">
              <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Operational timeline</h4>
              <ul className="space-y-2">
                {timeline.map((t, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="w-24 shrink-0 text-xs text-gray-500">{t.timestamp ? formatDate(t.timestamp) : '—'}</span>
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-dark-800 dark:text-gray-300">
                      {t.label}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">{t.note || '—'}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="mb-4">
              <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Tracking events</h4>
              <ul className="space-y-2">
                {trackingEvents.map((e, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="w-24 shrink-0 text-xs text-gray-500">{formatDate(e.timestamp)}</span>
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300">
                      {e.label}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">{e.note || '—'}</span>
                  </li>
                ))}
                {trackingEvents.length === 0 && <li className="text-sm text-gray-500">No tracking events</li>}
              </ul>
            </Card>
            <Card>
              <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Assignment history</h4>
              <ul className="space-y-2">
                {assignmentHistory.map((h, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="w-24 shrink-0 text-xs text-gray-500">{h.at || '—'}</span>
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-dark-800 dark:text-gray-300">
                      {h.status}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">{h.actorName || '—'}</span>
                  </li>
                ))}
                {assignmentHistory.length === 0 && <li className="text-sm text-gray-500">No assignment history</li>}
              </ul>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

export function DeliveriesPage() {
  // Deep links (?status=, ?orderId=) from the Overview cards and the
  // Requests page pre-filter this list on mount.
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(() => searchParams.get('orderId') ?? '');
  const [status, setStatus] = useState(() => searchParams.get('status') ?? '');
  const [serviceId, setServiceId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [sectorId, setSectorId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [detail, setDetail] = useState<Delivery | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [changeReq, setChangeReq] = useState<{ row: Delivery; next: string } | null>(null);
  const [changeError, setChangeError] = useState<string | null>(null);
  const { showToast } = useToast();

  const debouncedSearch = useDebounce(search, 300);
  const isFiltered = !!(
    debouncedSearch || status || serviceId || zoneId || sectorId || dateFrom || dateTo
  );

  // Filter options: service catalog, zones, sectors. Failures never break the list.
  const { data: options } = useAsync(async () => {
    const [services, zones, sectors] = await Promise.all([
      deliveryServicesService.list({ page: 1, limit: 200 }).catch(() => null),
      zonesService.list({ page: 1, limit: 200 }).catch(() => null),
      locationsService.list({ type: 'sector', limit: 200 }).catch(() => null),
    ]);
    return {
      services: services?.items ?? [],
      zones: zones?.zones ?? [],
      sectors: sectors ?? [],
    };
  }, []);

  const limit = 20;
  const { data, loading, error, refetch } = useAsync(
    async () => {
      const extra: Record<string, string> = {};
      if (serviceId) extra.serviceId = serviceId;
      if (zoneId) extra.zoneId = zoneId;
      if (sectorId) extra.sectorId = sectorId;
      // One date covers the whole day: [00:00, 23:59:59.999].
      if (dateFrom) extra.dateFrom = `${dateFrom}T00:00:00`;
      if (dateTo) extra.dateTo = `${dateTo}T23:59:59.999`;
      return deliveryAdmin.listDeliveries(page, limit, status || '', debouncedSearch || '', extra);
    },
    [page, status, debouncedSearch, serviceId, zoneId, sectorId, dateFrom, dateTo]
  );

  const columns: Column<Delivery>[] = [
    {
      key: 'orderId',
      header: 'Order',
      render: (row) => (
        <span className="font-medium text-gray-800 dark:text-gray-100">{row.orderId || '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getDeliveryStatusColor(row.status || '')}`}>
          {(row.status || '—').replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'partnerName',
      header: 'Rider',
      render: (row) => (
        <span className="text-sm text-gray-800 dark:text-gray-100">{row.providerName || row.partnerName || (row.providerId ? 'Assigned' : <span className="text-gray-400">Unassigned</span>)}</span>
      ),
    },
    {
      key: 'pickupAddress',
      header: 'Pickup',
      render: (row) => {
        const addr = row.pickupAddress;
        const location = [addr?.sectorName, addr?.cityName, addr?.regionName].filter(Boolean).join(', ');
        return (
          <div className="text-sm">
            <p className="font-medium text-gray-800 dark:text-gray-100">{addr?.shopName || '—'}</p>
            <p className="text-gray-500 dark:text-gray-400">{location || '—'}</p>
          </div>
        );
      },
    },
    {
      key: 'destinationAddress',
      header: 'Destination',
      render: (row) => {
        const addr = row.destinationAddress || row.deliveryAddress;
        const location = [addr?.sectorName, addr?.areaName, addr?.cityName, addr?.regionName].filter(Boolean).join(', ');
        return (
          <div className="text-sm">
            <p className="font-medium text-gray-800 dark:text-gray-100">{addr?.contactName || '—'}</p>
            <p className="text-gray-500 dark:text-gray-400">{location || '—'}</p>
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          <Button size="sm" variant="ghost" onClick={() => { setDetail(row); setDetailOpen(true); }}>
            History
          </Button>
          {row.status && getManualTransitions(row.status).map((t) => (
            <Button
              key={t}
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setChangeError(null);
                setChangeReq({ row, next: t });
              }}
              disabled={actionLoading}
            >
              {t.replace(/_/g, ' ')}
            </Button>
          ))}
        </div>
      ),
    },
  ];

  /** Fire the requested transition with the payload the dialog collected. */
  const confirmStatusChange = async (extra: Record<string, unknown>) => {
    if (!changeReq) return;
    setActionLoading(true);
    setChangeError(null);
    try {
      await deliveryAdmin.updateDeliveryStatus(changeReq.row.id, changeReq.next, extra);
      setChangeReq(null);
      refetch();
      showToast({
        type: 'success',
        message: `Delivery ${changeReq.row.orderId} → ${changeReq.next.replace(/_/g, ' ')}`,
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to change delivery status';
      setChangeError(message);
      showToast({ type: 'error', message });
    } finally {
      setActionLoading(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setStatus('');
    setServiceId('');
    setZoneId('');
    setSectorId('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Deliveries"
        description="Operational deliveries, their status and live transitions"
      />

      <FilterBar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search order ID / address"
        filters={[
          {
            key: 'status',
            label: 'Status',
            value: status,
            options: DELIVERY_STATUSES,
            onChange: (v) => { setStatus(v); setPage(1); },
          },
          {
            key: 'service',
            label: 'Service',
            value: serviceId,
            options: [
              { value: '', label: 'All Services' },
              ...(options?.services ?? []).map((s) => ({ value: s._id, label: s.name })),
            ],
            onChange: (v) => { setServiceId(v); setPage(1); },
          },
          {
            key: 'zone',
            label: 'Zone',
            value: zoneId,
            options: [
              { value: '', label: 'All Zones' },
              ...(options?.zones ?? []).map((z) => ({ value: z._id, label: z.name })),
            ],
            onChange: (v) => { setZoneId(v); setPage(1); },
          },
          {
            key: 'sector',
            label: 'Sector',
            value: sectorId,
            options: [
              { value: '', label: 'All Sectors' },
              ...(options?.sectors ?? []).map((s) => ({ value: s._id, label: s.name })),
            ],
            onChange: (v) => { setSectorId(v); setPage(1); },
          },
          {
            key: 'dateFrom',
            label: 'From',
            value: dateFrom,
            type: 'date',
            onChange: (v) => { setDateFrom(v); setPage(1); },
          },
          {
            key: 'dateTo',
            label: 'To',
            value: dateTo,
            type: 'date',
            onChange: (v) => { setDateTo(v); setPage(1); },
          },
        ]}
        onReset={resetFilters}
        isFiltered={isFiltered}
        resultSummary={
          data?.total !== undefined
            ? `${data.total} deliver${data.total === 1 ? 'y' : 'ies'}${isFiltered ? ' matching filters' : ''}`
            : undefined
        }
      />

      <DataSection
        error={error}
        onRetry={refetch}
        isEmpty={!loading && (data?.items ?? []).length === 0}
        emptyTitle={isFiltered ? 'No deliveries match these filters' : 'No deliveries yet'}
        emptyDescription="Deliveries appear here once delivery requests are handed over and materialize."
      >
        <DataTable<Delivery>
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(row) => row.id}
          loading={loading}
        />
        <Pagination
          className="mt-4"
          page={data?.page ?? page}
          totalPages={data?.totalPages ?? 0}
          total={data?.total}
          onPageChange={setPage}
        />
      </DataSection>

      <HistoryModal delivery={detail} open={detailOpen} onClose={() => { setDetailOpen(false); setDetail(null); }} />

      <StatusChangeDialog
        open={!!changeReq}
        delivery={changeReq?.row ?? null}
        nextStatus={changeReq?.next ?? ''}
        busy={actionLoading}
        error={changeError}
        onClose={() => { setChangeReq(null); setChangeError(null); }}
        onConfirm={confirmStatusChange}
      />
    </div>
  );
}
