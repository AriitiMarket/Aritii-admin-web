import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { SelectField } from '@/components/forms/SelectField';
import { ErrorState } from '@/components/common/ErrorState';
import { PageLoader } from '@/components/common/PageLoader';
import { useAsync } from '@/hooks/useAsync';
import { analyticsService } from '@/services/analytics.service';

function dateRange(days: string): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - Number(days) + 1);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export function ShopsAnalyticsPage() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('30');
  const range = useMemo(() => dateRange(timeRange), [timeRange]);
  const stats = useAsync(
    () => analyticsService.getShopStats(range.startDate, range.endDate),
    [range.startDate, range.endDate]
  );

  const StatCard = ({ label, value }: { label: string; value: string | number }) => (
    <Card className="text-center">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{label}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
    </Card>
  );

  if (stats.loading) return <PageLoader label={t('Loading')} />;
  if (stats.error) return <ErrorState message={stats.error} onRetry={stats.refetch} />;

  const shopStats = stats.data;

  return (
    <div>
      <PageHeader
        title={t('Shops Analytics')}
        description={t('View shop metrics and performance by location and sector')}
        actions={
          <div className="flex gap-2">
            <SelectField
              value={timeRange}
              options={[
                { value: '7', label: 'Last 7 days' },
                { value: '30', label: 'Last 30 days' },
                { value: '90', label: 'Last 90 days' },
                { value: '365', label: 'Last year' },
              ]}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-40"
            />
            <Button onClick={() => navigate('/stores')} variant="outline">
              {t('Back')}
            </Button>
          </div>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
        <StatCard label="Total Shops" value={shopStats?.total.toLocaleString() ?? '—'} />
        <StatCard label="New Shops" value={shopStats?.newShops.toLocaleString() ?? '—'} />
        <StatCard label="Approved" value={shopStats?.approved.toLocaleString() ?? '—'} />
        <StatCard label="Pending Approval" value={shopStats?.pending.toLocaleString() ?? '—'} />
      </div>

      <Card>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('These figures come from the verified aggregate shop-statistics consumer. Location, sector, GMV, rating, and top-shop breakdowns are not displayed because no matching DTO was verified.')}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Suspended" value={shopStats?.suspended.toLocaleString() ?? '—'} />
          <StatCard label="Inactive" value={shopStats?.inactive.toLocaleString() ?? '—'} />
        </div>
      </Card>
    </div>
  );
}
