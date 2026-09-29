import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Pagination } from '@/components/common/Pagination';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { FilterBar } from '@/components/workspace/FilterBar';
import { DataSection } from '@/components/workspace/DataSection';
import { formatDate } from '@/utils/format';
import { shipmentsService, type Shipment, type ShipmentStatus } from '@/services/shipments.service';
import { deliveryServicesService } from '@/services/deliveryServices.service';
import { locationsService } from '@/services/locations.service';
import { useToast } from '@/hooks/useToast';
import { ApiError } from '@/types/api';

const SHIPMENT_STATUSES: { value: ShipmentStatus; label: string }[] = [
  { value: 'planning', label: 'Planning' },
  { value: 'ready', label: 'Ready' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'arrived', label: 'Arrived' },
  { value: 'receiving', label: 'Receiving' },
  { value: 'received', label: 'Received' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'failed', label: 'Failed' },
  { value: 'returned', label: 'Returned' },
];

const NEXT_ACTIONS: Record<ShipmentStatus, { action: 'dispatch' | 'arrive' | 'receive'; label: string }[]> = {
  planning: [{ action: 'dispatch', label: 'Dispatch' }],
  ready: [{ action: 'dispatch', label: 'Dispatch' }],
  dispatched: [{ action: 'arrive', label: 'Arrive' }],
  in_transit: [{ action: 'arrive', label: 'Arrive' }],
  arrived: [{ action: 'receive', label: 'Receive' }],
  receiving: [{ action: 'receive', label: 'Receive' }],
  received: [],
  failed: [],
  cancelled: [],
  completed: [],
  returned: [],
};

export function ShipmentsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ShipmentStatus | ''>('');
  const [originLocationId, setOriginLocationId] = useState('');
  const [destinationLocationId, setDestinationLocationId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const { showToast } = useToast();

  const debouncedSearch = useDebounce(search, 300);
  const isFiltered = !!(debouncedSearch || status || originLocationId || destinationLocationId || serviceId);

  // Filter options: locations (origins/destinations) + the service catalog.
  const { data: options } = useAsync(async () => {
    const [locations, services] = await Promise.all([
      locationsService.list({ limit: 300 }).catch(() => null),
      deliveryServicesService.list({ page: 1, limit: 200 }).catch(() => null),
    ]);
    return { locations: locations ?? [], services: services?.items ?? [] };
  }, []);

  const limit = 20;
  const { data, loading, error, refetch } = useAsync(
    async () => {
      const res = await shipmentsService.list({
        page,
        limit,
        status: status || undefined,
        shipmentNumber: debouncedSearch || undefined,
        originLocationId: originLocationId || undefined,
        destinationLocationId: destinationLocationId || undefined,
        serviceId: serviceId || undefined,
      });
      return res;
    },
    [page, status, debouncedSearch, originLocationId, destinationLocationId, serviceId]
  );

  const shipments = data?.shipments ?? [];

  const columns: Column<Shipment>[] = [
    {
      key: 'shipmentNumber',
      header: 'Shipment #',
      render: (row) => <span className="font-mono text-sm text-gray-800 dark:text-gray-100">{row.shipmentNumber || '—'}</span>,
    },
    {
      key: 'originName',
      header: 'Origin',
      render: (row) => <span className="text-sm text-gray-800 dark:text-gray-100">{row.originName || '—'}</span>,
    },
    {
      key: 'destinationName',
      header: 'Destination',
      render: (row) => <span className="text-sm text-gray-800 dark:text-gray-100">{row.destinationName || '—'}</span>,
    },
    {
      key: 'routeName',
      header: 'Route',
      render: (row) => <span className="text-sm text-gray-700 dark:text-gray-300">{row.routeName || '—'}</span>,
    },
    {
      key: 'items',
      header: 'Items',
      render: (row) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {row.items?.length ?? 0} &middot; {row.capacity?.usedItems ?? 0}/{row.capacity?.maxItems ?? '—'}
        </span>
      ),
    },
    {
      key: 'capacity',
      header: 'Capacity',
      render: (row) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {row.capacity?.usedWeight ?? 0}/{row.capacity?.maxWeight ?? '—'} kg
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          row.status === 'in_transit'
            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300'
            : row.status === 'arrived' || row.status === 'received'
            ? 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300'
            : row.status === 'cancelled' || row.status === 'failed'
            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
            : 'bg-gray-100 text-gray-700 dark:bg-dark-800 dark:text-gray-300'
        }`}>
          {(row.status || '—').replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row) => <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(row.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => {
        const next = NEXT_ACTIONS[row.status ?? ''] ?? [];
        return (
          <div className="flex gap-1">
            {next.map(({ action, label }) => (
              <Button
                key={action}
                size="sm"
                variant="outline"
                onClick={async () => {
                  setActionLoading(true);
                  try {
                    await shipmentsService.transition(row.id, action, `Admin ${label.toLowerCase()}`);
                    refetch();
                    showToast({
                      type: 'success',
                      message: `Shipment ${row.shipmentNumber || row.id} → ${label}`,
                    });
                  } catch (err) {
                    showToast({
                      type: 'error',
                      message: err instanceof ApiError ? err.message : 'Transition failed',
                    });
                  } finally {
                    setActionLoading(false);
                  }
                }}
                disabled={actionLoading}
              >
                {label}
              </Button>
            ))}
          </div>
        );
      },
    },
  ];

  const resetFilters = () => {
    setSearch('');
    setStatus('');
    setOriginLocationId('');
    setDestinationLocationId('');
    setServiceId('');
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Shipments"
        description="Shipment planning, staging and completion"
      />

      <FilterBar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search shipment number"
        filters={[
          {
            key: 'status',
            label: 'Status',
            value: status,
            options: SHIPMENT_STATUSES,
            onChange: (v) => { setStatus(v as ShipmentStatus); setPage(1); },
          },
          {
            key: 'origin',
            label: 'Origin',
            value: originLocationId,
            options: [
              { value: '', label: 'All Origins' },
              ...(options?.locations ?? []).map((l) => ({ value: l._id, label: l.name })),
            ],
            onChange: (v) => { setOriginLocationId(v); setPage(1); },
          },
          {
            key: 'destination',
            label: 'Destination',
            value: destinationLocationId,
            options: [
              { value: '', label: 'All Destinations' },
              ...(options?.locations ?? []).map((l) => ({ value: l._id, label: l.name })),
            ],
            onChange: (v) => { setDestinationLocationId(v); setPage(1); },
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
        ]}
        onReset={resetFilters}
        isFiltered={isFiltered}
        resultSummary={
          data?.total !== undefined
            ? `${data.total} shipment${data.total === 1 ? '' : 's'}${isFiltered ? ' matching filters' : ''}`
            : undefined
        }
      />

      <DataSection
        error={error}
        onRetry={refetch}
        isEmpty={!loading && shipments.length === 0}
        emptyTitle={isFiltered ? 'No shipments match these filters' : 'No shipments yet'}
        emptyDescription="Group pending deliveries on the Consolidation page to create the first shipment."
        emptyAction={
          isFiltered
            ? undefined
            : { label: 'Open Consolidation', onClick: () => navigate('/delivery/consolidation') }
        }
      >
        <DataTable<Shipment>
          columns={columns}
          rows={shipments}
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
    </div>
  );
}
