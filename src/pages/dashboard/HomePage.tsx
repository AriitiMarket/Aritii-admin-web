/**
 * Admin Home — what the platform is doing right now, in one screen.
 *
 * WHAT THIS PAGE DELIBERATELY DOES NOT SHOW: money. Revenue, payouts, refunds
 * and platform fees belong to Analytics and Commerce (Payments & Transactions),
 * which are the pages that can also explain WHERE a number came from. A total
 * pasted next to people counts on Home looked like revenue and was never
 * reconcilable from this screen, so it was removed rather than kept ambiguous.
 *
 * WHAT IT SHOWS, in the order an operator asks for it:
 *   1. People and places   — providers, businesses, buyers, shops
 *   2. Work to do          — pending approvals
 *   3. Today's activity    — transactions that happened today (count only)
 *   4. Transactions by business (seller) — who is transacting
 *   5. Visualisations      — growth + order mix, from the REAL series the
 *                             analytics endpoints return
 *
 * Chart data note: `GET /analytics/growth` returns `labels`, `storesCount`,
 * `ordersCount` and `revenueCount` only. It cannot measure users, sellers or
 * riders (they live in Identity/Delivery), and it used to answer those series
 * under dishonest names — so this page charts orders and shops, the series it
 * actually gets. Revenue is available here too but is intentionally unused.
 */
import { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMotorcycle,
  faReceipt,
  faStore,
  faUsers,
  faExclamationTriangle,
  faArrowRight,
  faCartShopping,
  faUserTie,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSector } from '@/hooks/useSector';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { analyticsService, usersService } from '@/services';
import type { DistributionSlice } from '@/types/analytics';
import { commerceService } from '@/services/commerce.service';
import { useUserDirectory } from '@/hooks/useUserDirectory';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { PageLoader } from '@/components/common/PageLoader';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { BarChart } from '@/components/charts/BarChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { formatNumber, formatDateTime } from '@/utils/format';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Payments fetched for the dashboard — enough for today + the seller rollup. */
const PAYMENT_LIMIT = 200;

/** True when the ISO timestamp falls on the admin's current local calendar day. */
function isToday(value?: string | null): boolean {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/** One row of "transactions by business": a seller and their payment activity. */
interface SellerActivity {
  sellerId: string;
  name: string;
  transactions: number;
  latest: string;
}

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

  // `GET /analytics/stats` counts every user but does not split buyers out, so
  // the buyer total is read from the role-filtered user list. limit 1 — only the
  // `total` matters here, the rows are never rendered.
  const buyers = useAsync(() => usersService.list({ page: 1, limit: 1, role: 'BUYER' }), []);

  // Transactions: today for the activity card, all rows for the seller rollup.
  // Amounts are deliberately never rendered on this page (see the file header).
  const payments = useAsync(() => commerceService.listPayments({ limit: PAYMENT_LIMIT }), []);
  const paymentRows = useMemo(() => payments.data?.items ?? [], [payments.data]);
  const todayRows = useMemo(() => paymentRows.filter((p) => isToday(p.createdAt)), [paymentRows]);

  // Resolve seller ids to names for the transactions-by-business table.
  const { nameFor } = useUserDirectory(paymentRows.map((p) => p.sellerId ?? null));

  const sellerActivity = useMemo<SellerActivity[]>(() => {
    const byId = new Map<string, SellerActivity>();
    for (const payment of paymentRows) {
      const sellerId = payment.sellerId;
      if (!sellerId) continue;
      const existing = byId.get(sellerId);
      const stamp = payment.createdAt || payment.completedAt;
      if (existing) {
        existing.transactions += 1;
        if (stamp && (!existing.latest || new Date(stamp) > new Date(existing.latest))) {
          existing.latest = stamp;
        }
        continue;
      }
      byId.set(sellerId, {
        sellerId,
        name: payment.sellerName || nameFor(sellerId) || '—',
        transactions: 1,
        latest: stamp || '',
      });
    }
    return Array.from(byId.values()).sort((a, b) => b.transactions - a.transactions);
    // `nameFor` is stable for a given id set, which `paymentRows` already encodes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentRows]);

  const sellerColumns: Column<SellerActivity>[] = [
    { key: 'business', header: t('Business / Seller'), width: '250px', accessor: (row) => row.name },
    {
      key: 'transactions',
      header: t('Transactions'),
      width: '140px',
      numeric: true,
      render: (row) => formatNumber(row.transactions),
    },
    {
      key: 'latest',
      header: t('Latest transaction'),
      width: '180px',
      render: (row) => (row.latest ? formatDateTime(row.latest) : '—'),
    },
  ];

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
    totalOrders: 0,
    deliveredOrders: 0,
    totalSellers: 0,
  };
  const growthData = growth.data;
  const orderSlices = ordersByType.data || [];
  const salesData = salesByType.data || { delivery: 0, pickup: 0 };
  const pending = pendingApprovals.data || { pendingStores: 0, pendingRiders: 0, pendingSellers: 0, total: 0 };

  // Only the series the growth endpoint really returns: orders and shops.
  // `labels` comes from the API; the hard-coded month list is the fallback for
  // the (currently impossible) case of a response without labels.
  const growthLabels = growthData?.labels?.length ? growthData.labels : MONTH_LABELS;
  const growthChartData =
    growthData && (growthData.ordersCount?.length || growthData.storesCount?.length)
      ? {
          labels: growthLabels,
          datasets: [
            {
              label: t('Orders'),
              data: growthData.ordersCount || [],
              backgroundColor: '#b1c748',
            },
            {
              label: t('Shops'),
              data: growthData.storesCount || [],
              backgroundColor: '#5ac12f',
            },
          ],
        }
      : null;

  // `t(x) === x ? x : t(x)` was a no-op left over from a removed label map — it
  // always produced `t(x)`. Typed with the real slice shape instead of `any`.
  const donutData = orderSlices.length > 0
    ? {
        labels: orderSlices.map((slice: DistributionSlice) => t(slice.label)),
        datasets: [
          {
            label: t('Orders'),
            data: orderSlices.map((slice: DistributionSlice) => slice.value || 0),
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
          label={t('Buyers')}
          value={formatNumber(buyers.data?.total ?? 0)}
          hint={t('People buying on the platform')}
          icon={<FontAwesomeIcon icon={faCartShopping} />}
        />
        <StatCard
          label={t('Businesses')}
          value={formatNumber(s.totalSellers || 0)}
          hint={t('Sellers on the platform')}
          icon={<FontAwesomeIcon icon={faUserTie} />}
        />
        <StatCard
          label={t('Shops')}
          value={formatNumber(s.totalStores || 0)}
          hint={t('Shops run by businesses')}
          icon={<FontAwesomeIcon icon={faStore} />}
        />
        <StatCard
          label={t('Providers')}
          value={formatNumber(s.totalRiders || 0)}
          hint={t('Delivery providers')}
          icon={<FontAwesomeIcon icon={faMotorcycle} />}
        />
      </div>

      {/* Alerts & Quick Actions Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Pending Approvals Alert */}
        {pending.total > 0 && (
          <Card className="border-l-4 border-secondary-color/70 bg-secondary-color/10 dark:bg-secondary-color/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  {t('Pending Approvals')}
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {pending.total}
                </p>
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                  {pending.pendingStores} stores • {pending.pendingRiders} riders • {pending.pendingSellers} sellers
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-3xl text-secondary-color opacity-70" />
                <StatusBadge label={t('Pending')} variant="warning" />
              </div>
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
            <FontAwesomeIcon icon={faReceipt} className="text-3xl text-primary-dark opacity-30" />
          </div>
        </Card>

        {/* Today's activity — transactions only, counts not money */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t("Today's Transactions")}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {payments.loading ? '—' : formatNumber(todayRows.length)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {t('Completed')} {formatNumber(todayRows.filter((p) => p.status === 'COMPLETED').length)} ·{' '}
                {t('Pending')} {formatNumber(todayRows.filter((p) => p.status === 'PENDING').length)} ·{' '}
                {t('Failed')} {formatNumber(todayRows.filter((p) => p.status === 'FAILED').length)}
              </p>
            </div>
            <FontAwesomeIcon icon={faReceipt} className="text-3xl text-primary-dark opacity-30" />
          </div>
          <Button
            onClick={() => navigate('/commerce/transactions')}
            variant="secondary"
            className="mt-3 w-full text-sm"
          >
            {t('View Transactions')} <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
          </Button>
        </Card>
      </div>

      {/* Transactions by business — who is transacting on the platform */}
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t('Transactions by Business')}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('Every seller that has payments, ranked by transaction volume. Amounts live in Commerce.')}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate('/commerce/transactions')}>
            {t('View All')} <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
          </Button>
        </div>
        <DataTable<SellerActivity>
          columns={sellerColumns}
          rows={sellerActivity}
          rowKey={(row) => row.sellerId}
          loading={payments.loading}
          emptyTitle={t('No transactions yet')}
        />
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <p className="mb-3 text-base font-semibold text-slate-900 dark:text-white">
            {t('Orders & shops growth')} — {new Date().getFullYear()}
          </p>
          {growthChartData ? (
            <BarChart data={growthChartData} ariaLabel={t('Orders and shops growth')} />
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">
              {t('No data available')}
            </p>
          )}
        </Card>

        <Card>
          <p className="mb-3 text-base font-semibold text-slate-900 dark:text-white">
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
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          {t('Quick Actions')}
        </h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Button
            onClick={() => navigate('/users?tab=sellers')}
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