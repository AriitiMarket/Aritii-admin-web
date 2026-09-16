import { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersService } from '@/services/orders.service';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Pagination } from '@/components/common/Pagination';
import { Button } from '@/components/common/Button';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { formatDate } from '@/utils/format';
import { adminApi } from '@/api/admin';
import type { Order, OrderStatus } from '@/types';

const STATUS_OPTIONS: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'PICKED', label: 'Picked' },
  { value: 'ARRIVED', label: 'Arrived' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

// Hierarchy levels for filtering
interface HierarchyLevel {
  id: string;
  name: string;
  type: 'region' | 'city' | 'area' | 'sector';
}

export function OrdersMonitoringPage() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Hierarchy filtering
  const [hierarchyFilter, setHierarchyFilter] = useState<HierarchyLevel | null>(null);
  const [hierarchyBreadcrumb, setHierarchyBreadcrumb] = useState<HierarchyLevel[]>([]);

  const { data, loading, error, refetch } = useAsync(
    useCallback(
      () =>
        ordersService.list({
          page,
          limit: 10,
          status: status === '' ? undefined : status,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          location: hierarchyFilter?.id || undefined,
        }),
      [page, status, startDate, endDate, hierarchyFilter?.id]
    ),
    [page, status, startDate, endDate, hierarchyFilter?.id]
  );

  const handleResetFilters = () => {
    setStatus('');
    setStartDate('');
    setEndDate('');
    setHierarchyFilter(null);
    setHierarchyBreadcrumb([]);
    setPage(1);
  };

  const handleHierarchyFilterClick = (level: HierarchyLevel) => {
    setHierarchyFilter(level);
    // Update breadcrumb
    const index = hierarchyBreadcrumb.findIndex(b => b.id === level.id);
    if (index >= 0) {
      setHierarchyBreadcrumb(hierarchyBreadcrumb.slice(0, index + 1));
    } else {
      setHierarchyBreadcrumb([...hierarchyBreadcrumb, level]);
    }
    setPage(1);
  };

  const handleClearHierarchyFilter = () => {
    setHierarchyFilter(null);
    setHierarchyBreadcrumb([]);
    setPage(1);
  };

  const hasActiveFilters = status !== '' || startDate !== '' || endDate !== '' || hierarchyFilter !== null;

  const columns: Column<Order>[] = [
    { key: 'orderId', header: t('Order ID'), accessor: (row) => row.orderId },
    {
      key: 'payer',
      header: t('Customer'),
      accessor: (row) => row.payer || '—',
    },
    {
      key: 'orderAmount',
      header: t('Total'),
      accessor: (row) => `${row.orderAmount ?? 0}`,
    },
    {
      key: 'orderStatus',
      header: t('Status'),
      render: (row) => <StatusBadge label={row.orderStatus} />,
    },
    {
      key: 'createdAt',
      header: t('Date'),
      accessor: (row) => formatDate(row.createdAt),
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (row) => (
        <Button
          onClick={() => navigate(`/orders/${row.id}`)}
          variant="ghost"
          size="sm"
          className="text-primary-dark hover:text-primary-dark/80 dark:text-primary-color"
        >
          {t('View')}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <PageHeader
            title={t('Orders')}
            description={t('Track and manage marketplace orders')}
          />
          {hierarchyBreadcrumb.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="font-medium text-gray-600 dark:text-gray-400">Filtered by:</span>
              <div className="flex items-center gap-1">
                <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 text-xs font-medium">
                  {hierarchyFilter?.type.toUpperCase()} • {hierarchyFilter?.name}
                </span>
                <button
                  onClick={handleClearHierarchyFilter}
                  className="ml-1 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  ✕ Clear
                </button>
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="h-10 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-dark dark:border-dark-600 dark:bg-dark-900 dark:text-gray-200 dark:hover:bg-dark-800"
        >
          {showFilters ? '✕ ' : '⊕ '}
          {t('Filters')}
        </button>
      </div>

      {showFilters && (
        <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-dark-600 dark:bg-dark-950">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {/* Status Filter */}
            <div>
              <label
                htmlFor="status-filter"
                className="block text-xs font-medium text-gray-600 dark:text-gray-400"
              >
                {t('Status')}
              </label>
              <select
                id="status-filter"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as OrderStatus | '');
                  setPage(1);
                }}
                className="mt-1 h-9 w-full rounded border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-dark dark:border-dark-600 dark:bg-dark-900 dark:text-white"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date Filter */}
            <div>
              <label
                htmlFor="start-date-filter"
                className="block text-xs font-medium text-gray-600 dark:text-gray-400"
              >
                {t('From Date')}
              </label>
              <input
                id="start-date-filter"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="mt-1 h-9 w-full rounded border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-dark dark:border-dark-600 dark:bg-dark-900 dark:text-white"
              />
            </div>

            {/* End Date Filter */}
            <div>
              <label
                htmlFor="end-date-filter"
                className="block text-xs font-medium text-gray-600 dark:text-gray-400"
              >
                {t('To Date')}
              </label>
              <input
                id="end-date-filter"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="mt-1 h-9 w-full rounded border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-dark dark:border-dark-600 dark:bg-dark-900 dark:text-white"
              />
            </div>

            {/* Reset Button */}
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
        </div>
      )}

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <DataTable<Order>
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