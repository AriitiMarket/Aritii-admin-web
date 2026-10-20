import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/hooks/useToast';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ErrorState } from '@/components/common/ErrorState';
import { PageLoader } from '@/components/common/PageLoader';
import { apiErrorMessage } from '@/utils/error';
import { orderPriorityService } from '@/services/orderPriority.admin.service';
import type { PriorityLevel } from '@/services/orderPriority.admin.service';
export type {
  PriorityLevel,
} from '@/services/orderPriority.admin.service';

/**
 * PriorityQueuePage — VIP / urgent order queue.
 *
 * Shows the priority counts as stat tiles and lists the VIP & urgent orders
 * so operators can triage the most important fulfilment work first. A priority
 * can be cleared inline.
 */
export function PriorityQueuePage() {
  const { t } = useLocalization();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: stats } = useAsync(
    () => orderPriorityService.getPriorityStats(),
    []
  );
  const { data, loading, error, refetch } = useAsync(
    () => orderPriorityService.getVIPOrders(),
    []
  );

  const orders = data ?? [];

  const priorityVariant = (p?: PriorityLevel) => {
    switch (p) {
      case 'URGENT':
        return 'danger' as const;
      case 'VIP':
        return 'warning' as const;
      case 'HIGH':
        return 'info' as const;
      default:
        return 'neutral' as const;
    }
  };

  const handleReset = async (orderId: string) => {
    setBusyId(orderId);
    try {
      await orderPriorityService.resetPriority(orderId);
      showToast({ type: 'success', message: t('Priority cleared') });
      refetch();
    } catch (err) {
      showToast({
        type: 'error',
        message: apiErrorMessage(err, t('Could not clear priority')),
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title={t('Priority Queue')}
        description={t('VIP and urgent orders requiring priority fulfilment')}
      />

      {/* Priority counts */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label={t('Urgent')}
          value={String(stats?.URGENT ?? 0)}
        />
        <StatCard label={t('VIP')} value={String(stats?.VIP ?? 0)} />
        <StatCard label={t('High')} value={String(stats?.HIGH ?? 0)} />
        <StatCard label={t('Normal')} value={String(stats?.NORMAL ?? 0)} />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <Card>
          <h2 className="card-h2 mb-4 dark:text-white">
            {t('VIP & Urgent Orders')}
          </h2>
          {loading ? (
            <PageLoader />
          ) : orders.length === 0 ? (
            <p className="text-sm text-gray-500">
              {t('No VIP or urgent orders right now.')}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-dark-700">
              {orders.map((row) => (
                <li
                  key={row._id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/orders/${row.orderId}`)}
                    className="text-left"
                  >
                    <span className="font-mono text-sm text-primary-dark hover:underline">
                      #{String(row.orderId).slice(-8)}
                    </span>
                    {row.reason && (
                      <p className="text-xs text-gray-500">{row.reason}</p>
                    )}
                  </button>
                  <div className="flex items-center gap-3">
                    <StatusBadge
                      label={row.priority}
                      variant={priorityVariant(row.priority)}
                    />
                    {row.markedAt && (
                      <span className="text-xs text-gray-400">
                        {new Date(row.markedAt).toLocaleString()}
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={busyId === row.orderId}
                      onClick={() => void handleReset(row.orderId)}
                    >
                      {t('Clear')}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}

export default PriorityQueuePage;