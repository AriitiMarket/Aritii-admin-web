import { useState, useEffect } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { ErrorState } from '@/components/common/ErrorState';
import { PageLoader } from '@/components/common/PageLoader';
import { Button } from '@/components/common/Button';
import { http } from '@/services/client/httpClient';
import { formatNumber } from '@/utils/format';

interface DeliveryStats {
  totalRiders?: number;
  activeRiders?: number;
  offlineRiders?: number;
  activeDeliveries?: number;
  pendingAssignments?: number;
  completedDeliveries?: number;
  failedDeliveries?: number;
  cancelledDeliveries?: number;
  activeZones?: number;
  totalZones?: number;
  activeServices?: number;
  totalServices?: number;
  pendingDeliveries?: number;
  assignedDeliveries?: number;
  inTransitDeliveries?: number;
  availableActors?: number;
  busyActors?: number;
  totalActors?: number;
  activeRoutes?: number;
  totalRoutes?: number;
}

export function DeliveryDashboardPage() {
  const { t } = useLocalization();
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const { data: stats, loading, error, refetch } = useAsync(
    async () => {
      try {
        const res = await http.get<{ success: boolean; dashboard: DeliveryStats }>(
          '/delivery/operation/dashboard'
        );
        return res.dashboard || {};
      } catch (err) {
        console.error('Failed to fetch delivery stats:', err);
        throw err;
      }
    },
    []
  );

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      refetch();
      setLastUpdated(new Date().toLocaleTimeString());
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  const handleRefresh = () => {
    refetch();
    setLastUpdated(new Date().toLocaleTimeString());
  };

  const handleToggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    setLastUpdated(new Date().toLocaleTimeString());
  };

  if (loading && !stats) return <PageLoader label={t('Loading')} />;

  return (
    <div>
      <PageHeader
        title={t('Delivery Overview')}
        description={t('Real-time delivery operations monitoring')}
        actions={
          <div className="flex gap-2">
            <Button
              variant={autoRefresh ? 'primary' : 'outline'}
              onClick={handleToggleAutoRefresh}
              size="sm"
            >
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </Button>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              {t('Refresh')}
            </Button>
          </div>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          {lastUpdated && (
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Last updated: {lastUpdated}
            </p>
          )}

          {/* Riders Section */}
          <div className="mb-6">
            <h3 className="mb-3 text-lg font-semibold dark:text-white">
              Riders & Delivery Actors
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="flex flex-col items-center gap-2 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Riders</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatNumber(stats?.totalActors ?? 0)}
                </p>
              </Card>
              <Card className="flex flex-col items-center gap-2 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Available</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatNumber(stats?.availableActors ?? 0)}
                </p>
              </Card>
              <Card className="flex flex-col items-center gap-2 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Busy</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {formatNumber(stats?.busyActors ?? 0)}
                </p>
              </Card>
              <Card className="flex flex-col items-center gap-2 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Offline</p>
                <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {formatNumber(
                    (stats?.totalActors ?? 0) -
                      (stats?.availableActors ?? 0) -
                      (stats?.busyActors ?? 0)
                  )}
                </p>
              </Card>
            </div>
          </div>

          {/* Active Deliveries Section */}
          <div className="mb-6">
            <h3 className="mb-3 text-lg font-semibold dark:text-white">
              Active Operations
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="flex flex-col items-center gap-2 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pending Assignments
                </p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatNumber(stats?.pendingAssignments ?? 0)}
                </p>
              </Card>
              <Card className="flex flex-col items-center gap-2 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Assigned</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatNumber(stats?.assignedDeliveries ?? 0)}
                </p>
              </Card>
              <Card className="flex flex-col items-center gap-2 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">In Transit</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {formatNumber(stats?.inTransitDeliveries ?? 0)}
                </p>
              </Card>
              <Card className="flex flex-col items-center gap-2 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Total</p>
                <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                  {formatNumber(stats?.activeDeliveries ?? 0)}
                </p>
              </Card>
            </div>
          </div>

          {/* Delivery Completion Section */}
          <div className="mb-6">
            <h3 className="mb-3 text-lg font-semibold dark:text-white">
              Delivery Results
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="flex flex-col items-center gap-2 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatNumber(stats?.completedDeliveries ?? 0)}
                </p>
              </Card>
              <Card className="flex flex-col items-center gap-2 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatNumber(stats?.failedDeliveries ?? 0)}
                </p>
              </Card>
              <Card className="flex flex-col items-center gap-2 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Cancelled</p>
                <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {formatNumber(stats?.cancelledDeliveries ?? 0)}
                </p>
              </Card>
              <Card className="flex flex-col items-center gap-2 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {formatNumber(stats?.pendingDeliveries ?? 0)}
                </p>
              </Card>
            </div>
          </div>

          {/* Coverage & Infrastructure Section */}
          <div className="mb-6">
            <h3 className="mb-3 text-lg font-semibold dark:text-white">
              Infrastructure & Coverage
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="flex flex-col items-center gap-2 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Zones</p>
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  {formatNumber(stats?.activeZones ?? 0)}/{formatNumber(stats?.totalZones ?? 0)}
                </p>
              </Card>
              <Card className="flex flex-col items-center gap-2 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Active Services
                </p>
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  {formatNumber(stats?.activeServices ?? 0)}/{formatNumber(stats?.totalServices ?? 0)}
                </p>
              </Card>
              <Card className="flex flex-col items-center gap-2 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Routes</p>
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  {formatNumber(stats?.activeRoutes ?? 0)}/{formatNumber(stats?.totalRoutes ?? 0)}
                </p>
              </Card>
              <Card className="flex flex-col items-center gap-2 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Coverage</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {stats?.activeZones && stats?.totalZones
                    ? Math.round(
                        ((stats.activeZones / stats.totalZones) * 100)
                      )
                    : 0}
                  %
                </p>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
