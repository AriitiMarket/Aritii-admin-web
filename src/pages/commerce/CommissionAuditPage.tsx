import { useState } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import {
  commissionLedgerAdminService,
  type CommissionEntry,
} from '@/services/commissionLedger.admin.service';

export function CommissionAuditPage() {
  const { t } = useLocalization();
  const [sellerId, setSellerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [view, setView] = useState<'history' | 'audit' | 'byReason'>('history');

  const params = {
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
    limit: 100,
    offset: 0,
  };

  const { data: history } = useAsync(
    () => sellerId ? commissionLedgerAdminService.getCommissionHistory(sellerId, params) : Promise.resolve(null),
    [sellerId, startDate, endDate]
  );
  const { data: totals } = useAsync(
    () => sellerId ? commissionLedgerAdminService.getTotalCommissionForPeriod(sellerId, { startDate, endDate }) : Promise.resolve(null),
    [sellerId, startDate, endDate]
  );
  const { data: audit } = useAsync(
    () => sellerId ? commissionLedgerAdminService.auditCommissions(sellerId, { startDate, endDate }) : Promise.resolve(null),
    [sellerId, startDate, endDate]
  );
  const { data: byReason } = useAsync(
    () => sellerId ? commissionLedgerAdminService.getCommissionByReason(sellerId) : Promise.resolve(null),
    [sellerId]
  );

  const entries = view === 'audit' ? (audit?.entries ?? []) : (history?.history ?? []);
  const totalCommission = view === 'audit' ? audit?.totals?.totalCommission ?? 0 : totals?.totalCommission ?? 0;
  const totalOrders = view === 'audit' ? audit?.totals?.totalOrders ?? 0 : totals?.totalOrders ?? 0;

  return (
    <div>
      <PageHeader
        title={t('Commission Audit')}
        description={t('Audit platform commission movements per seller')}
      />
      {/* will continue in next chunk */}
      <div className="space-y-6">
        <Card>
          <h2 className="card-h2 mb-4 dark:text-white">{t('Seller Selection')}</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                {t('Seller ID')}
              </label>
              <input
                type="text"
                value={sellerId}
                onChange={(e) => setSellerId(e.target.value)}
                placeholder={t('e.g. sel_123')}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-dark dark:border-dark-600 dark:bg-dark-900 dark:text-white"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                {t('From Date')}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-dark dark:border-dark-600 dark:bg-dark-900 dark:text-white"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                {t('To Date')}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-dark dark:border-dark-600 dark:bg-dark-900 dark:text-white"
              />
            </div>
            <div className="flex-1">
              <div className="flex gap-2">
                <Button variant="secondary" disabled={!sellerId} onClick={() => setView('history')}>
                  {t('History')}
                </Button>
                <Button variant="secondary" disabled={!sellerId} onClick={() => setView('audit')}>
                  {t('Full Audit')}
                </Button>
                <Button variant="secondary" disabled={!sellerId} onClick={() => setView('byReason')}>
                  {t('By Reason')}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label={t('Total Commission')} value={totalCommission.toLocaleString()} hint="ETB" />
          <StatCard label={t('Orders')} value={String(totalOrders)} />
          <StatCard label={t('Entries')} value={String(entries.length)} />
        </div>

        {sellerId && (
          <Card>
            <h2 className="card-h2 mb-4 dark:text-white">
              {view === 'history' ? t('Commission History') : view === 'audit' ? t('Commission Audit Trail') : t('Commission by Reason')}
            </h2>
            {entries.length === 0 ? (
              <p className="text-sm text-gray-500">{t('No commission entries found.')}</p>
            ) : view === 'byReason' ? (
              <ul className="divide-y divide-gray-100 dark:divide-dark-700">
                {byReason?.breakdown?.map((row) => (
                  <li key={row.reason || 'x'} className="flex justify-between py-2 text-sm">
                    <span className="text-gray-700 dark:text-gray-200">{row.reason}</span>
                    <span className="font-mono text-right">{row.commission.toLocaleString()} ETB</span>
                    <span className="text-right text-gray-500">{row.count}x</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-dark-600">
                      <th className="py-2 text-left font-semibold text-gray-700 dark:text-gray-200">{t('Order')}</th>
                      <th className="py-2 text-right font-semibold text-gray-700 dark:text-gray-200">{t('Gross')}</th>
                      <th className="py-2 text-right font-semibold text-gray-700 dark:text-gray-200">{t('Commission')}</th>
                      <th className="py-2 text-right font-semibold text-gray-700 dark:text-gray-200">{t('Net Payable')}</th>
                      <th className="py-2 text-left font-semibold text-gray-700 dark:text-gray-200">{t('Reason')}</th>
                      <th className="py-2 text-left font-semibold text-gray-700 dark:text-gray-200">{t('Created')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((row: CommissionEntry, idx: number) => (
                      <tr key={row._id || row.id || idx} className="border-b border-gray-100 dark:border-dark-700">
                        <td className="py-3 font-mono text-gray-700 dark:text-gray-200">{row.orderId || '—'}</td>
                        <td className="py-3 text-right text-gray-700 dark:text-gray-200">{Number(row.grossSubtotal || 0).toLocaleString()}</td>
                        <td className="py-3 text-right text-gray-700 dark:text-gray-200 font-medium">{Number(row.platformCommission || 0).toLocaleString()}</td>
                        <td className="py-3 text-right text-gray-700 dark:text-gray-200">{Number(row.netPayable || 0).toLocaleString()}</td>
                        <td className="py-3 text-gray-500">{row.reason || '—'}</td>
                        <td className="py-3 text-gray-500">{row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

export default CommissionAuditPage;