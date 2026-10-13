/**
 * Delivery Requests — the queue of buyer handoffs waiting to enter delivery
 * operations.
 *
 * A request is the buyer's ask to arrange delivery:
 *
 *   Order ready for delivery -> Delivery Request -> materialized -> Delivery
 *
 * `materialized` means the service created the Delivery record; from that point
 * the operational lifecycle lives on the Deliveries page. This page therefore
 * never edits delivery status and never duplicates the Deliveries page — it
 * only shows the queue and hands off to the delivery record.
 *
 * The backend exposes exactly two request states, both derived server-side:
 *   pending      — the order is handed over, no Delivery exists yet
 *   materialized — a Delivery was created for this order
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { StatusBadge, statusVariantFor } from '@/components/common/StatusBadge';
import { Pagination } from '@/components/common/Pagination';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { FilterBar } from '@/components/workspace/FilterBar';
import { DataSection } from '@/components/workspace/DataSection';
import { RecordDrawer, type DetailTab } from '@/components/workspace/RecordDrawer';
import { Facts } from '@/components/workspace/DetailList';
import { formatCurrency, formatDateTime } from '@/utils/format';
import {
  deliveryRequestsService,
  type DeliveryRequestRequest,
} from '@/services/deliveryRequests.service';
import { deliveryServicesService } from '@/services/deliveryServices.service';
import { sellersService } from '@/services/sellers.service';
import { customersService } from '@/services/customers.service';

const LIMIT = 20;

/** The canonical request states (server-derived). */
const REQUEST_STATES = [
  { value: '', label: 'All states' },
  { value: 'pending', label: 'Pending' },
  { value: 'materialized', label: 'Materialized' },
] as const;

/** `pending` waits in this queue; `materialized` has become a delivery. */
function StateBadge({ state }: { state?: string }) {
  if (state === 'pending') return <StatusBadge label="Pending" variant="warning" />;
  if (state === 'materialized') return <StatusBadge label="Materialized" variant="success" />;
  return <StatusBadge label={state || '—'} variant={statusVariantFor(state)} />;
}

/** Request detail as a PANEL (RecordDrawer) so the queue stays behind it. */
function DetailDrawer({
  request,
  open,
  onClose,
  onOpenDelivery,
}: {
  request: DeliveryRequestRequest | null;
  open: boolean;
  onClose: () => void;
  onOpenDelivery: (orderId: string) => void;
}) {
  const [tab, setTab] = useState('overview');
  if (!open || !request) return null;

  const place = (a?: DeliveryRequestRequest['pickupAddress'] | DeliveryRequestRequest['deliveryAddress']) =>
    [a?.sectorName, a?.cityName, a?.regionName].filter(Boolean).join(', ');

  const tabs: DetailTab[] = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <Facts
          items={[
            ['Request ID', request.id],
            ['Order ID', request.orderId],
            ['Seller', request.sellerName || '—'],
            ['Shop', request.shopName || '—'],
            ['Buyer', request.buyerName || request.buyerPhone || '—'],
            ['State', request.status ?? '—'],
            ['Requested', formatDateTime(request.requestedAt)],
          ]}
        />
      ),
    },
    {
      id: 'items',
      label: 'Items',
      content: (
        <div className="space-y-2 text-sm">
          {request.items.length === 0 ? (
            <p className="text-sm text-gray-500">No items recorded.</p>
          ) : (
            request.items.map((item, i) => (
              <div key={i} className="flex justify-between gap-4">
                <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {item.quantity} × {item.weight} kg — {formatCurrency(item.value)}
                </span>
              </div>
            ))
          )}
          <div className="flex justify-between border-t border-gray-100 pt-2 text-sm dark:border-dark-600">
            <span className="font-medium text-gray-800 dark:text-gray-100">Total weight</span>
            <span>{request.totalWeight} kg</span>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-2 text-sm dark:border-dark-600">
            <span className="font-medium text-gray-800 dark:text-gray-100">Total value</span>
            <span>{formatCurrency(request.totalValue)}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'addresses',
      label: 'Addresses',
      content: (
        <div className="space-y-4 text-sm">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Pickup (seller)
            </p>
            <p className="text-gray-700 dark:text-gray-200">
              {place(request.pickupAddress) || '—'}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Delivery (buyer)
            </p>
            <p className="text-gray-700 dark:text-gray-200">
              {place(request.deliveryAddress) || '—'}
            </p>
          </div>
          {request.specialInstructions && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Instructions
              </p>
              <p className="text-gray-700 dark:text-gray-200">{request.specialInstructions}</p>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <RecordDrawer
      open={open}
      onClose={onClose}
      title={`Delivery Request: ${request.orderId}`}
      statusLabel={request.status ?? undefined}
      statusVariant={statusVariantFor(request.status)}
      actions={
        request.status === 'materialized' ? (
          <Button variant="primary" size="sm" onClick={() => onOpenDelivery(request.orderId)}>
            Open delivery
          </Button>
        ) : undefined
      }
      summary={[
        { label: 'Seller', value: request.sellerName || '—' },
        { label: 'Buyer', value: request.buyerName || request.buyerPhone || '—' },
        { label: 'Requested', value: formatDateTime(request.requestedAt) },
      ]}
      tabs={tabs}
      activeTab={tab}
      onTabChange={setTab}
    />
  );
}

export function DeliveryRequestsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [state, setState] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [buyerId, setBuyerId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [detail, setDetail] = useState<DeliveryRequestRequest | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const {
    data,
    loading,
    error,
    refetch,
  } = useAsync(
    () =>
      deliveryRequestsService.list({
        page,
        limit: LIMIT,
        search: debouncedSearch || undefined,
        status: state || undefined,
        sellerId: sellerId || undefined,
        buyerId: buyerId || undefined,
        serviceId: serviceId || undefined,
      }),
    [page, debouncedSearch, state, sellerId, buyerId, serviceId]
  );

  /** Filter option sources; a failure here must not break the list. */
  const { data: options } = useAsync(async () => {
    const [services, sellers, buyers] = await Promise.all([
      deliveryServicesService.list({ page: 1, limit: 200 }).catch(() => ({ items: [] })),
      sellersService.list({ page: 1, limit: 200 }).catch(() => ({ items: [] })),
      customersService.list({ page: 1, limit: 200 }).catch(() => ({ items: [] })),
    ]);
    return {
      services: services?.items ?? [],
      sellers: sellers?.items ?? [],
      buyers: buyers?.items ?? [],
    };
  }, []);

  const serviceNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const service of options?.services ?? []) map.set(service._id, service.name);
    return map;
  }, [options]);

  const rows = data?.requests ?? [];
  const isFiltered = !!(search || state || sellerId || buyerId || serviceId);

  /** The delivery record owns the lifecycle from here. */
  const openDelivery = (orderId: string) => {
    navigate(`/delivery/deliveries?orderId=${encodeURIComponent(orderId)}`);
  };

  const columns: Column<DeliveryRequestRequest>[] = [
    {
      key: 'requestId',
      header: 'Request ID',
      render: (row) => {
        // `id` is the documented field; `_id` is the raw document id. Never
        // read `.length` off a missing id — an undefined one used to crash the
        // whole table during render.
        const id = row.id ?? (row as { _id?: string })._id ?? '';
        return (
          <span className="font-mono text-xs text-gray-600 dark:text-gray-400" title={id}>
            {id ? (id.length > 12 ? `${id.slice(0, 10)}…` : id) : '—'}
          </span>
        );
      },
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
      key: 'pickup',
      header: 'Pickup location',
      render: (row) => {
        const a = row.pickupAddress;
        const text = [a?.sectorName, a?.cityName, a?.regionName].filter(Boolean).join(', ');
        return (
          <span className="text-sm text-gray-600 dark:text-gray-400" title={text}>
            {text || '—'}
          </span>
        );
      },
    },
    {
      key: 'destination',
      header: 'Destination',
      render: (row) => {
        const a = row.deliveryAddress;
        const text = [a?.sectorName, a?.cityName, a?.regionName].filter(Boolean).join(', ');
        return (
          <span className="text-sm text-gray-600 dark:text-gray-400" title={text}>
            {text || '—'}
          </span>
        );
      },
    },
    {
      key: 'service',
      header: 'Service type',
      render: (row) => {
        if (!row.preferredServiceId) return <span className="text-sm text-gray-400">—</span>;
        const name = serviceNameById.get(row.preferredServiceId);
        return <span className="text-sm text-gray-700 dark:text-gray-200">{name ?? '—'}</span>;
      },
    },
    {
      key: 'state',
      header: 'Current state',
      render: (row) => <StateBadge state={row.status} />,
    },
    {
      key: 'requestedAt',
      header: 'Requested time',
      render: (row) => (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatDateTime(row.requestedAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex items-center gap-3">
          {/* The only two actions a request supports: inspect it, and — once it
              has become a delivery — open that delivery record. */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDetail(row);
            }}
            className="text-primary-dark hover:underline"
          >
            View details
          </button>
          {row.status === 'materialized' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openDelivery(row.orderId);
              }}
              className="text-primary-dark hover:underline"
            >
              Open delivery
            </button>
          )}
        </div>
      ),
    },
  ];

  const reset = () => {
    setSearch('');
    setState('');
    setSellerId('');
    setBuyerId('');
    setServiceId('');
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Delivery Requests"
        description="Buyer handoffs waiting to enter delivery operations. A request becomes a delivery once it is materialized."
      />

      <FilterBar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search order, address or shop"
        isFiltered={isFiltered}
        onReset={reset}
        resultSummary={
          data?.total !== undefined
            ? `${data.total} request${data.total === 1 ? '' : 's'}${isFiltered ? ' matching filters' : ''}`
            : undefined
        }
        filters={[
          {
            key: 'state',
            label: 'State',
            value: state,
            onChange: (v: string) => { setState(v); setPage(1); },
            options: REQUEST_STATES.map((s) => ({ ...s })),
          },
          {
            key: 'seller',
            label: 'Seller',
            value: sellerId,
            onChange: (v: string) => { setSellerId(v); setPage(1); },
            options: [
              { value: '', label: 'All Sellers' },
              ...(options?.sellers ?? []).map((s) => ({
                value: s.id,
                label: s.name || s.email || s.id,
              })),
            ],
          },
          {
            key: 'buyer',
            label: 'Buyer',
            value: buyerId,
            onChange: (v: string) => { setBuyerId(v); setPage(1); },
            options: [
              { value: '', label: 'All Buyers' },
              ...(options?.buyers ?? []).map((c) => ({
                value: c.id,
                label: c.name || c.email || c.id,
              })),
            ],
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
        ]}
      />

      <DataSection
        error={error}
        onRetry={refetch}
        isEmpty={!loading && rows.length === 0}
        emptyTitle={isFiltered ? 'No requests match these filters' : 'No delivery requests yet'}
        emptyDescription={
          isFiltered
            ? 'Try widening or resetting the filters above.'
            : 'Delivery requests appear here when buyers hand their orders over for delivery.'
        }
      >
        <DataTable<DeliveryRequestRequest>
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id ?? (row as { _id?: string })._id ?? row.orderId}
          loading={loading}
          emptyTitle="No delivery requests found"
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

      <DetailDrawer
        request={detail}
        open={!!detail}
        onClose={() => setDetail(null)}
        onOpenDelivery={openDelivery}
      />
    </div>
  );
}
