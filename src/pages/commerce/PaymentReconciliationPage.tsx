import { useState } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/hooks/useToast';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { PageLoader } from '@/components/common/PageLoader';
import { SelectField } from '@/components/forms/SelectField';
import { apiErrorMessage } from '@/utils/error';
import {
  paymentReconciliationService,
  type ReconciliationRow,
} from '@/services/paymentReconciliation.admin.service';

const PERIOD_OPTIONS = [
  { value: 'day', label: 'Last 24 hours' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last 30 days' },
];

export function PaymentReconciliationPage() {
  const { t } = useLocalization();
  const { showToast } = useToast();
  const [period, setPeriod] = useState('day');
  const [running, setRunning] = useState(false);

  const { data, loading, error, refetch } = useAsync(
    () => paymentReconciliationService.getReport(period),
    [period]
  );

  const summary = data?.summary ?? { matched: 0, unmatched: 0, discrepancies: 0 };
  const discrepancies = data?.results?.discrepancies ?? [];
  const unmatched = data?.results?.unmatched ?? [];

  const handleReconcile = async () => {
    setRunning(true);
    try {
      await paymentReconciliationService.reconcile('manual', []);
      showToast({ type: 'success', message: t('Reconciliation complete') });
      refetch();
    } catch (err) {
      showToast({
        type: 'error',
        message: apiErrorMessage(err, t('Could not reconcile')),
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={t('Payment Reconciliation')}
        description={t('Match internal payments against provider transactions')}
        actions={
          <div className="flex items-center gap-2">
            <SelectField
              value={period}
              options={PERIOD_OPTIONS}
              onChange={(e) => setPeriod(e.target.value)}
              label={t('Period')}
            />
            <Button
              variant="secondary"
              loading={running}
              onClick={() => void handleReconcile()}
            >
              {t('Run Reconcile')}
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={t('Matched')} value={String(summary.matched)} />
        <StatCard label={t('Unmatched')} value={String(summary.unmatched)} />
        <StatCard
          label={t('Discrepancies')}
          value={String(summary.discrepancies)}
        />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : loading ? (
        <PageLoader />
      ) : (
        <div className="space-y-6">
          <Card>
            <h2 className="card-h2 mb-4 dark:text-white">
              {t('Amount Discrepancies')}
            </h2>
            {discrepancies.length === 0 ? (
              <p className="text-sm text-gray-500">
                {t('No amount discrepancies in this period.')}
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-dark-600">
                    <th className="py-2 text-left font-semibold text-gray-700 dark:text-gray-200">
                      {t('Transaction')}
                    </th>
                    <th className="py-2 text-right font-semibold text-gray-700 dark:text-gray-200">
                      {t('Internal')}
                    </th>
                    <th className="py-2 text-right font-semibold text-gray-700 dark:text-gray-200">
                      {t('Provider')}
                    </th>
                    <th className="py-2 text-right font-semibold text-gray-700 dark:text-gray-200">
                      {t('Difference')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {discrepancies.map((row: ReconciliationRow, idx: number) => (
                    <tr
                      key={String(row.transactionId || idx)}
                      className="border-b border-gray-100 dark:border-dark-700"
                    >
                      <td className="py-3 font-mono text-gray-700 dark:text-gray-200">
                        {row.transactionId || '—'}
                      </td>
                      <td className="py-3 text-right text-gray-700 dark:text-gray-200">
                        {(row.dbAmount ?? 0).toLocaleString()}
                      </td>
                      <td className="py-3 text-right text-gray-700 dark:text-gray-200">
                        {(row.providerAmount ?? 0).toLocaleString()}
                      </td>
                      <td className="py-3 text-right font-medium text-red-600">
                        {(row.difference ?? 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card>
            <h2 className="card-h2 mb-4 dark:text-white">
              {t('Unmatched Transactions')}
            </h2>
            {unmatched.length === 0 ? (
              <p className="text-sm text-gray-500">
                {t('No unmatched transactions in this period.')}
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-dark-700">
                {unmatched.map((row: ReconciliationRow, idx: number) => (
                  <li
                    key={String(row.transactionId || idx)}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span className="font-mono text-gray-700 dark:text-gray-200">
                      {row.transactionId || '—'}
                    </span>
                    <span className="text-gray-500">
                      {row.reason || t('No matching payment')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

export default PaymentReconciliationPage;