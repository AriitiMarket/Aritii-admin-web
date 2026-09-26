import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { PageLoader } from '@/components/common/PageLoader';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { formatDate } from '@/utils/format';
import { commerceService } from '@/services/commerce.service';
import type { AdminOrderRow, PaymentRecord } from '@/services/commerce.service';

export function CommerceDashboardPage() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { data: stats, loading, error, refetch } = useAsync(
    async () => {
      const result = await commerceService.getOverviewStats();
      setLastUpdated(new Date());
      return result;
    },
    []
  );

  const { data: recentOrders } = useAsync(
    async () => commerceService.getRecentOrders(5),
    []
  );

  const { data: recentPayments } = useAsync(
    async () => commerceService.getRecentPayments(5),
    []
  );

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      refetch();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  if (loading) return <PageLoader label={t('Loading commerce statistics')} />;
  if (error || !stats) return <ErrorState message={error || 'Failed to load'} onRetry={refetch} />;

  const orderColumns: Column<AdminOrderRow>[] = [
    { key: 'orderId', header: t('Order'), accessor: (row) => `#${(row.id || '').slice(-6)}` },
    { key: 'customerId', header: t('Customer'), accessor: (row) => row.customerRef || '—' },
    {
      key: 'totalPrice',
      header: t('Amount'),
      accessor: (row) => `${(row.totalPrice || 0).toLocaleString()} ETB`,
    },
    {
      key: 'status',
      header: t('Status'),
      render: (row) => <StatusBadge label={row.status || 'Processing'} />,
    },
    {
      key: 'paymentStatus',
      header: t('Payment'),
      render: (row) => <StatusBadge label={row.paymentStatus || 'PENDING'} />,
    },
    { key: 'createdAt', header: t('Date'), accessor: (row) => formatDate(row.createdAt) },
  ];

  const paymentColumns: Column<PaymentRecord>[] = [
    {
      key: 'orderId',
      header: t('Order'),
      accessor: (row) => `#${(row.orderId || '').slice(-6)}`,
    },
    {
      key: 'amount',
      header: t('Amount'),
      accessor: (row) => `${(row.amount || 0).toLocaleString()} ${row.currency || 'ETB'}`,
    },
    {
      key: 'paymentMethod',
      header: t('Method'),
      accessor: (row) => row.paymentMethod || '—',
    },
    {
      key: 'status',
      header: t('Status'),
      render: (row) => (
        <StatusBadge
          label={row.status}
          className={
            row.status === 'FAILED'
              ? 'bg-red-50 text-red-700'
              : row.status === 'REFUNDED'
                ? 'bg-orange-50 text-orange-700'
                : row.status === 'COMPLETED'
                  ? 'bg-green-50 text-green-700'
                  : ''
          }
        />
      ),
    },
    { key: 'createdAt', header: t('Date'), accessor: (row) => formatDate(row.createdAt) },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title={t('Commerce Overview')}
          description={t('Platform-wide commerce metrics and governance')}
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Last updated: {lastUpdated.toLocaleTimeString()}</span>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            {t('Refresh')}
          </Button>
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? 'primary' : 'outline'}
            size="sm"
          >
            {autoRefresh ? t('Auto') : t('Manual')}
          </Button>
        </div>
      </div>

      {/* Orders Overview */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('Orders')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <StatCard label={t('Total Orders')} value={String(stats.totalOrders || 0)} />
          <StatCard label={t('Processing')} value={String(stats.processingOrders || 0)} />
          <StatCard label={t('Shipped')} value={String(stats.shippedOrders || 0)} />
          <StatCard label={t('In Transit')} value={String(stats.inTransitOrders || 0)} />
          <StatCard label={t('Delivered')} value={String(stats.deliveredOrders || 0)} />
        </div>
      </div>

      {/* Payments & Revenue */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('Payments & Revenue')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label={t('Total Payments')} value={String(stats.totalPayments || 0)} />
          <StatCard label={t('Revenue')} value={`${(stats.totalRevenue || 0).toLocaleString()} ETB`} />
          <StatCard label={t('Pending')} value={String(stats.pendingPayments || 0)} />
          <StatCard label={t('Failed')} value={String(stats.failedPayments || 0)} />
        </div>
      </div>

      {/* Products & Shops */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('Catalog')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label={t('Total Products')} value={String(stats.totalProducts || 0)} />
          <StatCard label={t('Categories')} value={String(stats.totalCategories || 0)} />
          <StatCard label={t('Total Shops')} value={String(stats.totalShops || 0)} />
          <StatCard label={t('Active Shops')} value={String(stats.activeShops || 0)} />
        </div>
      </div>

      {/* Recent Orders & Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('Recent Orders')}</h3>
            <button
              onClick={() => navigate('/orders')}
              className="text-sm text-primary-dark hover:underline dark:text-primary-color"
            >
              {t('View All')} →
            </button>
          </div>
          <DataTable<AdminOrderRow>
            columns={orderColumns}
            rows={recentOrders || []}
            rowKey={(row) => row.id}
            loading={false}
            emptyTitle={t('No orders yet')}
          />
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('Recent Payments')}</h3>
            <button
              onClick={() => navigate('/commerce/transactions')}
              className="text-sm text-primary-dark hover:underline dark:text-primary-color"
            >
              {t('View All')} →
            </button>
          </div>
          <DataTable<PaymentRecord>
            columns={paymentColumns}
            rows={recentPayments || []}
            rowKey={(row) => row.id}
            loading={false}
            emptyTitle={t('No payments yet')}
          />
        </Card>
      </div>
    </div>
  );
}
