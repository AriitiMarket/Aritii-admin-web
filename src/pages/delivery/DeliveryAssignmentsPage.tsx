import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Pagination } from '@/components/common/Pagination';
import { SelectField } from '@/components/forms/SelectField';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { http } from '@/services/client/httpClient';
import { formatDate } from '@/utils/format';

interface Delivery {
  id?: string;
  _id?: string;
  orderId?: string;
  sellerId?: string;
  buyerId?: string;
  status?: string;
  actorId?: string;
  actorName?: string;
  pickupLocationId?: string;
  destinationLocationId?: string;
  deliveryAddress?: {
    addressDetail?: string;
    zoneId?: string;
    contactName?: string;
    contactPhone?: string;
  };
  pickedUpAt?: string;
  deliveredAt?: string;
  createdAt?: string;
}

interface DeliveriesResponse {
  deliveries?: Delivery[];
  items?: Delivery[];
  count?: number;
  total?: number;
}

const DELIVERY_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function DeliveryAssignmentsPage() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data, loading, error, refetch } = useAsync(
    async () => {
      try {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', '10');
        if (debouncedSearch) params.append('search', debouncedSearch);
        if (status) params.append('status', status);

        const res = await http.get<DeliveriesResponse>(
          `/delivery/delivery?${params}`
        );
        const items = res.deliveries || res.items || [];
        return {
          items: items.map((d: Delivery) => ({
            ...d,
            id: d._id || d.id,
          })),
          total: res.total || res.count || items.length,
          totalPages: Math.ceil((res.total || res.count || 0) / 10),
        };
      } catch (err) {
        console.error('Failed to fetch deliveries:', err);
        throw err;
      }
    },
    [page, debouncedSearch, status]
  );

  const getStatusColor = (s: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-800',
      assigned: 'bg-blue-100 text-blue-800',
      pickup: 'bg-cyan-100 text-cyan-800',
      in_transit: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-300 text-gray-900',
    };
    return colors[s] || 'bg-gray-100 text-gray-800';
  };

  const columns: Column<Delivery>[] = [
    {
      key: 'orderId',
      header: t('Order ID'),
      render: (row) => (
        <span className="font-medium text-gray-800 dark:text-gray-100">
          {row.orderId || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('Status'),
      render: (row) => (
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(row.status || '')}`}>
          {row.status || '—'}
        </span>
      ),
    },
    {
      key: 'actorName',
      header: t('Rider'),
      render: (row) => (
        <span className="text-gray-800 dark:text-gray-100">
          {row.actorName || '—'}
        </span>
      ),
    },
    {
      key: 'deliveryAddress',
      header: t('Delivery Location'),
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.deliveryAddress?.addressDetail || '—'}
        </span>
      ),
    },
    {
      key: 'deliveryAddress.contactName',
      header: t('Contact'),
      render: (row) => (
        <div className="text-sm">
          <p className="font-medium text-gray-800 dark:text-gray-100">
            {row.deliveryAddress?.contactName || '—'}
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            {row.deliveryAddress?.contactPhone || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'pickedUpAt',
      header: 'Picked Up',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.pickedUpAt ? formatDate(row.pickedUpAt) : '—'}
        </span>
      ),
    },
    {
      key: 'deliveredAt',
      header: 'Delivered',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.deliveredAt ? formatDate(row.deliveredAt) : '—'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t('Created'),
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('Delivery Assignments')}
        description={t('Monitor and manage active delivery assignments')}
        actions={
          <div className="flex gap-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('Search order ID')}
              aria-label={t('Search')}
            />
            <SelectField
              value={status}
              onChange={setStatus}
              options={DELIVERY_STATUSES}
              className="w-48"
            />
          </div>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <DataTable<Delivery>
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(row) => row.id || row._id || ''}
            loading={loading}
            emptyTitle={t('No deliveries')}
            onRowClick={(row) => navigate(`/delivery/assignments/${row.id}`)}
          />
          <Pagination
            className="mt-4"
            page={page}
            totalPages={data?.totalPages ?? 0}
            total={data?.total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
