import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersService } from '@/services/orders.service';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Pagination } from '@/components/common/Pagination';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { formatDate } from '@/utils/format';
import type { Order, OrderStatus } from '@/types';

const STATUS_OPTIONS: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'PICKED', label: 'Picked' },
  { value: 'ARRIVED', label: 'Arrived' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export function OrdersPage() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | ''>('');

  const { data, loading, error, refetch } = useAsync(
    useCallback(
      () =>
        ordersService.list(page, 10, status === '' ? undefined : status),
      [page, status]
    ),
    [page, status]
  );

  const columns: Column<Order>[] = [
    { key: 'orderId', header: t('Order ID'), accessor: (row) => row.orderId },
    {
      key: 'orderAmount',
      header: t('Amount'),
      accessor: (row) => `${row.orderAmount ?? 0}`,
    },
    {
      key: 'orderType',
      header: t('Type'),
      accessor: (row) => row.orderType,
    },
    {
      key: 'orderStatus',
      header: t('Status'),
      render: (row) => <StatusBadge label={row.orderStatus} />,
    },
    {
      key: 'sector',
      header: t('Sector'),
      accessor: (row) => row.sector,
    },
    {
      key: 'createdAt',
      header: t('Date'),
      accessor: (row) => formatDate(row.createdAt),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('Orders')}
        description={t('Track and manage marketplace orders')}
        actions={
          <select
            aria-label={t('Filter by status')}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-dark dark:border-dark-600 dark:bg-dark-900 dark:text-white"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as OrderStatus | '');
              setPage(1);
            }}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <DataTable<Order>
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(row) => row.id}
            loading={loading}
            emptyTitle={t('No data available')}
            onRowClick={(row) => navigate(`/orders/${row.id}`)}
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