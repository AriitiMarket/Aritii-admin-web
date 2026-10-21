import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ErrorState } from '@/components/common/ErrorState';
import { PageLoader } from '@/components/common/PageLoader';
import { Button } from '@/components/common/Button';
import { TextField } from '@/components/forms/TextField';
import { Modal } from '@/components/common/Modal';
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
 *
 * A breach is either DETECTED (the deadline passed on its own) or PUSHED IN by
 * an operator (an upheld dispute, a mis-declared deadline) — the console can
 * do the latter, which is why the table shows the recorded reason.
 */
export function SLADashboardPage() {
  const { t } = useLocalization();
  const navigate = useNavigate();

  const { data, loading, error, refetch } = useAsync(
    () => orderSLAService.getBreaches(),
    []
  );

  const breaches = data ?? [];

  // "Push in a breach" — the order id is typed by the operator because the
  // breach is recorded against an order that is not in the list yet.
  const [pushOpen, setPushOpen] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resetPush = () => {
    setOrderId('');
    setReason('');
    setSubmitError(null);
    setPushOpen(false);
  };

  const submitBreach = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await orderSLAService.createBreach(orderId.trim(), reason.trim());
      resetPush();
      refetch();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to record the breach'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={t('SLA Dashboard')}
        description={t('Order fulfilment deadlines at risk or breached')}
      />

      <div className="mb-4 flex justify-end">
        <Button variant="danger" size="sm" onClick={() => setPushOpen(true)}>
          {t('Push in a breach')}
        </Button>
      </div>

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
                    <th className="py-2 text-left font-semibold text-gray-700 dark:text-gray-200">
                      {t('Reason')}
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
                        <td className="py-3 text-gray-700 dark:text-gray-200">
                          {sla.breachReason || '—'}
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

      <Modal
        open={pushOpen}
        onClose={resetPush}
        title={t('Push in a breach')}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t(
              'Record a missed service level against an order. The breach shows up on this dashboard with your reason attached.'
            )}
          </p>
          <TextField
            label={t('Order ID')}
            required
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Order id"
            disabled={submitting}
          />
          <TextField
            label={t('Reason')}
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('Why was the service level missed?')}
            disabled={submitting}
          />
          {submitError && (
            <p className="text-sm text-red-600">{submitError}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={resetPush} disabled={submitting}>
              {t('Cancel')}
            </Button>
            <Button
              variant="danger"
              loading={submitting}
              disabled={!orderId.trim() || !reason.trim()}
              onClick={submitBreach}
            >
              {t('Record breach')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default SLADashboardPage;