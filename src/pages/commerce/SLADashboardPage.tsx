import { useNavigate } from 'react-router-dom';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ErrorState } from '@/components/common/ErrorState';
import { PageLoader } from '@/components/common/PageLoader';
import {
  orderSLAService,
  type OrderSLA,
} from '@/services/orderSLA.admin.service';

/** Hours remaining → a human label + urgency variant. */
function remainingLabel(deadline?: string): { label: string; variant: 'success' | 'warning' | 'danger' } {
  if (!deadline) return { label: '—', variant: 'success' };
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) {
    const hours = Math.floor(Math.abs(ms) / 3_600_000);
    return { label: `Breached by ${hours}h`, variant: 'danger' };
  }
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return { label: 'Due within 1h', variant: 'warning' };
  if (hours < 6) return { label: `${hours}h left`, variant: 'warning' };
  return { label: `${hours}h left`, variant: 'success' };
}

/**
 * SLADashboardPage — breached & at-risk order SLAs.
 *
 * Lists orders whose fulfilment deadlines have been breached or are close to
 * breaching, so operations can intervene before an SLA is missed.
 */
export function SLADashboardPage() {
  const { t } = useLocalization();
  const navigate = useNavigate();

  const { data, loading, error, refetch } = useAsync(
    () => orderSLAService.getBreaches(),
    []
  );

  const breaches = data ?? [];

  return (
    <div>
      <PageHeader
        title={t('SLA Dashboard')}
        description={t('Order fulfilment deadlines at risk or breached')}
      />

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <Card>
          <h2 className="card-h2 mb-4 dark:text-white">
            {t('Breached SLAs')}
          </h2>
          {loading ? (
            <PageLoader />
          ) : breaches.length === 0 ? (
            <p className="text-sm text-gray-500">
              {t('No SLA breaches. All orders are within their deadlines.')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-dark-600">
                    <th className="py-2 text-left font-semibold text-gray-700 dark:text-gray-200">
                      {t('Order')}
                    </th>
                    <th className="py-2 text-left font-semibold text-gray-700 dark:text-gray-200">
                      {t('State')}
                    </th>
                    <th className="py-2 text-left font-semibold text-gray-700 dark:text-gray-200">
                      {t('Deadline')}
                    </th>
                    <th className="py-2 text-right font-semibold text-gray-700 dark:text-gray-200">
                      {t('Status')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {breaches.map((sla: OrderSLA) => {
                    const rem = remainingLabel(sla.deadline);
                    return (
                      <tr
                        key={sla._id}
                        className="border-b border-gray-100 dark:border-dark-700"
                      >
                        <td className="py-3">
                          <button
                            type="button"
                            onClick={() => navigate(`/orders/${sla.orderId}`)}
                            className="font-mono text-sm text-primary-dark hover:underline"
                          >
                            #{String(sla.orderId).slice(-8)}
                          </button>
                        </td>
                        <td className="py-3 text-gray-700 dark:text-gray-200">
                          {sla.stateName || '—'}
                        </td>
                        <td className="py-3 text-gray-700 dark:text-gray-200">
                          {sla.deadline
                            ? new Date(sla.deadline).toLocaleString()
                            : '—'}
                        </td>
                        <td className="py-3 text-right">
                          <StatusBadge
                            label={rem.label}
                            variant={rem.variant}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export default SLADashboardPage;