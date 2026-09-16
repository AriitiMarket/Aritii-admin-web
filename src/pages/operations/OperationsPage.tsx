/**
 * Live Operations — orders grouped by the REAL operational stage.
 *
 * Stages come from the backend mapping (commerce order status + delivery
 * status); the console never invents a stage the platform cannot evidence
 * (see `unsupportedStages`, which is surfaced to the admin explicitly).
 *
 * Refreshes in place (no full-page reload) on an interval, so the view behaves
 * like a live operations board without requiring new realtime infrastructure.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  platformAdminService,
  type AdminOrder,
  type OperationsOverview,
} from '@/services/platformAdmin.service';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Pagination } from '@/components/common/Pagination';
import { ErrorState } from '@/components/common/ErrorState';
import { PageLoader } from '@/components/common/PageLoader';
import { EmptyState } from '@/components/common/EmptyState';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { formatCurrency, formatDateTime } from '@/utils/format';

const REFRESH_MS = 15000;

export function OperationsPage() {
  const [params, setParams] = useSearchParams();
  const stage = params.get('stage') || '';
  const page = Number(params.get('page') || '1');

  const [overview, setOverview] = useState<OperationsOverview | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const stageRef = useRef(stage);
  stageRef.current = stage;

  const loadOverview = useCallback(async () => {
    try {
      const data = await platformAdminService.getOperations();
      setOverview(data);
      setLastUpdated(new Date().toISOString());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load operations');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    if (!stageRef.current) {
      setOrders([]);
      setTotal(0);
      setTotalPages(0);
      return;
    }
    setListLoading(true);
    try {
      const data = await platformAdminService.getOrdersByStage(stageRef.current, {
        page,
        limit: 20,
        paymentStatus: paymentStatus || undefined,
        from: from || undefined,
        to: to || undefined,
      });
      setOrders(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setListLoading(false);
    }
  }, [page, paymentStatus, from, to]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  // In-place refresh — never a full page reload.
  useEffect(() => {
    if (!autoRefresh) return undefined;
    const id = window.setInterval(() => {
      void loadOverview();
      void loadOrders();
    }, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [autoRefresh, loadOverview, loadOrders]);

  const selectStage = (next: string) => {
    const updated = new URLSearchParams(params);
    if (next) updated.set('stage', next);
    else updated.delete('stage');
    updated.set('page', '1');
    setParams(updated);
  };

  const columns: Column<AdminOrder>[] = [
    {
      key: 'id',
      header: 'Order',
      render: (row) => (
        <Link className="font-medium text-primary-dark hover:underline" to={`/orders/${row.id}`}>
          {row.id.slice(-8)}
        </Link>
      ),
    },
    { key: 'customer', header: 'Customer', accessor: (row) => row.customerRef || '—' },
    { key: 'amount', header: 'Amount', render: (row) => formatCurrency(row.totalPrice) },
    { key: 'stage', header: 'Stage', render: (row) => <StatusBadge label={row.stageLabel} /> },
    { key: 'orderStatus', header: 'Order status', render: (row) => <StatusBadge label={row.status} /> },
    { key: 'payment', header: 'Payment', render: (row) => <StatusBadge label={row.paymentStatus} /> },
    {
      key: 'delivery',
      header: 'Delivery',
      render: (row) =>
        row.deliveryStatus ? (
          <StatusBadge label={row.deliveryStatus} />
        ) : (
          <span className="text-gray-400">not assigned</span>
        ),
    },
    { key: 'pickup', header: 'Picked up', accessor: (row) => (row.pickedUpAt ? formatDateTime(row.pickedUpAt) : '—') },
    { key: 'createdAt', header: 'Created', accessor: (row) => formatDateTime(row.createdAt) },
  ];

if (loading) return <PageLoader label="Loading operations…" />;
  if (error && !overview) return <ErrorState message={error} onRetry={loadOverview} />;

  const selected = overview && Array.isArray(overview.stages)
    ? overview.stages.find((entry) => entry.stage === stage) || null
    : null;

  return (
    <div>
      <PageHeader
        title="Operations"
        description="Live order activity grouped by the platform's real operational stages"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={autoRefresh ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setAutoRefresh((value) => !value)}
            >
              {autoRefresh ? 'Auto-refresh on' : 'Auto-refresh off'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void loadOverview();
                void loadOrders();
              }}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {lastUpdated && (
        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
          Last updated {formatDateTime(lastUpdated)}
        </p>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {(Array.isArray(overview?.stages) ? overview.stages : []).map((entry) => {
          const isActive = entry.stage === stage;
          return (
            <button
              key={entry.stage}
              type="button"
              onClick={() => selectStage(isActive ? '' : entry.stage)}
              aria-pressed={isActive}
              className={`rounded-lg border p-3 text-left transition ${
                isActive
                  ? 'border-primary-dark bg-primary-dark/5'
                  : 'border-gray-200 hover:border-primary-dark/60 dark:border-dark-600'
              }`}
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">{entry.label}</p>
              <p className="mt-1 text-xl font-semibold text-gray-800 dark:text-gray-100">
                {entry.count === null ? '—' : entry.count}
              </p>
            </button>
          );
        })}
      </div>

      {overview && Array.isArray(overview.unsupportedStages) && overview.unsupportedStages.length > 0 && (
        <Card className="mb-5">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Stages not tracked by the platform
          </p>
          <ul className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
            {overview.unsupportedStages.map((entry) => (
              <li key={entry.stage}>
                <span className="font-medium">{entry.stage}</span> — {entry.reason}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Payment status</span>
            <select
              className="h-10 rounded border border-gray-300 bg-white px-2 text-sm dark:border-dark-600 dark:bg-dark-900"
              value={paymentStatus}
              onChange={(event) => setPaymentStatus(event.target.value)}
            >
              <option value="">All</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">From</span>
            <input
              type="date"
              className="h-10 rounded border border-gray-300 bg-white px-2 text-sm dark:border-dark-600 dark:bg-dark-900"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">To</span>
            <input
              type="date"
              className="h-10 rounded border border-gray-300 bg-white px-2 text-sm dark:border-dark-600 dark:bg-dark-900"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </label>
          {stage && (
            <Button variant="ghost" size="sm" onClick={() => selectStage('')}>
              Clear stage filter
            </Button>
          )}
        </div>
      </Card>

      <Card>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        {!stage ? (
          <EmptyState
            title="Select a stage"
            description="Pick any operational stage above to list the real orders currently in it."
          />
        ) : (
          <>
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">{selected?.label || stage}</span> · {total} order(s)
            </p>
            <DataTable
              columns={columns}
              rows={orders}
              rowKey={(row) => row.id}
              loading={listLoading}
              emptyTitle="No orders in this stage"
              emptyDescription="Nothing is currently at this point of the journey."
            />
            {totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                onPageChange={(next) => {
                  const updated = new URLSearchParams(params);
                  updated.set('page', String(next));
                  setParams(updated);
                }}
              />
            )}
          </>
        )}
      </Card>
    </div>
  );
}