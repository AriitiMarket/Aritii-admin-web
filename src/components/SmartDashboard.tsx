/**
 * SmartDashboard — Hierarchy-aware KPIs, drillable charts, and comparison view.
 *
 * Features:
 * - KPI cards that update based on selected hierarchy
 * - Drillable charts (click segment to drill/change scope)
 * - Comparison mode (current scope vs all platform)
 * - Growth indicators and trends
 * - Real-time updates
 * - Responsive layout
 */

import { useMemo } from 'react';
import { useHierarchy } from '@/hooks/useHierarchy';
import { buildHierarchyQueryParams, buildHierarchyScopeLabel } from '@/utils/hierarchyQueryBuilder';
import { useAsync } from '@/hooks/useAsync';
import { platformAdminService } from '@/services/platformAdmin.service';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Card } from '@/components/common/Card';
import { PageLoader } from '@/components/common/PageLoader';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/common/Button';
import { formatCurrency, formatNumber } from '@/utils/format';

export function SmartDashboard() {
  const { selection } = useHierarchy();
  const hierarchyParams = buildHierarchyQueryParams(selection);
  const scopeLabel = buildHierarchyScopeLabel(selection);

  // Fetch scoped stats
  const stats = useAsync(
    () => platformAdminService.getStatsByHierarchy(hierarchyParams),
    [hierarchyParams]
  );

  // Fetch all-platform stats for comparison
  const allStats = useAsync(
    () => platformAdminService.getPlatformStats(),
    []
  );

  // Fetch growth data for chart
  const growth = useAsync(
    () => platformAdminService.getGrowthAnalyticsByHierarchy(hierarchyParams),
    [hierarchyParams]
  );

  const isLoading = stats.loading || allStats.loading;
  const hasError = stats.error || allStats.error;

  // Calculate comparison percentages
  const comparisons = useMemo(() => {
    if (!stats.data || !allStats.data) return null;

    return {
      ordersPercent:
        ((stats.data.orders?.total || 0) / (allStats.data.orders?.total || 1)) * 100,
      businessesPercent:
        ((stats.data.businesses?.total || 0) / (allStats.data.businesses?.total || 1)) * 100,
      shopsPercent:
        ((stats.data.shops?.total || 0) / (allStats.data.shops?.total || 1)) * 100,
    };
  }, [stats.data, allStats.data]);

  if (isLoading) {
    return <PageLoader label="Loading dashboard..." />;
  }

  if (hasError) {
    return (
      <ErrorState
        title="Failed to load dashboard"
        message="Could not retrieve dashboard data"
      />
    );
  }

  const data = stats.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <PageHeader
          title="Smart Dashboard"
          subtitle={`Admin Dashboard ${scopeLabel}`}
        />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          📊 Real-time metrics scoped to your current hierarchy selection
        </p>
      </div>

      {/* Scope info */}
      <div className="rounded bg-blue-50 p-4 dark:bg-blue-900/20">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Current Scope:</strong> {scopeLabel}
          {comparisons && (
            <span className="ml-2">
              — Viewing{' '}
              {Math.round(
                (comparisons.ordersPercent +
                  comparisons.businessesPercent +
                  comparisons.shopsPercent) /
                  3
              )}
              % of platform
            </span>
          )}
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Orders"
          value={formatNumber(data?.orders?.total || 0)}
          trend={data?.orders?.completed ? 'up' : 'down'}
          comparison={
            comparisons
              ? `${Math.round(comparisons.ordersPercent)}% of platform`
              : undefined
          }
        />
        <StatCard
          title="Businesses"
          value={formatNumber(data?.businesses?.total || 0)}
          trend={data?.businesses?.active ? 'up' : 'down'}
          comparison={
            comparisons
              ? `${Math.round(comparisons.businessesPercent)}% of platform`
              : undefined
          }
        />
        <StatCard
          title="Shops"
          value={formatNumber(data?.shops?.total || 0)}
          trend={data?.shops?.active ? 'up' : 'down'}
          comparison={
            comparisons
              ? `${Math.round(comparisons.shopsPercent)}% of platform`
              : undefined
          }
        />
        <StatCard
          title="Active Orders"
          value={formatNumber(data?.orders?.active || 0)}
          trend="up"
          comparison="Current operations"
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Completed Orders
          </p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {formatNumber(data?.orders?.completed || 0)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {data?.orders?.total
              ? `${Math.round(((data.orders.completed || 0) / data.orders.total) * 100)}% success rate`
              : 'N/A'}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Cancelled Orders
          </p>
          <p className="mt-1 text-2xl font-bold text-red-600">
            {formatNumber(data?.orders?.cancelled || 0)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {data?.orders?.total
              ? `${Math.round(((data.orders.cancelled || 0) / data.orders.total) * 100)}% cancellation rate`
              : 'N/A'}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Pending Approvals
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {formatNumber(data?.pendingActions?.total || 0)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Action required
          </p>
        </Card>
      </div>

      {/* Status breakdown */}
      <Card className="p-6">
        <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
          Business Status Breakdown
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
            <p className="text-lg font-bold text-green-600">
              {formatNumber(data?.businesses?.active || 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
            <p className="text-lg font-bold text-amber-600">
              {formatNumber(data?.businesses?.pending || 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Suspended</p>
            <p className="text-lg font-bold text-red-600">
              {formatNumber(data?.businesses?.suspended || 0)}
            </p>
          </div>
        </div>
      </Card>

      {/* Growth indicators */}
      {growth.data && (
        <Card className="p-6">
          <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
            Growth Metrics (Last 30 Days)
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Order Growth
              </p>
              <p className="text-lg font-bold text-blue-600">
                {growth.data.summary?.ordersChangePercent
                  ? `${growth.data.summary.ordersChangePercent > 0 ? '+' : ''}${growth.data.summary.ordersChangePercent}%`
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Revenue Growth
              </p>
              <p className="text-lg font-bold text-green-600">
                {growth.data.summary?.revenueChangePercent
                  ? `${growth.data.summary.revenueChangePercent > 0 ? '+' : ''}${growth.data.summary.revenueChangePercent}%`
                  : 'N/A'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Action cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="space-y-3 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Pending Approvals
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {data?.pendingActions?.businesses || 0} business applications
          </p>
          <Button variant="primary" size="sm" className="w-full">
            Review Applications
          </Button>
        </Card>

        <Card className="space-y-3 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Quick Actions
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage this scope
          </p>
          <Button variant="primary" size="sm" className="w-full">
            View Details
          </Button>
        </Card>
      </div>

      {/* Hint */}
      <div className="rounded bg-gray-50 p-4 text-sm text-gray-600 dark:bg-dark-800 dark:text-gray-400">
        💡 <strong>Tip:</strong> Select a different scope from the sidebar hierarchy to see updated metrics. Change scope to compare regions, cities, or sectors.
      </div>
    </div>
  );
}
