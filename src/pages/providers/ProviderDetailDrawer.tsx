import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAsync } from '@/hooks/useAsync';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { RecordDrawer, type DetailTab } from '@/components/workspace/RecordDrawer';
import { Facts } from '@/components/workspace/DetailList';
import { zonesService, routesService } from '@/services/locations.service';
import {
  providersService,
  PROVIDER_TYPE_LABELS,
  type ProviderDetail,
} from '@/services/providers.service';
import { formatDate } from '@/utils/format';
import { AssignZonesModal } from './AssignZonesModal';
import { AssignRoutesModal } from './AssignRoutesModal';

const ASSIGNMENT_LABELS: Record<string, string> = {
  waiting_acceptance: 'Waiting for Acceptance',
  accepted: 'Accepted',
  picking_up: 'Picking Up',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  completed: 'Completed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Ready for Pickup',
  assigned: 'Assigned',
  pickup: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  failed: 'Failed',
  cancelled: 'Cancelled',
  reassigned: 'Reassigned',
};

const ACTIVE = ['waiting_acceptance', 'accepted', 'picking_up', 'picked_up', 'in_transit'];

/**
 * Provider detail workspace — the same drawer pattern used by Locations &
 * Expansion, so the whole admin console feels like one system.
 */
export function ProviderDetailDrawer({
  providerId,
  onClose,
  onChanged,
}: {
  providerId: string | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [tab, setTab] = useState('overview');
  const [busy, setBusy] = useState(false);
  const [assignZones, setAssignZones] = useState(false);
  const [assignRoutes, setAssignRoutes] = useState(false);

  const { data: detail, loading, error, refetch } = useAsync(
    () => (providerId ? providersService.get(providerId) : Promise.resolve(null)),
    [providerId]
  );

  // Option sources come from the existing Zones / Routes modules.
  const { data: allZones } = useAsync(
    () => (assignZones && providerId ? zonesService.list({ page: 1, limit: 200 }) : Promise.resolve(null)),
    [assignZones]
  );
  const { data: allRoutes } = useAsync(
    () => (assignRoutes && providerId ? routesService.list({ page: 1, limit: 200 }) : Promise.resolve(null)),
    [assignRoutes]
  );

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      await refetch();
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const p = detail;
  const detailTyped: ProviderDetail | null = p;

  const tabs: DetailTab[] = detailTyped
    ? [
      {
        id: 'overview',
        label: 'Overview',
        content: (
          <Facts items={[
            ['Name', detailTyped.name],
            ['Provider type', PROVIDER_TYPE_LABELS[detailTyped.providerType] ?? detailTyped.providerType],
            ['Transport role', detailTyped.actorType ?? '—'],
            ['Phone', detailTyped.phone ?? '—'],
            ['Email', detailTyped.email || '—'],
            ['Operating location', detailTyped.operatingLocationName ?? 'Any'],
            ['Assigned zones', detailTyped.zones.length],
            ['Assigned routes', detailTyped.routes.length],
            ['Availability', detailTyped.availability?.isOnline ? 'Online' : 'Offline'],
            ['Active assignments', detailTyped.activeAssignmentCount],
            ['Completed deliveries', detailTyped.completedDeliveries ?? 0],
            ['Status', detailTyped.status],
          ]} />
        ),
      },
      {
        id: 'assignments',
        label: 'Assignments',
        content:
          detailTyped.assignments.length === 0 ? (
            <p className="text-sm text-gray-500">No assignments yet.</p>
          ) : (
            <ul className="space-y-3">
              {detailTyped.assignments.map((a) => (
                <li key={a._id} className="rounded-md border border-gray-100 p-3 dark:border-dark-600">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link to={`/delivery/assignments/${a._id}`} className="text-sm font-medium text-primary-dark hover:underline">
                      {a.reference}
                    </Link>
                    <StatusBadge
                      label={ASSIGNMENT_LABELS[a.status] ?? a.status}
                      variant={ACTIVE.includes(a.status) ? 'info' : a.status === 'completed' ? 'success' : 'neutral'}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {a.deliveries.length} order(s) · assigned {a.assignedAt ? formatDate(a.assignedAt) : '—'}
                    {a.respondedAt ? ` · responded ${formatDate(a.respondedAt)}` : ''}
                    {a.completedAt ? ` · completed ${formatDate(a.completedAt)}` : ''}
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {a.deliveries.map((d) => (
                      <li key={d.orderId} className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800">
                        {d.orderId} · {ORDER_STATUS_LABELS[d.status] ?? d.status}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          ),
      },
      {
        id: 'zones',
        label: 'Zones',
        content:
          detailTyped.zones.length === 0 ? (
            <p className="text-sm text-gray-500">No zones assigned.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {detailTyped.zones.map((z) => (
                <li key={z._id} className="flex items-center justify-between gap-3 border-b border-gray-100 py-1.5 dark:border-dark-600">
                  <span className="font-medium text-gray-800 dark:text-gray-100">{z.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{z.code}</span>
                    <StatusBadge label={z.status} />
                  </span>
                </li>
              ))}
            </ul>
          ),
      },
      {
        id: 'routes',
        label: 'Routes',
        content:
          detailTyped.routes.length === 0 ? (
            <p className="text-sm text-gray-500">No routes assigned.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {detailTyped.routes.map((r) => (
                <li key={r._id} className="flex items-center justify-between gap-3 border-b border-gray-100 py-1.5 dark:border-dark-600">
                  <span className="font-medium text-gray-800 dark:text-gray-100">{r.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{r.distanceKm != null ? `${r.distanceKm} km` : '—'}</span>
                    <StatusBadge label={r.status} />
                  </span>
                </li>
              ))}
            </ul>
          ),
      },
      {
        id: 'deliveries',
        label: 'Deliveries',
        content: (
          <Facts items={[
            ['Active deliveries', detailTyped.activeDeliveries ?? 0],
            ['Completed deliveries', detailTyped.completedDeliveries ?? 0],
            ['Total on record', detailTyped.deliveryCount],
          ]} />
        ),
      },
      {
        id: 'availability',
        label: 'Availability',
        content: (
          <Facts items={[
            ['Current', detailTyped.availability?.isOnline ? 'Online' : 'Offline'],
            ['Last seen', detailTyped.availability?.lastSeenAt ? formatDate(detailTyped.availability.lastSeenAt) : 'Never'],
            ['Status', detailTyped.status],
          ]} />
        ),
      },
      {
        id: 'performance',
        label: 'Performance',
        content: (
          <Facts items={[
            ['Rating', detailTyped.rating ? `${detailTyped.rating} / 5` : 'Not rated'],
            ['Completed deliveries', detailTyped.completedDeliveries ?? 0],
            ['Active deliveries', detailTyped.activeDeliveries ?? 0],
            ['Active assignments', detailTyped.activeAssignmentCount],
            ['Assignment capacity', detailTyped.maxActiveAssignments ?? 3],
          ]} />
        ),
      },
      {
        id: 'activity',
        label: 'Activity',
        content: (
          <Facts items={[
            ['Created', detailTyped.createdAt ? formatDate(detailTyped.createdAt) : '—'],
            ['Last updated', detailTyped.updatedAt ? formatDate(detailTyped.updatedAt) : '—'],
            ['Plate number', detailTyped.plateNumber || '—'],
            ['Vehicle', detailTyped.vehicleType ?? '—'],
            ['Capacity', detailTyped.maxCapacityKg ? `${detailTyped.maxCapacityKg} kg` : '—'],
          ]} />
        ),
      },
    ]
    : [];

  return (
    <>
      <RecordDrawer
        open={!!providerId}
        onClose={onClose}
        title={detailTyped?.name ?? ''}
        subtitle={detailTyped ? PROVIDER_TYPE_LABELS[detailTyped.providerType] ?? detailTyped.providerType : undefined}
        statusLabel={detailTyped?.status}
        loading={loading}
        error={error ? String(error) : null}
        onRetry={refetch}
        actions={
          <>
            {detailTyped?.status === 'pending' && (
              <Button
                variant="primary"
                size="sm"
                loading={busy}
                onClick={() => act(() => providersService.approve(detailTyped!._id))}
              >
                Approve
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setAssignZones(true)}>Assign Zone</Button>
            <Button variant="outline" size="sm" onClick={() => setAssignRoutes(true)}>Assign Route</Button>
            <Button
              variant="outline"
              size="sm"
              loading={busy}
              onClick={() => act(() => providersService.setOnline(detailTyped!._id, !detailTyped!.availability?.isOnline))}
            >
              {detailTyped?.availability?.isOnline ? 'Set Offline' : 'Set Online'}
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={busy}
              onClick={() =>
                act(() =>
                  detailTyped?.status === 'suspended'
                    ? providersService.setStatus(detailTyped!._id, 'offline')
                    : providersService.setStatus(detailTyped!._id, 'suspended')
                )
              }
            >
              {detailTyped?.status === 'suspended' ? 'Reactivate' : 'Suspend'}
            </Button>
          </>
        }
        summary={[
          { label: 'Active assignments', value: detailTyped?.activeAssignmentCount ?? 0 },
          { label: 'Completed', value: detailTyped?.completedDeliveries ?? 0 },
          { label: 'Rating', value: detailTyped?.rating ? `${detailTyped.rating}/5` : '—' },
        ]}
        tabs={tabs}
        activeTab={tab}
        onTabChange={setTab}
      />

      {detailTyped && (
        <>
          <AssignZonesModal
            open={assignZones}
            provider={detailTyped}
            zones={allZones?.zones ?? []}
            onClose={() => setAssignZones(false)}
            onSaved={() => { setAssignZones(false); refetch(); onChanged(); }}
          />
          <AssignRoutesModal
            open={assignRoutes}
            provider={detailTyped}
            routes={allRoutes?.routes ?? []}
            onClose={() => setAssignRoutes(false)}
            onSaved={() => { setAssignRoutes(false); refetch(); onChanged(); }}
          />
        </>
      )}
    </>
  );
}
