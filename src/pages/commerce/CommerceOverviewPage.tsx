import { useState, useEffect } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { PageLoader } from '@/components/common/PageLoader';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/common/Button';
import { analyticsService } from '@/services/analytics.service';

export function CommerceDashboardPage() {
  const { t } = useLocalization();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { data: stats, loading, error, refetch } = useAsync(
    async () => {
      try {
        const result = await analyticsService.getStats();
        setLastUpdated(new Date());
        return result;
      } catch (err) {
        throw new Error('Failed to load commerce statistics');
      }
    },
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

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('Users')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label={t('Total Users')} value={String(stats.totalUsers || 0)} />
          <StatCard label={t('Sellers')} value={String(stats.totalSellers || 0)} />
          <StatCard label={t('Stores')} value={String(stats.totalStores || 0)} />
          <StatCard label={t('Riders')} value={String(stats.totalRiders || 0)} />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('Orders')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label={t('Total Orders')} value={String(stats.totalOrders || 0)} />
          <StatCard label={t('Delivered')} value={String(stats.deliveredOrders || 0)} />
          <StatCard label={t('Revenue')} value={`${(stats.totalRevenue || 0).toLocaleString()} ETB`} />
        </div>
      </div>
    </div>
  );
}
