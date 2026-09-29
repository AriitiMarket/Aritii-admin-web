import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsync } from '@/hooks/useAsync';
import { useUserDirectory } from '@/hooks/useUserDirectory';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Pagination } from '@/components/common/Pagination';
import { SelectField } from '@/components/forms/SelectField';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { formatDate } from '@/utils/format';
import { commerceService } from '@/services/commerce.service';
import type { AdminOrderRow } from '@/services/commerce.service';
import type { OrderStatus } from '@/types';

const STATUS_OPTIONS: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'Processing', label: 'Processing' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Shipped', label: 'Shipped' },
  { value: 'In Transit', label: 'In Transit' },
  { value: 'Delivered', label: 'Delivered' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Refund Requested', label: 'Refund Requested' },
  { value: 'Refund Approved', label: 'Refund Approved' },
  { value: 'Refund Success', label: 'Refund Success' },
  { value: 'Refund Rejected', label: 'Refund Rejected' },
];

export function OrdersMonitoringPage() {
  const { t } = useLocalization();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data, loading, error, refetch } = useAsync(
    useCallback(
      () =>
        commerceService.listOrders({
          page,
          limit: 20,
          status: status === '' ? undefined : status,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      [page, status, startDate, endDate]
    ),
    [page, status, startDate, endDate]
  );

  // The customer column shows the buyer's NAME (the id only as a fallback
  // while the directory lookup is still in flight).
  const { nameFor: buyerNameFor, emailFor: buyerEmailFor } = useUserDirectory(
    (data?.items ?? []).map((row) => row.buyerId)
  );

  const handleResetFilters = () => {
    setStatus('');
    setStartDate('');
    setEndDate('');
    setSearch('');
    setPage(1);
  };

  const hasActiveFilters = status !== '' || startDate !== '' || endDate !== '' || search !== '';

  const columns: Column<AdminOrderRow>[] = [
    {
      key: 'orderId',
      header: t('Order ID'),
      render: (row) => (
        <span className="font-mono text-sm">#{(row.id || '').slice(-8)}</span>
      ),
    },
    {
      key: 'customer',
      header: t('Customer'),
      render: (row) => {
        const name = buyerNameFor(row.buyerId);
        const email = buyerEmailFor(row.buyerId);
        return (
          <div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {name || row.customerRef || '—'}
            </div>
            {name && email && <div className="text-xs text-gray-500">{email}</div>}
          </div>
        );
      },
    },
    {
      key: 'items',
      header: t('Items'),
      accessor: (row) => row.items ?? '—',
    },
    {
      key: 'totalPrice',
      header: t('Total'),
      render: (row) => (
        <span className="font-medium">{(row.totalPrice || 0).toLocaleString()} ETB</span>
      ),
    },
    {
      key: 'status',
      header: t('Order Status'),
      render: (row) => <StatusBadge label={row.status || 'Processing'} />,
    },
    {
      key: 'paymentStatus',
      header: t('Payment'),
      render: (row) => (
        <StatusBadge
          label={row.paymentStatus || 'PENDING'}
          className={
            row.paymentStatus === 'FAILED'
              ? 'bg-red-50 text-red-700'
              : row.paymentStatus === 'CONFIRMED'
                ? 'bg-green-50 text-green-700'
                : ''
          }
        />
      ),
    },
    {
      key: 'stage',
      header: t('Stage'),
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.stageLabel || row.stage || '—'}
        </span>
      ),
    },
    {
      key: 'delivery',
      header: t('Delivery'),
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.deliveryStatus || '—'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t('Date'),
      accessor: (row) => formatDate(row.createdAt),
    },
    {
      key: 'actions',
      header: t(''),
      render: (row) => (
        <Button
          onClick={() => navigate(`/orders/${row.id}`)}
          variant="ghost"
          size="sm"
          className="text-primary-dark hover:text-primary-dark/80 dark:text-primary-color"
        >
          {t('View')} →
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <PageHeader
          title={t('Orders')}
          description={t('Track and manage marketplace orders')}
        />
        <div className="flex items-center gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('Search orders')}
            aria-label={t('Search orders')}
          />
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="h-10 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-dark dark:border-dark-600 dark:bg-dark-900 dark:text-gray-200 dark:hover:bg-dark-800"
          >
            {showFilters ? '✕ ' : '⊕ '}{t('Filters')}
          </button>
        </div>
      </div>

      {showFilters && (
        <Card>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            <SelectField
              value={status}
              options={STATUS_OPTIONS}
              onChange={(e) => {
                setStatus(e.target.value as OrderStatus | '');
                setPage(1);
              }}
              label={t('Status')}
            />
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t('From Date')}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="mt-1 h-9 w-full rounded border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-dark dark:border-dark-600 dark:bg-dark-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t('To Date')}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="mt-1 h-9 w-full rounded border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-dark dark:border-dark-600 dark:bg-dark-900 dark:text-white"
              />
            </div>
            {hasActiveFilters && (
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="h-9 w-full rounded bg-gray-200 px-3 text-sm font-medium text-gray-800 hover:bg-gray-300 dark:bg-dark-700 dark:text-gray-200 dark:hover:bg-dark-600"
                >
                  {t('Reset')}
                </button>
              </div>
            )}
          </div>
        </Card>
      )}

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <DataTable<AdminOrderRow>
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(row) => row.id}
            loading={loading}
            emptyTitle={t('No orders found')}
            emptyDescription={
              hasActiveFilters
                ? t('Try adjusting your filters')
                : t('No orders have been placed yet')
            }
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
