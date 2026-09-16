/**
 * Growth & Analytics by hierarchy level (spec: analyse region / city / area /
 * sector / business, with an explicit comparison period and no invented
 * percentages).
 *
 * Backend: GET /admin/growth-analytics — server-side aggregation over real
 * orders, businesses and shops; `summary.*ChangePercent` is null whenever the
 * comparison window has no data.
 */
import { useCallback, useEffect, useState } from 'react';
import { platformAdminService, type GrowthAnalytics } from '@/services/platformAdmin.service';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatCard } from '@/components/common/StatCard';
import { ErrorState } from '@/components/common/ErrorState';
import { PageLoader } from '@/components/common/PageLoader';
import { EmptyState } from '@/components/common/EmptyState';
import { BarChart } from '@/components/charts/BarChart';
import { formatCurrency, formatDateTime, formatNumber } from '@/utils/format';

const RANGES: { key: string; label: string; days: number }[] = [
  { key: 'today', label: 'Today', days: 1 },
  { key: '7d', label: 'Last 7 days', days: 7 },
  { key: '30d', label: 'Last 30 days', days: 30 },
  { key: '90d', label: 'Last 3 months', days: 90 },
  { key: '180d', label: 'Last 6 months', days: 180 },
  { key: '365d', label: 'Last year', days: 365 },
  { key: 'custom', label: 'Custom range', days: 30 },
];

function todayIso(offsetDays = 0): string {
  const date = new Date(Date.now() - offsetDays * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

export function GrowthByHierarchyPage() {
  const [range, setRange] = useState('30d');
  const [granularity, setGranularity] = useState('day');
  const [from, setFrom] = useState(todayIso(30));
  const [to, setTo] = useState(todayIso(0));
  const [locationId, setLocationId] = useState('');
  const [sectorId, setSectorId] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [data, setData] = useState<GrowthAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = {
        granularity,
        locationId: locationId || undefined,
        sectorId: sectorId || undefined,
        businessId: businessId || undefined,
      };
      if (range === 'custom') {
        params.from = from;
        params.to = to;
      } else {
        params.days = RANGES.find((entry) => entry.key === range)?.days ?? 30;
      }
      setData(await platformAdminService.getGrowthAnalytics(params));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load growth analytics');
    } finally {
      setLoading(false);
    }
  }, [granularity, range, from, to, locationId, sectorId, businessId]);

  useEffect(() => {
    void load();
  }, [load]);

  const change = (value: number | null) => (value === null ? 'not enough data' : `${value}%`);
  const series = data?.series?.filter((row) => row.period === 'current') || [];
  const chartData =
    series.length > 0
      ? {
          labels: series.map((row) => row.bucket),
          datasets: [
            { label: 'Orders', data: series.map((row) => row.orders), backgroundColor: '#b1c748' },
            { label: 'Revenue', data: series.map((row) => row.revenue), backgroundColor: '#5ac12f' },
          ],
        }
      : null;

if (loading && !data) return <PageLoader label="Loading growth analytics…" />;
  if (error && !data) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <PageHeader
        title="Growth & Analytics"
        description="Growth by region, city, area, sector or business — with an explicit comparison period"
        actions={
          <Button variant="outline" size="sm" onClick={load} loading={loading}>
            Refresh
          </Button>
        }
      />

      <Card className="mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Period</span>
            <select
              className="h-10 rounded border border-gray-300 bg-white px-2 text-sm dark:border-dark-600 dark:bg-dark-900"
              value={range}
              onChange={(event) => setRange(event.target.value)}
            >
              {RANGES.map((entry) => (
                <option key={entry.key} value={entry.key}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Granularity</span>
            <select
              className="h-10 rounded border border-gray-300 bg-white px-2 text-sm dark:border-dark-600 dark:bg-dark-900"
              value={granularity}
              onChange={(event) => setGranularity(event.target.value)}
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </label>
          {range === 'custom' && (
            <>
              <label className="text-sm">
                <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">From</span>
                <input
                  type="date"
                  className="h-10 rounded border border-gray-300 bg-white px-2 text-sm dark:border-dark-600 dark:bg-dark-900"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">To</span>
                <input
                  type="date"
                  className="h-10 rounded border border-gray-300 bg-white px-2 text-sm dark:border-dark-600 dark:bg-dark-900"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                />
              </label>
            </>
          )}
          <label className="text-sm">
            <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Location id</span>
            <input
              className="h-10 rounded border border-gray-300 bg-white px-2 text-sm dark:border-dark-600 dark:bg-dark-900"
              value={locationId}
              onChange={(event) => setLocationId(event.target.value)}
              placeholder="from Explorer"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Sector id</span>
            <input
              className="h-10 rounded border border-gray-300 bg-white px-2 text-sm dark:border-dark-600 dark:bg-dark-900"
              value={sectorId}
              onChange={(event) => setSectorId(event.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Business id</span>
            <input
              className="h-10 rounded border border-gray-300 bg-white px-2 text-sm dark:border-dark-600 dark:bg-dark-900"
              value={businessId}
              onChange={(event) => setBusinessId(event.target.value)}
            />
          </label>
        </div>
      </Card>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {data && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Orders" value={formatNumber(data.summary.orders)} />
            <StatCard label="Revenue" value={formatCurrency(data.summary.revenue)} />
            <StatCard label="Orders change" value={change(data.summary.ordersChangePercent)} hint="vs comparison period" />
            <StatCard label="Revenue change" value={change(data.summary.revenueChangePercent)} hint="vs comparison period" />
          </div>

          <Card className="mb-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Comparison period</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Selected: {formatDateTime(data.window.start)} → {formatDateTime(data.window.end)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Compared with: {formatDateTime(data.comparison.previousStart)} → {formatDateTime(data.comparison.previousEnd)}
            </p>
            <p className="mt-1 text-xs text-gray-400">{data.comparison.basis}</p>
          </Card>
        </>
      )}

      <Card className="mb-4">
        <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-200">Orders &amp; revenue over time</p>
        {chartData ? (
          <BarChart data={chartData} ariaLabel="Growth over time" />
        ) : (
          <p className="py-8 text-center text-sm text-gray-400">No data available for this period</p>
        )}
      </Card>

{series.length === 0 ? (
        <EmptyState
          title="No activity in this window"
          description="Nothing was created in the selected period for these filters. Change the period or clear the filters."
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-500 dark:border-dark-600 dark:text-gray-400">
                  <th className="py-2 pr-3">Bucket</th>
                  <th className="py-2 pr-3">Orders</th>
                  <th className="py-2 pr-3">Delivered</th>
                  <th className="py-2 pr-3">Cancelled</th>
                  <th className="py-2 pr-3">Revenue</th>
                  <th className="py-2 pr-3">Businesses</th>
                  <th className="py-2 pr-3">Shops</th>
                </tr>
              </thead>
              <tbody>
                {series.map((row) => (
                  <tr key={row.bucket} className="border-b border-gray-100 dark:border-dark-700">
                    <td className="py-2 pr-3">{row.bucket}</td>
                    <td className="py-2 pr-3">{row.orders}</td>
                    <td className="py-2 pr-3">{row.delivered}</td>
                    <td className="py-2 pr-3">{row.cancelled}</td>
                    <td className="py-2 pr-3">{formatCurrency(row.revenue)}</td>
                    <td className="py-2 pr-3">{row.businesses}</td>
                    <td className="py-2 pr-3">{row.shops}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data?.note && <p className="mt-3 text-xs text-gray-400">{data.note}</p>}
        </Card>
      )}
    </div>
  );
}