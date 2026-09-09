import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleDollarToSlot,
  faMotorcycle,
  faReceipt,
  faStore,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/hooks/useAuth';
import { useSector } from '@/hooks/useSector';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { analyticsService } from '@/services/analytics.service';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Card } from '@/components/common/Card';
import { ErrorState } from '@/components/common/ErrorState';
import { PageLoader } from '@/components/common/PageLoader';
import { BarChart } from '@/components/charts/BarChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { formatCurrency, formatNumber } from '@/utils/format';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function HomePage() {
  const { t } = useLocalization();
  const { user } = useAuth();
  const { selectedSectorName } = useSector();

  const stats = useAsync(() => analyticsService.getStats(), []);
  const growth = useAsync(() => analyticsService.getUsersGrowth(), []);
  const ordersByType = useAsync(() => analyticsService.getOrdersByType(), []);
  const salesByType = useAsync(() => analyticsService.getSalesByType(), []);

  if (stats.loading || growth.loading) {
    return <PageLoader label={t('Loading')} />;
  }

  if (stats.error) {
    return (
      <ErrorState message={stats.error} onRetry={stats.refetch} />
    );
  }

  const s = stats.data;

  const growthChartData = growth.data
    ? {
        labels: MONTH_LABELS,
        datasets: [
          {
            label: t('Users'),
            data: growth.data.usersCount,
            backgroundColor: '#b1c748',
          },
          {
            label: t('Stores'),
            data: growth.data.storesCount,
            backgroundColor: '#5ac12f',
          },
          {
            label: t('Riders'),
            data: growth.data.ridersCount,
            backgroundColor: '#64748b',
          },
        ],
      }
    : null;

  const orderSlices = ordersByType.data ?? [];
  const donutData = {
    labels: orderSlices.map((slice) => t(slice.label) === slice.label ? slice.label : t(slice.label)),
    datasets: [
      {
        label: 'Orders',
        data: orderSlices.map((slice) => slice.value),
        backgroundColor: ['#b1c748', '#5ac12f'],
      },
    ],
  };

  return (
    <div>
      <PageHeader
        title={`${t('Welcome back')}, ${user?.name?.split(' ')[0] ?? 'Admin'}`}
        description={
          selectedSectorName
            ? `${t('Dashboard')} — ${selectedSectorName}`
            : t('Dashboard')
        }
      />

      {stats.data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t('Users')}
            value={formatNumber(s?.totalUsers)}
            icon={<FontAwesomeIcon icon={faUsers} />}
          />
          <StatCard
            label={t('Stores')}
            value={formatNumber(s?.totalStores)}
            icon={<FontAwesomeIcon icon={faStore} />}
          />
          <StatCard
            label={t('Riders')}
            value={formatNumber(s?.totalRiders)}
            icon={<FontAwesomeIcon icon={faMotorcycle} />}
          />
          <StatCard
            label={t('Total Revenue')}
            value={formatCurrency(s?.totalRevenue ?? 0)}
            icon={<FontAwesomeIcon icon={faCircleDollarToSlot} />}
          />
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <p className="card-h1 mb-3 dark:text-white">
            {t('User growth')} — {new Date().getFullYear()}
          </p>
          {growthChartData ? (
            <BarChart data={growthChartData} ariaLabel={t('User growth')} />
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">
              {t('No data available')}
            </p>
          )}
        </Card>

        <Card>
          <p className="card-h1 mb-3 dark:text-white">
            {t('Orders by type')}
          </p>
          {orderSlices.length > 0 ? (
            <DonutChart data={donutData} ariaLabel={t('Orders by type')} />
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">
              {t('No data available')}
            </p>
          )}
          <div className="mt-3 flex justify-between border-t border-gray-100 pt-3 dark:border-dark-600">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('Delivery')} —{' '}
              {formatNumber(salesByType.data?.delivery ?? 0)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('Pickup') ?? 'Pickup'} —{' '}
              {formatNumber(salesByType.data?.pickup ?? 0)}
            </p>
          </div>
        </Card>
      </div>

      {stats.data && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t('Total Orders')}
            value={formatNumber(s?.totalOrders)}
            icon={<FontAwesomeIcon icon={faReceipt} />}
          />
          <StatCard
            label={t('Delivered Orders')}
            value={formatNumber(s?.deliveredOrders)}
            icon={<FontAwesomeIcon icon={faReceipt} />}
          />
          <StatCard
            label={t('Sellers')}
            value={formatNumber(s?.totalSellers)}
            icon={<FontAwesomeIcon icon={faStore} />}
          />
        </div>
      )}
    </div>
  );
}