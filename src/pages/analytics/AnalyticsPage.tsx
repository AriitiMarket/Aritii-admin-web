import { useState, useCallback, useMemo } from 'react';
import { analyticsService } from '@/services/analytics.service';
import { businessesService, type SellerApplication } from '@/services/businesses.service';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { StatCard } from '@/components/common/StatCard';
import { ErrorState } from '@/components/common/ErrorState';
import { PageLoader } from '@/components/common/PageLoader';
import { BarChart } from '@/components/charts/BarChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { LineChart } from '@/components/charts/LineChart';
import type {
  DashboardStats,
  DistributionSlice,
  SalesByType,
  UsersGrowthSeries,
  SalesOverTimePoint,
  CategoryActivity,
  ProductStats,
  DisputeStats,
  DeliveryStatsData,
  ShopStats,
} from '@/types';

function DateRangePicker({
  startDate,
  endDate,
  onChange,
}: {
  startDate: string;
  endDate: string;
  onChange: (s: string, e: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="text-sm font-medium text-gray-600 dark:text-gray-300">From</label>
      <input
        type="date"
        value={startDate}
        onChange={(e) => onChange(e.target.value, endDate)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      />
      <label className="text-sm font-medium text-gray-600 dark:text-gray-300">To</label>
      <input
        type="date"
        value={endDate}
        onChange={(e) => onChange(startDate, e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      />
      {(startDate || endDate) && (
        <button
          onClick={() => onChange('', '')}
          className="text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          Clear
        </button>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{children}</h2>
  );
}

function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
}: {
  columns: { key: string; label: string; render?: (val: unknown, row: T) => React.ReactNode }[];
  rows: T[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400">
                No data available
              </td>
            </tr>
          )}
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-2 text-gray-700 dark:text-gray-200">
                  {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BusinessSelector({
  businesses,
  loading,
  selectedBusinessId,
  onChange,
}: {
  businesses: SellerApplication[];
  loading: boolean;
  selectedBusinessId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Business</label>
      <select
        value={selectedBusinessId}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        disabled={loading}
      >
        <option value="">All businesses (platform-wide)</option>
        {businesses.map((b) => (
          <option key={b.id} value={b.id}>
            {b.businessInformation?.businessName || b.businessName || 'Unnamed business'}
            {b.ownerEmail ? ` (${b.ownerEmail})` : ''}
          </option>
        ))}
      </select>
      {selectedBusinessId && (
        <button
          onClick={() => onChange('')}
          className="text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          Clear
        </button>
      )}
    </div>
  );
}

export function GrowthAnalyticsPage() {
  const { t } = useLocalization();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedBusinessId, setSelectedBusinessId] = useState('');

  const handleDateChange = useCallback((s: string, e: string) => {
    setStartDate(s);
    setEndDate(e);
  }, []);

  const dateKey = `${startDate}-${endDate}-${selectedBusinessId}`;

  const { data: businessesData, loading: businessesLoading, error: businessesError, refetch: refetchBusinesses } = useAsync(
    () => businessesService.listApplications({ page: 1, limit: 100 }),
    []
  );

  const businesses: SellerApplication[] = businessesData?.items ?? [];

  const scope = useMemo(() => ({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    businessId: selectedBusinessId || undefined,
  }), [startDate, endDate, selectedBusinessId]);

  const stats = useAsync(() => analyticsService.getStats(scope), [dateKey]);
  const growth = useAsync(() => analyticsService.getUsersGrowth(scope), [dateKey]);
  const ordersByType = useAsync(() => analyticsService.getOrdersByType(scope), [dateKey]);
  const salesByType = useAsync(() => analyticsService.getSalesByType(scope), [dateKey]);
  const salesOverTime = useAsync(() => analyticsService.getSalesOverTime(scope), [dateKey]);
  const ordersByStatus = useAsync(() => analyticsService.getOrdersByStatus(scope), [dateKey]);
  const categoryActivity = useAsync(() => analyticsService.getCategoryActivity(scope), [dateKey]);
  const productStats = useAsync(() => analyticsService.getProductStats(scope), [dateKey]);
  const disputeStats = useAsync(() => analyticsService.getDisputeStats(scope), [dateKey]);
  const deliveryStats = useAsync(() => analyticsService.getDeliveryStats(scope), [dateKey]);
  const shopStats = useAsync(() => analyticsService.getShopStats(scope.startDate, scope.endDate, scope.businessId), [dateKey]);

  const anyError = stats.error ?? growth.error ?? ordersByType.error ?? businessesError;
  const anyLoading = stats.loading || growth.loading || businessesLoading;

  if (anyLoading && !anyError) return <PageLoader />;
  if (anyError) return <ErrorState message={String(anyError)} onRetry={() => { refetchBusinesses(); stats.refetch(); }} />;

  const s = stats.data as DashboardStats | null;
  const g = growth.data as UsersGrowthSeries | null;
  const orders = ordersByType.data as DistributionSlice[] | null;
  const sales = salesByType.data as SalesByType | null;
  const salesTime = salesOverTime.data as SalesOverTimePoint[] | null;
  const orderStatus = ordersByStatus.data as DistributionSlice[] | null;
  const categories = categoryActivity.data as CategoryActivity[] | null;
  const pStats = productStats.data as ProductStats | null;
  const dStats = disputeStats.data as DisputeStats | null;
  const dlStats = deliveryStats.data as DeliveryStatsData | null;
  const shStats = shopStats.data as ShopStats | null;

  const scopeLabel = selectedBusinessId
    ? businesses?.find((b) => b.id === selectedBusinessId)?.businessInformation?.businessName || businesses?.find((b) => b.id === selectedBusinessId)?.businessName || 'Selected business'
    : 'Platform-wide';

  const isScoped = Boolean(selectedBusinessId);

  const growthData = g ? {
    labels: g.labels || [],
    datasets: [
      { label: t('Orders'), data: g.ordersCount || [], backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
      { label: t('Revenue'), data: g.revenueCount || [], backgroundColor: '#10b981', borderColor: '#10b981' },
      { label: t('Shops'), data: g.storesCount || [], backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
    ],
  } : { labels: [], datasets: [] };

  const salesTimeData = salesTime ? {
    labels: salesTime.map((d) => d.date),
    datasets: [{
      label: t('Revenue'),
      data: salesTime.map((d) => d.revenue),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,0.1)',
      fill: true,
    }],
  } : { labels: [], datasets: [] };

  const salesDonutData = {
    labels: [t('Delivery'), t('Pickup')],
    datasets: [{
      data: [sales?.delivery ?? 0, sales?.pickup ?? 0],
      backgroundColor: ['#3b82f6', '#8b5cf6'],
    }],
  };

  const orderStatusDonut = orderStatus ? {
    labels: orderStatus.map((d) => d.label),
    datasets: [{
      data: orderStatus.map((d) => d.value),
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
    }],
  } : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('Reports & Analytics')}
        description={t('Comprehensive marketplace performance overview')}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedBusinessId('')}
              className={`text-sm font-medium transition ${isScoped ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
            >
              {t('View platform-wide')}
            </button>
          </div>
        }
      />

      {/* Scope selector row */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <BusinessSelector
            businesses={businesses || []}
            loading={businessesLoading}
            selectedBusinessId={selectedBusinessId}
            onChange={setSelectedBusinessId}
          />
          <DateRangePicker startDate={startDate} endDate={endDate} onChange={handleDateChange} />
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
            Scope: <span className="font-medium">{isScoped ? `Business: ${scopeLabel}` : 'Platform-wide'}</span>
          </span>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {isScoped
            ? `Showing authorized report data for business “${scopeLabel}”. Platform-wide totals are not mixed with business totals.`
            : t('Showing platform-wide totals across all businesses.')}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('Users')} value={`${s?.totalUsers ?? 0}`} />
        <StatCard label={t('Sellers')} value={`${s?.totalSellers ?? 0}`} />
        <StatCard label={t('Shops')} value={`${s?.totalStores ?? 0}`} />
        <StatCard label={t('Riders')} value={`${s?.totalRiders ?? 0}`} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('Orders')} value={`${s?.totalOrders ?? 0}`} />
        <StatCard label={t('Revenue')} value={`ETB ${(s?.totalRevenue ?? 0).toLocaleString()}`} />
        <StatCard label={t('Avg Order Value')} value={`ETB ${(s?.avgOrderValue ?? 0).toLocaleString()}`} />
        <StatCard label={t('Delivery Rate')} value={`${s?.deliveryRate ?? 0}%`} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('Products')} value={`${s?.totalProducts ?? 0}`} />
        <StatCard label={t('Delivered')} value={`${s?.deliveredOrders ?? 0}`} />
        <StatCard label={t('Cancelled')} value={`${s?.cancelledOrders ?? 0}`} />
        <StatCard label={t('Shops (Active)')} value={`${shStats?.approved ?? 0}`} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle>{t('Growth Over Time')}</SectionTitle>
          <div className="mt-4">
            <BarChart data={growthData} ariaLabel={t('Growth chart')} />
          </div>
        </Card>
        <Card>
          <SectionTitle>{t('Revenue Trend')}</SectionTitle>
          <div className="mt-4">
            <LineChart data={salesTimeData} ariaLabel={t('Revenue trend chart')} />
          </div>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <SectionTitle>{t('Sales by Type')}</SectionTitle>
          <div className="mt-4">
            <DonutChart data={salesDonutData} ariaLabel={t('Sales distribution')} />
          </div>
        </Card>
        {orderStatusDonut && (
          <Card>
            <SectionTitle>{t('Orders by Status')}</SectionTitle>
            <div className="mt-4">
              <DonutChart data={orderStatusDonut} ariaLabel={t('Order status distribution')} />
            </div>
          </Card>
        )}
        {orders && orders.length > 0 && (
          <Card>
            <SectionTitle>{t('Orders by Type')}</SectionTitle>
            <div className="mt-4 space-y-2">
              {orders.map((slice) => (
                <div key={slice.label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-200">{slice.label}</span>
                  <span className="font-medium text-gray-800 dark:text-gray-100">{slice.value}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Product & Shop Stats */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {pStats && (
          <Card>
            <SectionTitle>{t('Product Activity')}</SectionTitle>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{pStats.totalProducts}</div>
                <div className="text-sm text-gray-500">{t('Total Products')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{pStats.newProducts}</div>
                <div className="text-sm text-gray-500">{t('New Products')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{pStats.lowStock}</div>
                <div className="text-sm text-gray-500">{t('Low Stock')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{pStats.outOfStock}</div>
                <div className="text-sm text-gray-500">{t('Out of Stock')}</div>
              </div>
            </div>
          </Card>
        )}
        {shStats && (
          <Card>
            <SectionTitle>{t('Shop Overview')}</SectionTitle>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{shStats.total}</div>
                <div className="text-sm text-gray-500">{t('Total Shops')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{shStats.approved}</div>
                <div className="text-sm text-gray-500">{t('Approved')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{shStats.pending}</div>
                <div className="text-sm text-gray-500">{t('Pending')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{shStats.suspended}</div>
                <div className="text-sm text-gray-500">{t('Suspended')}</div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Category Activity Table */}
      {categories && categories.length > 0 && (
        <Card>
          <SectionTitle>{t('Category Activity')}</SectionTitle>
          <div className="mt-4">
            <DataTable
              columns={[
                { key: 'category', label: t('Category') },
                { key: 'count', label: t('Products') },
              ]}
              rows={categories.map((c) => ({ category: c.category, count: c.count }))}
            />
          </div>
        </Card>
      )}

      {/* Delivery & Dispute Stats */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {dlStats && (
          <Card>
            <SectionTitle>{t('Delivery Performance')}</SectionTitle>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{dlStats.totalRiders}</div>
                <div className="text-sm text-gray-500">{t('Total Riders')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{dlStats.activeRiders}</div>
                <div className="text-sm text-gray-500">{t('Active Riders')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{dlStats.completedDeliveries}</div>
                <div className="text-sm text-gray-500">{t('Completed')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{dlStats.failedDeliveries}</div>
                <div className="text-sm text-gray-500">{t('Failed')}</div>
              </div>
            </div>
          </Card>
        )}
        {dStats && (
          <Card>
            <SectionTitle>{t('Dispute Statistics')}</SectionTitle>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{dStats.total}</div>
                <div className="text-sm text-gray-500">{t('Total Disputes')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{dStats.open}</div>
                <div className="text-sm text-gray-500">{t('Open')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{dStats.inProgress}</div>
                <div className="text-sm text-gray-500">{t('In Progress')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{dStats.resolved}</div>
                <div className="text-sm text-gray-500">{t('Resolved')}</div>
              </div>
            </div>
            {dStats.byType && dStats.byType.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-500 mb-2">{t('By Type')}</div>
                {dStats.byType.map((item) => (
                  <div key={item.type} className="flex items-center justify-between text-sm py-1">
                    <span className="capitalize text-gray-700 dark:text-gray-200">{item.type}</span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
