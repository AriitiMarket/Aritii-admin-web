/**
 * Main Admin Dashboard with Tabbed Sections
 * Displays all key admin functions in organized tabs
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatCard } from '@/components/common/StatCard';
import { Tab, Tabs, TabContent } from '@/components/common/Tabs';
import { useAsync } from '@/hooks/useAsync';
import {
  analyticsService,
  usersService,
  sellersService,
  storesService,
  ridersService,
  ordersService,
} from '@/services';
import { PageLoader } from '@/components/common/PageLoader';
import { ErrorState } from '@/components/common/ErrorState';

type DashboardTab = 'overview' | 'users' | 'sellers' | 'stores' | 'riders' | 'orders' | 'reviews' | 'system';

export function DashboardTabs() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  // Fetch all data
  const stats = useAsync(() => analyticsService.getStats(), []);
  const growth = useAsync(() => analyticsService.getUsersGrowth(), []);
  const recentUsers = useAsync(() => usersService.list({ page: 1, limit: 5, search: '' }), []);
  const recentSellers = useAsync(() => sellersService.list({ page: 1, limit: 5, search: '' }), []);
  const recentStores = useAsync(() => storesService.list({ page: 1, limit: 5 }), []);
  const pendingRiders = useAsync(() => ridersService.list({ page: 1, limit: 5, search: '' }), []);
  const recentOrders = useAsync(() => ordersService.list({ page: 1, limit: 5 }), []);

  if (stats.loading) {
    return <PageLoader label={t('Loading Dashboard')} />;
  }

  const tabsConfig = [
    { id: 'overview', label: t('Overview'), icon: '📊' },
    { id: 'users', label: t('Users'), icon: '👥' },
    { id: 'sellers', label: t('Sellers'), icon: '🏪' },
    { id: 'stores', label: t('Stores'), icon: '🏬' },
    { id: 'riders', label: t('Riders'), icon: '🚴' },
    { id: 'orders', label: t('Orders'), icon: '📦' },
    { id: 'reviews', label: t('Reviews'), icon: '⭐' },
    { id: 'system', label: t('System'), icon: '⚙️' },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('Admin Dashboard')}
        description={t('Manage all platform operations')}
      />

      {/* Quick Stats */}
      {stats.data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t('Total Users')}
            value={String(stats.data.totalUsers || 0)}
            icon="👥"
          />
          <StatCard
            label={t('Total Sellers')}
            value={String(stats.data.totalSellers || 0)}
            icon="🏪"
          />
          <StatCard
            label={t('Total Stores')}
            value={String(stats.data.totalStores || 0)}
            icon="🏬"
          />
          <StatCard
            label={t('Total Orders')}
            value={String(stats.data.totalOrders || 0)}
            icon="📦"
          />
        </div>
      )}

      {/* Tabs Navigation */}
      <Tabs activeTab={activeTab} onChange={(tab) => setActiveTab(tab as DashboardTab)}>
        {tabsConfig.map((tab) => (
          <Tab
            key={tab.id}
            id={tab.id}
            label={`${tab.icon} ${tab.label}`}
            isActive={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </Tabs>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <TabContent>
            <OverviewSection
              stats={stats.data}
              growth={growth.data}
              recentUsers={recentUsers.data}
              recentOrders={recentOrders.data}
              navigate={navigate}
            />
          </TabContent>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <TabContent>
            <UsersSection
              data={recentUsers.data}
              loading={recentUsers.loading}
              error={recentUsers.error}
              refetch={recentUsers.refetch}
              navigate={navigate}
            />
          </TabContent>
        )}

        {/* Sellers Tab */}
        {activeTab === 'sellers' && (
          <TabContent>
            <SellersSection
              data={recentSellers.data}
              loading={recentSellers.loading}
              error={recentSellers.error}
              refetch={recentSellers.refetch}
              navigate={navigate}
            />
          </TabContent>
        )}

        {/* Stores Tab */}
        {activeTab === 'stores' && (
          <TabContent>
            <StoresSection
              data={recentStores.data}
              loading={recentStores.loading}
              error={recentStores.error}
              refetch={recentStores.refetch}
              navigate={navigate}
            />
          </TabContent>
        )}

        {/* Riders Tab */}
        {activeTab === 'riders' && (
          <TabContent>
            <RidersSection
              data={pendingRiders.data}
              loading={pendingRiders.loading}
              error={pendingRiders.error}
              refetch={pendingRiders.refetch}
              navigate={navigate}
            />
          </TabContent>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <TabContent>
            <OrdersSection
              data={recentOrders.data}
              loading={recentOrders.loading}
              error={recentOrders.error}
              refetch={recentOrders.refetch}
              navigate={navigate}
            />
          </TabContent>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <TabContent>
            <ReviewsSection navigate={navigate} />
          </TabContent>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <TabContent>
            <SystemSection navigate={navigate} />
          </TabContent>
        )}
      </div>
    </div>
  );
}

// Overview Section Component
function OverviewSection({ stats, recentUsers, recentOrders, navigate }: any) {
  const { t } = useLocalization();

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main KPIs */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <h3 className="text-lg font-semibold mb-4">{t('Key Metrics')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('Revenue')}</p>
              <p className="text-2xl font-bold">${stats?.totalRevenue || 0}</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded">
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('Delivered Orders')}</p>
              <p className="text-2xl font-bold">{stats?.deliveredOrders || 0}</p>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded">
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('Riders')}</p>
              <p className="text-2xl font-bold">{stats?.totalRiders || 0}</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded">
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('Active Stores')}</p>
              <p className="text-2xl font-bold">{stats?.totalStores || 0}</p>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">{t('Quick Actions')}</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => navigate('/sellers')} variant="secondary">
              📋 {t('Manage Sellers')}
            </Button>
            <Button onClick={() => navigate('/stores')} variant="secondary">
              🏬 {t('Approve Stores')}
            </Button>
            <Button onClick={() => navigate('/riders')} variant="secondary">
              🚴 {t('Approve Riders')}
            </Button>
            <Button onClick={() => navigate('/orders')} variant="secondary">
              📦 {t('View Orders')}
            </Button>
          </div>
        </Card>
      </div>

      {/* Recent Activity Sidebar */}
      <div className="space-y-4">
        <Card>
          <h3 className="text-lg font-semibold mb-3">{t('Recent Users')}</h3>
          <div className="space-y-2">
            {recentUsers?.items?.slice(0, 3).map((user: any) => (
              <div
                key={user.id}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer"
                onClick={() => navigate(`/users/${user.id}`)}
              >
                <p className="font-medium text-sm">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-3">{t('Recent Orders')}</h3>
          <div className="space-y-2">
            {recentOrders?.items?.slice(0, 3).map((order: any) => (
              <div
                key={order.id}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <p className="font-medium text-sm">Order #{order.id}</p>
                <p className="text-xs text-gray-500">${order.totalPrice}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// Users Section
function UsersSection({ data, loading, error, refetch, navigate }: any) {
  const { t } = useLocalization();

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{t('Users Management')}</h3>
        <Button onClick={() => navigate('/users')} variant="primary">
          {t('View All')}
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">{t('Name')}</th>
              <th className="text-left py-2">{t('Email')}</th>
              <th className="text-left py-2">{t('Status')}</th>
              <th className="text-left py-2">{t('Joined')}</th>
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((user: any) => (
              <tr key={user.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="py-3">{user.name}</td>
                <td className="py-3">{user.email}</td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded text-sm ${
                    user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="py-3 text-sm text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// Sellers Section
function SellersSection({ data, loading, error, refetch, navigate }: any) {
  const { t } = useLocalization();

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{t('Sellers Management')}</h3>
        <Button onClick={() => navigate('/sellers')} variant="primary">
          {t('View All')}
        </Button>
      </div>
      <div className="space-y-3">
        {data?.items?.map((seller: any) => (
          <div
            key={seller.id}
            className="p-4 border rounded hover:shadow cursor-pointer"
            onClick={() => navigate(`/sellers/${seller.id}`)}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{seller.name}</p>
                <p className="text-sm text-gray-600">{seller.email}</p>
              </div>
              <span className="text-sm font-medium">{seller.storesCount} stores</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// Stores Section
function StoresSection({ data, loading, error, refetch, navigate }: any) {
  const { t } = useLocalization();

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{t('Stores Management')}</h3>
        <Button onClick={() => navigate('/stores')} variant="primary">
          {t('View All')}
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {data?.slice(0, 4).map((store: any) => (
          <div
            key={store.id}
            className="p-4 border rounded hover:shadow cursor-pointer"
            onClick={() => navigate(`/stores/${store.id}`)}
          >
            <p className="font-semibold">{store.name}</p>
            <p className="text-sm text-gray-600">{store.owner}</p>
            <p className="text-sm mt-2">
              <span className={`px-2 py-1 rounded text-xs ${
                store.status === 'ACTIVE' ? 'bg-green-100' : 'bg-yellow-100'
              }`}>
                {store.status}
              </span>
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

// Riders Section
function RidersSection({ data, loading, error, refetch, navigate }: any) {
  const { t } = useLocalization();

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{t('Riders Management')}</h3>
        <Button onClick={() => navigate('/riders')} variant="primary">
          {t('View All')}
        </Button>
      </div>
      <div className="space-y-3">
        {data?.items?.map((rider: any) => (
          <div
            key={rider.id}
            className="p-4 border rounded hover:shadow cursor-pointer"
            onClick={() => navigate(`/riders/${rider.id}`)}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{rider.name}</p>
                <p className="text-sm text-gray-600">{rider.phone}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${
                rider.status === 'ACTIVE' ? 'bg-green-100' : 'bg-blue-100'
              }`}>
                {rider.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// Orders Section
function OrdersSection({ data, loading, error, refetch, navigate }: any) {
  const { t } = useLocalization();

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{t('Recent Orders')}</h3>
        <Button onClick={() => navigate('/orders')} variant="primary">
          {t('View All')}
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">{t('Order ID')}</th>
              <th className="text-left py-2">{t('Customer')}</th>
              <th className="text-left py-2">{t('Total')}</th>
              <th className="text-left py-2">{t('Status')}</th>
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((order: any) => (
              <tr key={order.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="py-3 font-mono text-sm">{order.id}</td>
                <td className="py-3">{order.customer}</td>
                <td className="py-3">${order.totalPrice}</td>
                <td className="py-3">
                  {/* `COMPLETED` is a PAYMENT status, never an order status, so
                      this comparison never matched and every row rendered in the
                      "pending" style — including delivered ones. */}
                  <span className={`px-2 py-1 rounded text-sm ${
                    order.status === 'Delivered' ? 'bg-green-100 text-green-800'
                      : order.status === 'Cancelled' ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// Reviews Section
function ReviewsSection({ navigate }: any) {
  const { t } = useLocalization();

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{t('Pending Reviews')}</h3>
        <Button onClick={() => navigate('/catalog/pending-reviews')} variant="primary">
          {t('View All')}
        </Button>
      </div>
      <p className="text-gray-600">{t('Manage product and store reviews')}</p>
    </Card>
  );
}

// System Section
function SystemSection({ navigate }: any) {
  const { t } = useLocalization();

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <h3 className="text-lg font-semibold mb-4">{t('Settings')}</h3>
        <Button onClick={() => navigate('/settings')} variant="secondary" className="w-full">
          {t('Platform Settings')}
        </Button>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold mb-4">{t('Administration')}</h3>
        <Button onClick={() => navigate('/admins')} variant="secondary" className="w-full">
          {t('Manage Admins')}
        </Button>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold mb-4">{t('Locations')}</h3>
        <Button onClick={() => navigate('/catalog/sectors')} variant="secondary" className="w-full">
          {t('Manage Sectors')}
        </Button>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold mb-4">{t('Analytics')}</h3>
        <Button onClick={() => navigate('/analytics')} variant="secondary" className="w-full">
          {t('View Analytics')}
        </Button>
      </Card>
    </div>
  );
}
