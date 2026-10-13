import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAsync } from '@/hooks/useAsync';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { RecordDrawer, type DetailTab } from '@/components/workspace/RecordDrawer';
import { Facts } from '@/components/workspace/DetailList';
import { ReasonDialog } from '@/components/common/ReasonDialog';
import { zonesService, routesService } from '@/services/locations.service';
import { portsService } from '@/services/ports.service';
import {
  providersService,
  PROVIDER_TYPE_LABELS,
  type ProviderDetail,
} from '@/services/providers.service';
import { formatDate } from '@/utils/format';
import { getDeliveryStatusLabel } from '@/pages/delivery/utils/statusHelpers';
import {
  accountStateOf,
  operationalStateOf,
} from './providerStatus';
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

/** Per-order delivery statuses render with the ONE canonical vocabulary. */
const orderStatusLabel = (status: string) => getDeliveryStatusLabel(status);

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
  const [tab, setTab] = useState('identity');
  const [busy, setBusy] = useState(false);
  const [assignZones, setAssignZones] = useState(false);
  const [assignRoutes, setAssignRoutes] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

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

  // Resolved Port NAME for the City / Zone / Port block (§5).
  const { data: portName } = useAsync(
    () =>
      detail?.portId
        ? portsService.get(detail.portId).then((pt) => pt.name).catch(() => null)
        : Promise.resolve(null),
    [detail?.portId]
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
  // The application's answers (§15) and the deactivation reason live under the
  // provider's free-form metadata block.
  const application = (detailTyped?.metadata?.application ?? {}) as Record<string, unknown>;
  const str = (value: unknown) => (value === undefined || value === null ? '' : String(value));

  const tabs: DetailTab[] = detailTyped
    ? [
        {
          id: 'identity',
          label: 'Identity',
          content: (
            <Facts items={[
              ['Name', detailTyped.name],
              ['Provider type', PROVIDER_TYPE_LABELS[detailTyped.providerType] ?? detailTyped.providerType],
              ['Transport role', detailTyped.actorType ?? '—'],
              ['Phone', detailTyped.phone ?? '—'],
              ['Email', detailTyped.email || '—'],
              ['Vehicle', detailTyped.vehicleType ?? '—'],
              ['Plate', detailTyped.plateNumber || '—'],
              ['Status', accountStateOf(detailTyped.status).label],
            ]} />
          ),
        },
        {
          id: 'operations',
          label: 'Operating location & capacity',
          content: (
            <Facts items={[
              // WHERE — City / Zone / Port (§5): where the provider normally
              // operates. This is NOT their Online/Offline availability.
              ['City', detailTyped.cityName ?? '—'],
              ['Zone', detailTyped.zones.length ? detailTyped.zones.map((z) => z.name).join(', ') : '—'],
              ['Port', detailTyped.portId ? (portName ?? '—') : '—'],
              // Availability — READ-ONLY for the Admin (§7, §15).
              ['Availability', operationalStateOf(detailTyped.status).label],
              ['Last seen', detailTyped.availability?.lastSeenAt ? formatDate(detailTyped.availability.lastSeenAt) : '—'],
              ['Active deliveries', `${detailTyped.activeDeliveries ?? 0} / ${detailTyped.maxActiveAssignments ?? '—'}`],
              ['Completed deliveries', detailTyped.completedDeliveries ?? 0],
              ['Max capacity', detailTyped.maxCapacityKg != null ? `${detailTyped.maxCapacityKg} kg` : '—'],
              ['Rating', detailTyped.rating ? `${detailTyped.rating}/5` : '—'],
              ['Assigned routes', detailTyped.routes.length],
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
                    <Link
                      to={`/delivery/deliveries?orderId=${encodeURIComponent(a.deliveries[0]?.orderId ?? '')}`}
                      className="text-sm font-medium text-primary-dark hover:underline"
                    >
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
                        {d.orderId} · {orderStatusLabel(d.status)}
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
        content: (
          <>
            <div className="mb-3 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setAssignRoutes(true)}>
                Assign routes
              </Button>
            </div>
            {detailTyped.routes.length === 0 ? (
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
            )}
          </>
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
      // The application answers the review questions (§4, §15): what the
      // provider declared, and the location they operate — which is approved
      // WITH the application instead of being re-assigned afterwards.
      ...(application && Object.keys(application).length > 0
        ? [{
          id: 'application',
          label: 'Application',
          content: (
            <Facts items={[
              ['Submitted', application.submittedAt ? formatDate(String(application.submittedAt)) : '—'],
              ['Vehicle model', str(application.vehicleModel) || '—'],
              ['Experience', str(application.experience) || '—'],
              ['Availability', str(application.availability) || '—'],
              ['Insurance', application.hasInsurance ? 'Yes' : 'No'],
              ['ID document', str(application.idDocumentName) || '—'],
              ...(str(application.idDocumentUrl)
                ? [['ID document link', str(application.idDocumentUrl)] as [string, string]]
                : []),
              ...(detailTyped.metadata?.deactivationReason
                ? [['Deactivation reason', String(detailTyped.metadata.deactivationReason)] as [string, string]]
                : []),
            ]} />
          ),
        }]
        : []),
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
        statusLabel={detailTyped ? accountStateOf(detailTyped.status).label : undefined}
        loading={loading}
        error={error ? String(error) : null}
        onRetry={refetch}
        actions={
          <>
            {(detailTyped?.status === 'pending' || detailTyped?.status === 'rejected') && (
              <Button
                variant="primary"
                size="sm"
                loading={busy}
                onClick={() => act(() => providersService.approve(detailTyped!._id))}
              >
                Approve
              </Button>
            )}
            {detailTyped?.status === 'pending' && (
              <Button
                variant="danger"
                size="sm"
                loading={busy}
                onClick={() => { setRejectError(null); setRejectOpen(true); }}
              >
                Reject
              </Button>
            )}
            {/* Activate / Deactivate — the account lifecycle the Admin owns.
                Deliberately NO Set Online / Set Offline: availability belongs
                to the provider (§7, §16). */}
            {detailTyped?.status === 'suspended' ? (
              <Button
                variant="primary"
                size="sm"
                loading={busy}
                onClick={() => act(() => providersService.setStatus(detailTyped!._id, 'offline'))}
              >
                Activate
              </Button>
            ) : (
              detailTyped?.status && !['pending', 'rejected'].includes(detailTyped.status) && (
                <Button
                  variant="danger"
                  size="sm"
                  loading={busy}
                  onClick={() => { setDeactivateError(null); setDeactivateOpen(true); }}
                >
                  Deactivate
                </Button>
              )
            )}
            <Button variant="outline" size="sm" onClick={() => setAssignZones(true)}>Edit Location</Button>
          </>
        }
        summary={[
          { label: 'Active deliveries', value: detailTyped?.activeDeliveries ?? 0 },
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

      {/* Rejection reason — branded dialog instead of window.prompt. */}
      <ReasonDialog
        open={rejectOpen}
        title={`Reject ${detailTyped?.name ?? 'provider'}?`}
        message="The reason is shown to the applicant, so make it clear and specific."
        confirmLabel="Reject provider"
        placeholder="Why is this provider being rejected?"
        loading={busy}
        error={rejectError}
        onClose={() => { setRejectOpen(false); setRejectError(null); }}
        onConfirm={async (reason) => {
          if (!detailTyped) return;
          setRejectError(null);
          try {
            await providersService.reject(detailTyped._id, reason);
            setRejectOpen(false);
            await refetch();
            onChanged();
          } catch (err) {
            setRejectError(err instanceof Error ? err.message : 'Could not reject provider');
          }
        }}
      />
      {/* Deactivation reason (required) + warning about deliveries in flight. */}
      <ReasonDialog
        open={deactivateOpen}
        title={`Deactivate ${detailTyped?.name ?? 'provider'}?`}
        message={
          (detailTyped?.activeDeliveries ?? 0) > 0
            ? `This provider currently has ${detailTyped?.activeDeliveries} active deliver${detailTyped?.activeDeliveries === 1 ? 'y' : 'ies'}. Deactivating blocks NEW offers only — those deliveries keep running and must be reassigned from the Deliveries page if the provider drops them.`
            : 'Deactivating blocks new delivery offers. Their configuration and history are kept, and you can activate them at any time.'
        }
        confirmLabel="Deactivate provider"
        placeholder="Why is this provider being deactivated?"
        loading={busy}
        error={deactivateError}
        onClose={() => { setDeactivateOpen(false); setDeactivateError(null); }}
        onConfirm={async (reason) => {
          if (!detailTyped) return;
          setDeactivateError(null);
          setBusy(true);
          try {
            await providersService.setStatus(detailTyped._id, 'suspended', reason);
            setDeactivateOpen(false);
            await refetch();
            onChanged();
          } catch (err) {
            setDeactivateError(err instanceof Error ? err.message : 'Could not deactivate provider');
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}
