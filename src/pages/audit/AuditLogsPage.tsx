import { useState } from 'react';
import { auditService } from '@/services/audit.service';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { StatCard } from '@/components/common/StatCard';
import { ErrorState } from '@/components/common/ErrorState';
import { PageLoader } from '@/components/common/PageLoader';
import type { AuditLog, AuditLogFilters, AuditLogStats } from '@/types';

const LEVEL_COLORS: Record<string, string> = {
  INFO: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  WARNING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

function formatTimestamp(ts: string) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

function LogDetailModal({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="mx-4 max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Audit Log Detail</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">&times;</button>
        </div>
        <div className="space-y-3 text-sm">
          <Row label="Timestamp" value={formatTimestamp(log.timestamp)} />
          <Row label="Action" value={<span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${LEVEL_COLORS[log.level] || ''}`}>{log.action}</span>} />
          <Row label="Level" value={log.level} />
          <Row label="Admin" value={log.adminName || log.adminId || 'System'} />
          <Row label="Module" value={log.module || '-'} />
          <Row label="Target Entity" value={log.targetEntity || '-'} />
          <Row label="Target ID" value={log.targetId || '-'} />
          {log.reason && <Row label="Reason" value={log.reason} />}
          {log.ipAddress && <Row label="IP Address" value={log.ipAddress} />}
          {log.previousValue && (
            <div>
              <dt className="font-medium text-gray-500 dark:text-gray-400">Previous Value</dt>
              <dd className="mt-1 rounded bg-gray-50 p-2 font-mono text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                {JSON.stringify(log.previousValue, null, 2)}
              </dd>
            </div>
          )}
          {log.newValue && (
            <div>
              <dt className="font-medium text-gray-500 dark:text-gray-400">New Value</dt>
              <dd className="mt-1 rounded bg-gray-50 p-2 font-mono text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                {JSON.stringify(log.newValue, null, 2)}
              </dd>
            </div>
          )}
          {log.details && Object.keys(log.details).length > 0 && (
            <div>
              <dt className="font-medium text-gray-500 dark:text-gray-400">Details</dt>
              <dd className="mt-1 rounded bg-gray-50 p-2 font-mono text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                {JSON.stringify(log.details, null, 2)}
              </dd>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="min-w-[120px] font-medium text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-gray-900 dark:text-gray-100">{value}</dd>
    </div>
  );
}

export function AdminAuditLogsPage() {
  const { t } = useLocalization();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [adminFilter, setAdminFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filterKey = `${page}-${search}-${adminFilter}-${actionFilter}-${moduleFilter}-${startDate}-${endDate}`;

  const logs = useAsync(() => auditService.listLogs({
    page, limit: 20,
    adminId: adminFilter || undefined,
    action: actionFilter || undefined,
    module: moduleFilter || undefined,
    search: search || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  }), [filterKey]);

  const filters = useAsync(() => auditService.getFilters(), []);
  const stats = useAsync(() => auditService.getStats(), []);

  const anyError = logs.error ?? filters.error ?? stats.error;
  const anyLoading = logs.loading && !logs.data;

  if (anyLoading && !anyError) return <PageLoader />;
  if (anyError) return <ErrorState message={anyError} onRetry={logs.refetch} />;

  const logData = logs.data as { logs: AuditLog[]; total: number; totalPages: number } | null;
  const filterData = filters.data as AuditLogFilters | null;
  const statsData = stats.data as AuditLogStats | null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('Audit Logs')}
        description={t('Track all sensitive admin actions across the platform')}
      />

      {/* Stats Cards */}
      {statsData && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label={t('Total Logs')} value={`${statsData.total}`} />
          <StatCard label={t('Today')} value={`${statsData.today}`} />
          <StatCard label={t('Critical (7d)')} value={`${statsData.criticalLast7Days}`} />
          <StatCard label={t('Modules')} value={`${statsData.byModule?.length ?? 0}`} />
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">{t('Search')}</label>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('Search logs...')}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          {filterData && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">{t('Admin')}</label>
                <select
                  value={adminFilter}
                  onChange={(e) => { setAdminFilter(e.target.value); setPage(1); }}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">{t('All Admins')}</option>
                  {filterData.admins.map((a) => (
                    <option key={a.admin_id} value={a.admin_id}>{a.admin_name || a.admin_id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">{t('Module')}</label>
                <select
                  value={moduleFilter}
                  onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">{t('All Modules')}</option>
                  {filterData.modules.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">{t('Action')}</label>
                <select
                  value={actionFilter}
                  onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">{t('All Actions')}</option>
                  {filterData.actions.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">{t('From')}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">{t('To')}</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
      </Card>

      {/* Log Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">{t('Time')}</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">{t('Admin')}</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">{t('Action')}</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">{t('Module')}</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">{t('Target')}</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">{t('Level')}</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400"></th>
              </tr>
            </thead>
            <tbody>
              {(!logData?.logs || logData.logs.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    {t('No audit logs found')}
                  </td>
                </tr>
              )}
              {logData?.logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
                  <td className="whitespace-nowrap px-4 py-2 text-gray-600 dark:text-gray-300">
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                    {log.adminName || log.adminId || 'System'}
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-gray-700 dark:text-gray-200">{log.action}</span>
                  </td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{log.module || '-'}</td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-300">
                    {log.targetEntity ? `${log.targetEntity}` : '-'}
                    {log.targetId && <span className="ml-1 font-mono text-xs text-gray-400">({String(log.targetId).slice(0, 8)}...)</span>}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${LEVEL_COLORS[log.level] || ''}`}>
                      {log.level}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {t('View')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {logData && logData.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {t('Page')} {page} {t('of')} {logData.totalPages} ({logData.total} {t('total')})
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-600"
              >
                {t('Previous')}
              </button>
              <button
                onClick={() => setPage((p) => Math.min(logData.totalPages, p + 1))}
                disabled={page >= logData.totalPages}
                className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-600"
              >
                {t('Next')}
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      {selectedLog && <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
}
