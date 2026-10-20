import { useState } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import {
  paymentLedgerAdminService,
  type PaymentLedgerEntry,
} from '@/services/paymentLedger.admin.service';

export function PaymentLedgerPage() {
  const { t } = useLocalization();
  const [paymentId, setPaymentId] = useState('');
  const [view, setView] = useState<'stats' | 'failed' | 'audit'>('stats');

  const { data: stats } = useAsync(
    () => paymentLedgerAdminService.getLedgerStats(),
    []
  );
  const { data: failed } = useAsync(
    () => paymentLedgerAdminService.getFailedPayments(),
    []
  );
  const { data: audit } = useAsync(
    async () => (paymentId ? paymentLedgerAdminService.auditPayment(paymentId) : null),
    [paymentId]
  );

  return (
    <div>
      <PageHeader
        title={t('Payment Ledger')}
        description={t('Audit platform payment movements and failures')}
      />
      {/* will continue in next chunk */}
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <StatCard label={t('Total Payments')} value={String(stats?.totalPayments ?? 0)} />
          <StatCard label={t('Total Volume')} value={Number(stats?.totalVolume ?? 0).toLocaleString()} hint="ETB" />
          <StatCard label={t('Completed')} value={String(stats?.completedCount ?? 0)} hint={t('payments')} />
          <StatCard label={t('Failed')} value={String(stats?.failedCount ?? 0)} hint={t('payments')} />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              {t('Payment ID for audit')}
            </label>
            <input
              type="text"
              value={paymentId}
              onChange={(e) => setPaymentId(e.target.value)}
              placeholder={t('e.g. pay_123')}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-dark dark:border-dark-600 dark:bg-dark-900 dark:text-white"
            />
          </div>
          <div className="flex-1">
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setView('stats')}>
                {t('Stats')}
              </Button>
              <Button variant="secondary" onClick={() => setView('failed')}>
                {t('Failed Payments')}
              </Button>
              <Button variant="secondary" disabled={!paymentId} onClick={() => setView('audit')}>
                {t('Audit Payment')}
              </Button>
            </div>
          </div>
        </div>

        {view === 'audit' && paymentId ? (
          <Card>
            <h2 className="card-h2 mb-4 dark:text-white">{t('Payment Audit Trail')}</h2>
            {audit?.entries?.length === 0 ? (
              <p className="text-sm text-gray-500">{t('No audit entries for this payment.')}</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-dark-700">
                {audit!.entries.map((row: PaymentLedgerEntry, idx: number) => (
                  <li key={idx} className="flex justify-between py-2 text-sm">
                    <span className="text-gray-700 dark:text-gray-200">
                      {row.type || '—'} {row.amount ? Number(row.amount).toLocaleString() : ''}
                    </span>
                    <span className="text-right text-gray-500">
                      {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ) : view === 'failed' ? (
          <Card>
            <h2 className="card-h2 mb-4 dark:text-white">{t('Failed Payments')}</h2>
            {failed!.length === 0 ? (
              <p className="text-sm text-gray-500">{t('No failed payments.')}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-dark-600">
                    <th className="py-2 text-left font-semibold text-gray-700 dark:text-gray-200">{t('Payment ID')}</th>
                    <th className="py-2 text-right font-semibold text-gray-700 dark:text-gray-200">{t('Amount')}</th>
                    <th className="py-2 text-left font-semibold text-gray-700 dark:text-gray-200">{t('Order')}</th>
                    <th className="py-2 text-left font-semibold text-gray-700 dark:text-gray-200">{t('Created')}</th>
                  </tr>
                </thead>
                <tbody>
                  {failed!.map((row: PaymentLedgerEntry, idx: number) => (
                    <tr key={idx} className="border-b border-gray-100 dark:border-dark-700">
                      <td className="py-3 font-mono text-gray-700 dark:text-gray-200">{row.id || row._id || '—'}</td>
                      <td className="py-3 text-right text-gray-700 dark:text-gray-200">{Number(row.amount || 0).toLocaleString()}</td>
                      <td className="py-3 text-gray-700 dark:text-gray-200">{row.orderId || '—'}</td>
                      <td className="py-3 text-gray-500">{row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        ) : (
          <Card>
            <h2 className="card-h2 mb-4 dark:text-white">{t('Ledger Summary')}</h2>
            <p className="text-sm text-gray-500">
              {t('Aggregate payment ledger statistics across all sellers.')}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

export default PaymentLedgerPage;