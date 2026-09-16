import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleDollarToSlot,
  faMotorcycle,
  faReceipt,
  faStore,
  faUsers,
  faExclamationTriangle,
  faArrowRight,
  faMapPin,
  faBriefcase,
  faChartLine,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSector } from '@/hooks/useSector';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { analyticsService } from '@/services/analytics.service';
import { adminApi } from '@/api/admin';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { PageLoader } from '@/components/common/PageLoader';
import { BarChart } from '@/components/charts/BarChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { formatCurrency, formatNumber } from '@/utils/format';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function AdminDashboardPage() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedSectorName } = useSector();

  const stats = useAsync(() => analyticsService.getStats(), []);
  const growth = useAsync(() => analyticsService.getUsersGrowth(), []);
  const ordersByType = useAsync(() => analyticsService.getOrdersByType(), []);
  const salesByType = useAsync(() => analyticsService.getSalesByType(), []);
  const pendingApprovals = useAsync(() => analyticsService.getPendingApprovals(), []);
  const hierarchy = useAsync(() => adminApi.getPlatformHierarchy(), []);

  if (stats.loading) {
    return <PageLoader label={t('Loading')} />;
  }

  if (stats.error) {
    return (
      <ErrorState message={String(stats.error)} onRetry={stats.refetch} />
    );
  }

  const s = stats.data || {
    totalUsers: 0,
    totalStores: 0,
    totalRiders: 0,
    totalRevenue: 0,
    totalOrders: 0,
    deliveredOrders: 0,
    totalSellers: 0,
  };
  const growthData = growth.data || { usersCount: [], storesCount: [], ridersCount: [] };
  const orderSlices = ordersByType.data || [];
  const salesData = salesByType.data || { delivery: 0, pickup: 0 };
  const pending = pendingApprovals.data || { pendingStores: 0, pendingRiders: 0, pendingSellers: 0, total: 0 };

  const growthChartData = growthData.usersCount?.length > 0
    ? {
        labels: MONTH_LABELS,
        datasets: [
          {
            label: t('Users'),
            data: growthData.usersCount || [],
            backgroundColor: '#b1c748',
          },
          {
            label: t('Stores'),
            data: growthData.storesCount || [],
            backgroundColor: '#5ac12f',
          },
          {
            label: t('Riders'),
            data: growthData.ridersCount || [],
            backgroundColor: '#64748b',
          },
        ],
      }
    : null;

  const donutData = orderSlices.length > 0
    ? {
        labels: orderSlices.map((slice: any) => t(slice.label) === slice.label ? slice.label : t(slice.label)),
        datasets: [
          {
            label: 'Orders',
            data: orderSlices.map((slice: any) => slice.value || 0),
            backgroundColor: ['#b1c748', '#5ac12f'],
          },
        ],
      }
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t('Welcome back')}, ${user?.name?.split(' ')[0] ?? 'Admin'}`}
        description={
          selectedSectorName
            ? `${t('Dashboard')} — ${selectedSectorName}`
            : t('Dashboard')
        }
      />

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('Users')}
          value={formatNumber(s.totalUsers || 0)}
          icon={<FontAwesomeIcon icon={faUsers} />}
        />
        <StatCard
          label={t('Stores')}
          value={formatNumber(s.totalStores || 0)}
          icon={<FontAwesomeIcon icon={faStore} />}
        />
        <StatCard
          label={t('Riders')}
          value={formatNumber(s.totalRiders || 0)}
          icon={<FontAwesomeIcon icon={faMotorcycle} />}
        />
        <StatCard
          label={t('Total Revenue')}
          value={formatCurrency(s.totalRevenue || 0)}
          icon={<FontAwesomeIcon icon={faCircleDollarToSlot} />}
        />
      </div>

      {/* Alerts & Quick Actions Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Pending Approvals Alert */}
        {pending.total > 0 && (
          <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  {t('Pending Approvals')}
                </p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 mt-1">
                  {pending.total}
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
                  {pending.pendingStores} stores • {pending.pendingRiders} riders • {pending.pendingSellers} sellers
                </p>
              </div>
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-3xl text-yellow-500 opacity-20" />
            </div>
            <Button
              onClick={() => navigate('/stores')}
              variant="secondary"
              className="mt-3 w-full text-sm"
            >
              {t('Review')} <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
            </Button>
          </Card>
        )}

        {/* Orders Today */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('Total Orders')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatNumber(s.totalOrders || 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {formatNumber(s.deliveredOrders || 0)} delivered
              </p>
            </div>
            <FontAwesomeIcon icon={faReceipt} className="text-3xl text-blue-500 opacity-20" />
          </div>
        </Card>

        {/* Quick Stats */}
        <Card>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('Sellers')}</span>
              <span className="font-semibold text-gray-900 dark:text-white">{formatNumber(s.totalSellers || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('Active Riders')}</span>
              <span className="font-semibold text-gray-900 dark:text-white">{formatNumber(s.totalRiders || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('Revenue')}</span>
              <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(s.totalRevenue || 0)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Platform Hierarchy Overview */}
      {hierarchy.data && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <FontAwesomeIcon icon={faMapPin} className="text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('Platform Hierarchy')}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hierarchy.data.regions?.slice(0, 6).map((region: any) => (
              <div
                key={region.id}
                className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition"
                onClick={() => navigate('/locations')}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {region.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {region.children?.length || 0} cities
                    </p>
                  </div>
                  <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs font-medium">
                    REGION
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Button
            onClick={() => navigate('/locations')}
            variant="ghost"
            className="mt-4 w-full text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <FontAwesomeIcon icon={faMapPin} className="mr-2" />
            Explore Full Hierarchy
            <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
          </Button>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
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
          {donutData ? (
            <DonutChart data={donutData} ariaLabel={t('Orders by type')} />
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">
              {t('No data available')}
            </p>
          )}
          <div className="mt-3 flex justify-between border-t border-gray-100 pt-3 dark:border-dark-600">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('Delivery')} — {formatNumber(salesData.delivery || 0)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('Pickup')} — {formatNumber(salesData.pickup || 0)}
            </p>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          {t('Quick Actions')}
        </h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Button
            onClick={() => navigate('/sellers')}
            variant="secondary"
            className="text-sm"
          >
            📋 {t('Manage Sellers')}
          </Button>
          <Button
            onClick={() => navigate('/stores')}
            variant="secondary"
            className="text-sm"
          >
            🏬 {t('Approve Stores')}
          </Button>
          <Button
            onClick={() => navigate('/riders')}
            variant="secondary"
            className="text-sm"
          >
            🚴 {t('Approve Riders')}
          </Button>
          <Button
            onClick={() => navigate('/orders')}
            variant="secondary"
            className="text-sm"
          >
            📦 {t('View Orders')}
          </Button>
        </div>
      </Card>
    </div>
  );
}