/**
 * Overview — the body of the Delivery & Logistics control centre.
 *
 * Monitoring and navigation ONLY. There is deliberately no status editing, no
 * inline management and no second copy of the delivery tables: every number and
 * every row here leads to the page that owns the work (Requests, Deliveries,
 * Assignments, Operations, Tracking, Partners).
 *
 * Counts come from `GET /delivery/operation/dashboard` and the recent rows from
 * `GET /delivery/delivery`. Every status shown is the canonical backend value
 * rendered through `DeliveryStatusPill`, so it reads identically here and on the
 * Deliveries, Tracking and Operations pages.
 */
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faListCheck,
  faMap,
  faMotorcycle,
  faTruck,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { deliveryRequestsService } from '@/services/deliveryRequests.service';
import { formatDateTime, formatNumber, timeAgo } from '@/utils/format';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import type { AdminRole } from '@/types/auth';
import { useDeliveryStats } from '../hooks/useDeliveryStats';
import { useRecentDeliveries } from '../hooks/useRecentDeliveries';
import { DeliveryStatusPill } from '../components/DeliveryStatusPill';
import { BLOCKED_DELIVERY_STATUSES, DELIVERY_STATUSES } from '../constants';
import type { RecentDelivery } from '../types';

interface OverviewTabProps {
  /** Bumped by the page's Refresh / auto-refresh so the dashboard re-pulls. */
  refreshKey?: number;
}

/**
 * "Active" = any canonical status that is not blocked (the service's
 * READY + IN_PROGRESS groupings). Derived from `DELIVERY_STATUSES` and the
 * module's ONE blocked set, so the Recent table can neither show a status this
 * console does not know nor disagree with the Tracking page about which
 * deliveries are finished.
 */
const ACTIVE_DELIVERY_STATUSES = new Set<string>(
  DELIVERY_STATUSES.map((s) => s.value)
    .filter(Boolean)
    .filter((value) => !BLOCKED_DELIVERY_STATUSES.includes(value))
);

/** How many delivery requests to scan when counting ones not yet handed over. */
const REQUEST_SCAN_LIMIT = 200;

const shortId = (id: string) => (id && id.length > 10 ? `${id.slice(0, 8)}…` : id || '—');

/** A count that opens the list behind it — no orphan stats on this page. */
function MetricTile({
  label,
  value,
  tone,
  to,
}: {
  label: string;
  value: number | undefined;
  tone: string;
  to: string;
}) {
  const navigate = useNavigate();
  return (
    <Card className="p-4">
      <button
        type="button"
        onClick={() => navigate(to)}
        title={`Open ${label}`}
        className="flex w-full flex-col gap-1 rounded-md text-left outline-none transition hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-primary-dark dark:hover:bg-dark-800"
      >
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {label}
        </span>
        <span className={`text-2xl font-bold ${tone}`}>{formatNumber(value ?? 0)}</span>
      </button>
    </Card>
  );
}

/** One "needs attention" item: what is wrong, how many, and where to fix it. */
function AttentionRow({
  label,
  hint,
  value,
  to,
}: {
  label: string;
  hint: string;
  value: string;
  to: string;
}) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="flex w-full items-center justify-between gap-4 rounded-md border border-gray-200 px-4 py-3 text-left transition hover:border-primary-dark hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark dark:border-dark-600 dark:hover:bg-dark-800"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-gray-800 dark:text-gray-100">{label}</span>
        <span className="block text-xs text-gray-500 dark:text-gray-400">{hint}</span>
      </span>
      <span className="shrink-0 text-lg font-bold text-gray-800 dark:text-gray-100">{value}</span>
    </button>
  );
}

/** Shortcut to the page that owns a slice of the work. */
function QuickNavCard({
  icon,
  label,
  hint,
  to,
}: {
  icon: IconDefinition;
  label: string;
  hint: string;
  to: string;
}) {
  const navigate = useNavigate();
  return (
    <Card className="p-4">
      <button
        type="button"
        onClick={() => navigate(to)}
        className="flex w-full items-start gap-3 rounded-md text-left outline-none transition hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-primary-dark dark:hover:bg-dark-800"
      >
        <span className="rounded-md bg-gray-100 p-2 text-gray-700 dark:bg-dark-800 dark:text-gray-300">
          <FontAwesomeIcon icon={icon} />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-gray-800 dark:text-gray-100">{label}</span>
          <span className="block text-xs text-gray-500 dark:text-gray-400">{hint}</span>
        </span>
      </button>
    </Card>
  );
}

export function OverviewTab({ refreshKey = 0 }: OverviewTabProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { stats, error: statsError, refetch: refetchStats } = useDeliveryStats({}, refreshKey);

  const {
    recentDeliveries,
    loading: recentLoading,
    error: recentError,
    refetch: refetchRecent,
  } = useRecentDeliveries({ limit: 25, refreshKey });

  /**
   * Requests still waiting to become a delivery. The API derives each request's
   * state (`pending` until a Delivery exists), so this count comes from a real
   * scan of the list — shown with a "+" when the scan page came back full.
   */
  const { data: requestScan } = useAsync(async () => {
    const res = await deliveryRequestsService
      .list({ page: 1, limit: REQUEST_SCAN_LIMIT })
      .catch(() => null);
    if (!res) return null;
    const items = res.requests ?? [];
    return {
      pending: items.filter((r) => r.status === 'pending').length,
      truncated: items.length >= REQUEST_SCAN_LIMIT,
    };
  }, [refreshKey]);

  /** The Deliveries page owns delivery status — hand over, never edit here. */
  const openDelivery = useCallback(
    (row: RecentDelivery) => {
      navigate(`/delivery/deliveries?orderId=${encodeURIComponent(row.orderId)}`);
    },
    [navigate]
  );

  const activeRows = (recentDeliveries ?? []).filter((row) =>
    ACTIVE_DELIVERY_STATUSES.has(row.status)
  );

  /** Deliveries that stopped before reaching the customer. */
  const problemCount = (stats?.failedDeliveries ?? 0) + (stats?.cancelledDeliveries ?? 0);

  const columns: Column<RecentDelivery>[] = [
    {
      key: 'delivery',
      header: 'Delivery',
      render: (row) => (
        <span className="font-mono text-xs text-gray-600 dark:text-gray-400" title={row._id}>
          {shortId(row._id)}
        </span>
      ),
    },
    {
      key: 'orderId',
      header: 'Order',
      render: (row) => (
        <span className="font-medium text-gray-800 dark:text-gray-100">{row.orderId}</span>
      ),
    },
    {
      key: 'seller',
      header: 'Seller / Shop',
      accessor: (row) => row.pickupAddress?.shopName || row.pickupAddress?.cityName || '—',
    },
    {
      key: 'destination',
      header: 'Destination',
      render: (row) => {
        const a = row.destinationAddress;
        const place = [a?.cityName, a?.regionName].filter(Boolean).join(', ');
        return (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {place || a?.addressDetail || '—'}
          </span>
        );
      },
    },
    {
      key: 'provider',
      header: 'Provider / Rider',
      render: (row) =>
        row.providerName || row.partnerName ? (
          <span className="text-sm text-gray-700 dark:text-gray-200">
            {row.providerName || row.partnerName}
          </span>
        ) : (
          <span className="text-sm text-gray-400">Unassigned</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <DeliveryStatusPill status={row.status} />,
    },
    {
      key: 'updatedAt',
      header: 'Last update',
      render: (row) => {
        const stamp = row.updatedAt ?? row.createdAt;
        return (
          <span className="text-xs text-gray-500 dark:text-gray-400" title={formatDateTime(stamp)}>
            {timeAgo(stamp)}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            openDelivery(row);
          }}
        >
          View Details
        </Button>
      ),
    },
  ];

  const quickLinks: {
    icon: IconDefinition;
    label: string;
    hint: string;
    to: string;
    roles?: AdminRole[];
  }[] = [
    { icon: faListCheck, label: 'Requests', hint: 'Buyer handoffs awaiting pickup', to: '/delivery/requests' },
    { icon: faTruck, label: 'Deliveries', hint: 'Operational list, status changes and live tracking', to: '/delivery/deliveries' },
    { icon: faMap, label: 'Locations', hint: 'Regions, cities, zones and ports', to: '/locations', roles: ['SUPER_ADMIN'] },
    { icon: faMotorcycle, label: 'Providers', hint: 'Riders, businesses, logistics partners', to: '/delivery/providers' },
  ];

  /** Hide a shortcut the signed-in role cannot open — no dead links on the dashboard. */
  const visibleQuickLinks = quickLinks.filter(
    (link) => !link.roles || (!!user && link.roles.includes(user.role))
  );

  return (
    <div className="space-y-6">
      {statsError && <ErrorState message={statsError} onRetry={refetchStats} />}

      {/* 1 — Delivery summary */}
      <section aria-labelledby="overview-summary">
        <h2 id="overview-summary" className="mb-3 text-lg font-semibold dark:text-white">
          Delivery summary
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
          <MetricTile
            label="Total active"
            value={stats?.activeDeliveries}
            tone="text-gray-800 dark:text-gray-100"
            to="/delivery/deliveries"
          />
          <MetricTile
            label="Unassigned"
            value={stats?.unassignedDeliveries}
            tone="text-amber-600 dark:text-amber-400"
            to="/delivery/deliveries?status=pending"
          />
          <MetricTile
            label="Assigned"
            value={stats?.assignedDeliveries}
            tone="text-blue-600 dark:text-blue-400"
            to="/delivery/deliveries?status=assigned"
          />
          <MetricTile
            label="Picked up"
            value={stats?.pickupDeliveries}
            tone="text-cyan-600 dark:text-cyan-400"
            to="/delivery/deliveries?status=pickup"
          />
          <MetricTile
            label="In transit"
            value={stats?.inTransitDeliveries}
            tone="text-indigo-600 dark:text-indigo-400"
            to="/delivery/deliveries?status=in_transit"
          />
          <MetricTile
            label="Delivered today"
            value={stats?.deliveredToday}
            tone="text-green-600 dark:text-green-400"
            to="/delivery/deliveries?status=delivered"
          />
          <MetricTile
            label="Failed / exception"
            value={stats?.failedDeliveries}
            tone="text-red-600 dark:text-red-400"
            to="/delivery/deliveries?status=failed"
          />
        </div>
      </section>

      {/* 2 — Needs attention */}
      <section aria-labelledby="overview-attention">
        <h2 id="overview-attention" className="mb-3 text-lg font-semibold dark:text-white">
          Needs attention
        </h2>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <AttentionRow
            label="Unassigned deliveries"
            hint="Requested but no rider yet"
            value={formatNumber(stats?.unassignedDeliveries ?? 0)}
            to="/delivery/deliveries?status=pending"
          />
          <AttentionRow
            label="Failed deliveries"
            hint="Delivery attempt failed"
            value={formatNumber(stats?.failedDeliveries ?? 0)}
            to="/delivery/deliveries?status=failed"
          />
          <AttentionRow
            label="Delayed / problem deliveries"
            hint="Failed or cancelled — stopped before delivery"
            value={formatNumber(problemCount)}
            to="/delivery/deliveries?status=cancelled"
          />
          <AttentionRow
            label="Pending delivery requests"
            hint="Buyer handoffs not turned into a delivery"
            value={
              requestScan
                ? `${formatNumber(requestScan.pending)}${requestScan.truncated ? '+' : ''}`
                : '—'
            }
            to="/delivery/requests"
          />
        </div>
      </section>

      {/* 3 — Recent active deliveries (read-only; View Details hands over) */}
      <section aria-labelledby="overview-recent">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="overview-recent" className="text-lg font-semibold dark:text-white">
            Recent active deliveries
          </h2>
          <Button variant="outline" size="sm" onClick={() => navigate('/delivery/deliveries')}>
            View All
          </Button>
        </div>
        {recentError ? (
          <ErrorState message={recentError} onRetry={refetchRecent} />
        ) : activeRows.length === 0 && !recentLoading ? (
          <EmptyState
            title="No active deliveries"
            description="Deliveries appear here once they are created and before they reach a final state."
            action={
              <Button size="sm" variant="outline" onClick={() => navigate('/delivery/requests')}>
                View delivery requests
              </Button>
            }
          />
        ) : (
          <DataTable<RecentDelivery>
            columns={columns}
            rows={activeRows}
            rowKey={(row) => row._id}
            loading={recentLoading}
            emptyTitle="No active deliveries"
            onRowClick={openDelivery}
          />
        )}
      </section>

      {/* 4 — Quick navigation */}
      <section aria-labelledby="overview-shortcuts">
        <h2 id="overview-shortcuts" className="mb-3 text-lg font-semibold dark:text-white">
          Go to
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleQuickLinks.map((link) => (
            <QuickNavCard key={link.label} {...link} />
          ))}
        </div>
      </section>
    </div>
  );
}
