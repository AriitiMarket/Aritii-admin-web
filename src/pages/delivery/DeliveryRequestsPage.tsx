import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import {
  deliveryRequestsService,
  type DeliveryRequestRequest,
} from '@/services/deliveryRequests.service';
import { deliveryServicesService } from '@/services/deliveryServices.service';
import { sellersService } from '@/services/sellers.service';
import { customersService } from '@/services/customers.service';

function DetailModal({
  request,
  open,
  onClose,
}: {
  request: DeliveryRequestRequest | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!open || !request) return null;

  const address = (a: unknown) => {
    if (!a) return null;
    const obj = a as Record<string, unknown>;
    const regionName = obj.regionName as string | undefined;
    const areaName = obj.areaName as string | undefined;
    const cityName = obj.cityName as string | undefined;
    const sectorName = obj.sectorName as string | undefined;
    const contactName = obj.contactName as string | undefined;
    const contactPhone = obj.contactPhone as string | undefined;
    const instructions = obj.additionalInstructions as string | undefined;
    return { regionName, areaName, cityName, sectorName, contactName, contactPhone, instructions };
  };

  const pickup = address(request.pickupAddress);
  const delivery = address(request.deliveryAddress);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delivery Request: {request.orderId}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>

        <Card className="mb-4">
          <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Items</h4>
          <div className="space-y-2 text-sm">
            {request.items.map((item, i) => (
              <div key={i} className="flex justify-between gap-4">
                <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {item.quantity} × {item.weight} kg — {formatCurrency(item.value)}
                </span>
              </div>
            ))}
            <div className="flex justify-between border-t border-gray-100 pt-2 text-sm">
              <span className="font-medium text-gray-800 dark:text-gray-100">Total weight</span>
              <span className="text-gray-700 dark:text-gray-100">{request.totalWeight} kg</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-2 text-sm">
              <span className="font-medium text-gray-800 dark:text-gray-100">Total value</span>
              <span className="text-gray-700 dark:text-gray-100">{formatCurrency(request.totalValue)}</span>
            </div>
          </div>
        </Card>

        <Card className="mb-4">
          <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Pickup (seller)</h4>
          <AddressPreview address={pickup} label="—" />
        </Card>

        <Card>
          <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Delivery (buyer)</h4>
          <AddressPreview address={delivery} label="—" />
        </Card>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          {request.specialInstructions || 'No special instructions.'}
        </p>
        <p className="mt-2 text-xs text-gray-400">Requested {formatDate(request.requestedAt)}</p>
      </div>
    </div>
  );
}

function AddressPreview({
  address,
  label,
}: {
  address: { regionName?: string; areaName?: string; cityName?: string; sectorName?: string; contactName?: string; contactPhone?: string; instructions?: string } | null;
  label: string;
}) {
  if (!address) return <p className="text-sm text-gray-500">{label}</p>;
  return (
    <div className="space-y-1 text-sm">
      <p className="font-medium text-gray-800 dark:text-gray-100">{address.contactName || label}</p>
      <p className="text-gray-600 dark:text-gray-400">
        {address.sectorName || '—'}, {address.cityName || '—'}, {address.regionName || '—'}
      </p>
      {address.contactPhone && <p className="text-xs text-gray-400">{address.contactPhone}</p>}
      {address.instructions && <p className="text-xs text-gray-400">{address.instructions}</p>}
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export function DeliveryRequestsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [buyerId, setBuyerId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [detail, setDetail] = useState<DeliveryRequestRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const isFiltered = !!(debouncedSearch || sellerId || buyerId || serviceId);

  const limit = 20;
  const { data, loading, error, refetch } = useAsync(
    async () =>
      deliveryRequestsService.list({
        page,
        limit,
        sellerId: sellerId || undefined,
        buyerId: buyerId || undefined,
        serviceId: serviceId || undefined,
        search: debouncedSearch || undefined,
      }),
    [page, debouncedSearch, sellerId, buyerId, serviceId]
  );

  // Filter options: identity sellers/buyers + the delivery-service catalog.
  // Loaded once; a failing option source never breaks the list itself.
  const { data: options } = useAsync(async () => {
    const [sellers, buyers, services] = await Promise.all([
      sellersService.list({ page: 1, limit: 200 }).catch(() => null),
      customersService.list({ page: 1, limit: 200 }).catch(() => null),
      deliveryServicesService.list({ page: 1, limit: 200 }).catch(() => null),
    ]);
    return {
      sellers: sellers?.items ?? [],
      buyers: buyers?.items ?? [],
      services: services?.items ?? [],
    };
  }, []);

  const rows: DeliveryRequestRequest[] = data?.requests?.map((r) => ({
    ...r,
    id: r.orderId,
  })) ?? [];

  const columns: Column<typeof rows[number]>[] = [
    {
      key: 'orderId',
      header: 'Order',
      render: (row) => <span className="font-medium text-gray-800 dark:text-gray-100">{row.orderId}</span>,
    },
    {
      key: 'status',
      header: 'Handoff',
      render: (row) =>
        row.status === 'materialized' ? (
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800 dark:bg-sky-900 dark:text-sky-200">
            Materialized
            {row.deliveryStatus ? ` · ${row.deliveryStatus.replace(/_/g, ' ')}` : ''}
          </span>
        ) : (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
            Pending handoff
          </span>
        ),
    },
    {
      key: 'sellerName',
      header: 'Seller',
      render: (row) => <span className="text-sm text-gray-800 dark:text-gray-100">{row.sellerName || '—'}</span>,
    },
    {
      key: 'buyerName',
      header: 'Buyer',
      render: (row) => (
        <span className="text-sm text-gray-800 dark:text-gray-100">
          {row.buyerName || row.buyerPhone || '—'}
        </span>
      ),
    },
    {
      key: 'shopName',
      header: 'Pickup',
      render: (row) => {
        const addr = row.pickupAddress as Record<string, unknown> | undefined;
        const loc = [addr?.sectorName, addr?.cityName, addr?.regionName].filter(Boolean).join(', ');
        return (
          <div className="text-sm">
            <p className="font-medium text-gray-800 dark:text-gray-100">{row.shopName || '—'}</p>
            <p className="text-gray-500 dark:text-gray-400">{loc || '—'}</p>
          </div>
        );
      },
    },
    {
      key: 'items',
      header: 'Items',
      render: (row) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">{row.items?.length ?? 0}</span>
      ),
    },
    {
      key: 'totalWeight',
      header: 'Weight (kg)',
      render: (row) => <span className="text-sm text-gray-700 dark:text-gray-300">{row.totalWeight ?? 0}</span>,
    },
    {
      key: 'totalValue',
      header: 'Value',
      render: (row) => <span className="text-sm text-gray-700 dark:text-gray-300">{formatCurrency(row.totalValue)}</span>,
    },
    {
      key: 'requestedAt',
      header: 'Requested',
      render: (row) => <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(row.requestedAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => { setDetail(row); setDetailOpen(true); }}>
            View
          </Button>
          {row.status === 'materialized' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/delivery/deliveries?orderId=${encodeURIComponent(row.orderId)}`)}
            >
              Open delivery
            </Button>
          )}
        </div>
      ),
    },
  ];

  const resetFilters = () => {
    setSearch('');
    setSellerId('');
    setBuyerId('');
    setServiceId('');
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Delivery Requests"
        description="Delivery requests from buyers (order → deliver) and their details"
      />

      <FilterBar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search order, address or shop"
        filters={[
          {
            key: 'seller',
            label: 'Seller',
            value: sellerId,
            options: [
              { value: '', label: 'All Sellers' },
              ...(options?.sellers ?? []).map((s) => ({ value: s.id, label: s.name || s.email || s.id })),
            ],
            onChange: (v) => { setSellerId(v); setPage(1); },
          },
          {
            key: 'buyer',
            label: 'Buyer',
            value: buyerId,
            options: [
              { value: '', label: 'All Buyers' },
              ...(options?.buyers ?? []).map((c) => ({ value: c.id, label: c.name || c.email || c.id })),
            ],
            onChange: (v) => { setBuyerId(v); setPage(1); },
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
            ? `${data.total} request${data.total === 1 ? '' : 's'}${isFiltered ? ' matching filters' : ''}`
            : undefined
        }
      />

      <DataSection
        error={error}
        onRetry={refetch}
        isEmpty={!loading && rows.length === 0}
        emptyTitle={isFiltered ? 'No requests match these filters' : 'No delivery requests yet'}
        emptyDescription="Delivery requests appear here when buyers hand their orders over for delivery."
      >
        <DataTable<typeof rows[number]>
          columns={columns}
          rows={rows}
          rowKey={(row) => row.orderId}
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

      <DetailModal request={detail} open={detailOpen} onClose={() => { setDetailOpen(false); setDetail(null); }} />
    </div>
  );
}
