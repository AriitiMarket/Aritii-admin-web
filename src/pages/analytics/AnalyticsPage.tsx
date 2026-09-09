import { analyticsService } from '@/services/analytics.service';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { StatCard } from '@/components/common/StatCard';
import { ErrorState } from '@/components/common/ErrorState';
import { PageLoader } from '@/components/common/PageLoader';
import { BarChart } from '@/components/charts/BarChart';
import { DonutChart } from '@/components/charts/DonutChart';
import type { DashboardStats, DistributionSlice, SalesByType } from '@/types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function AnalyticsPage() {
  const { t } = useLocalization();

  const stats = useAsync(() => analyticsService.getStats(), []);
  const ordersByType = useAsync(() => analyticsService.getOrdersByType(), []);
  const salesByType = useAsync(() => analyticsService.getSalesByType(), []);

  const anyError = stats.error ?? ordersByType.error ?? salesByType.error;
  const anyLoading = stats.loading || ordersByType.loading || salesByType.loading;

  if (anyLoading && !anyError) return <PageLoader />;
  if (anyError) return <ErrorState message={anyError} onRetry={stats.refetch} />;

  const s = stats.data as DashboardStats | null;
  const orders = ordersByType.data as DistributionSlice[] | null;
  const sales = salesByType.data as SalesByType | null;

  const growthData = {
    labels: MONTHS,
    datasets: [
      {
        label: t('Users'),
        data: [65, 78, 90, 81, 96, 105, 120, 134, 125, 148, 160, 175],
        backgroundColor: '#3b82f6',
      },
      {
        label: t('Sellers'),
        data: [12, 19, 15, 25, 22, 30, 28, 35, 40, 38, 45, 50],
        backgroundColor: '#10b981',
      },
      {
        label: t('Riders'),
        data: [8, 10, 12, 14, 18, 20, 22, 25, 28, 30, 32, 35],
        backgroundColor: '#f59e0b',
      },
    ],
  };

  const salesData = {
    labels: [t('Delivery'), t('Pickup')],
    datasets: [
      {
        data: [sales?.delivery ?? 0, sales?.pickup ?? 0],
        backgroundColor: ['#3b82f6', '#8b5cf6'],
      },
    ],
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('Analytics')}
        description={t('Marketplace performance overview')}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('Users')} value={`${s?.totalUsers ?? 0}`} />
        <StatCard label={t('Sellers')} value={`${s?.totalSellers ?? 0}`} />
        <StatCard label={t('Stores')} value={`${s?.totalStores ?? 0}`} />
        <StatCard label={t('Riders')} value={`${s?.totalRiders ?? 0}`} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('Orders')} value={`${s?.totalOrders ?? 0}`} />
        <StatCard label={t('Delivered')} value={`${s?.deliveredOrders ?? 0}`} />
        <StatCard label={t('Revenue')} value={`${s?.totalRevenue ?? 0}`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="card-h2 mb-4 dark:text-white">{t('Growth')}</h2>
          <BarChart data={growthData} ariaLabel={t('Growth chart')} />
        </Card>
        <Card>
          <h2 className="card-h2 mb-4 dark:text-white">{t('Orders by Type')}</h2>
          <DonutChart data={salesData} ariaLabel={t('Sales distribution chart')} />
        </Card>
      </div>

      {orders && orders.length > 0 && (
        <Card>
          <h2 className="card-h2 mb-4 dark:text-white">{t('Order Distribution')}</h2>
          <ul className="space-y-2">
            {orders.map((slice) => (
              <li
                key={slice.label}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-700 dark:text-gray-200">
                  {slice.label}
                </span>
                <span className="font-medium text-gray-800 dark:text-gray-100">
                  {slice.value}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}