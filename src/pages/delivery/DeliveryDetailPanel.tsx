/**
 * The delivery record as a detail PANEL (RecordDrawer) with THREE simple tabs:
 *   Overview — key facts, payment, valid status actions, assignment controls
 *   Details  — pickup, destination, issues and proof of delivery
 *   History  — timeline, tracking events, assignment history and audit trail
 *
 * (It used to expose nine tabs — Overview, Assignment, Pickup, Destination,
 * Timeline, Tracking, Issues, Proof, Audit — which split one record across so
 * many panes that operators could not find anything; the same information is
 * now grouped into the three places someone actually looks.)
 *
 * The admin views and operates here — there is no free-form status field. The
 * status itself is shown read-only and every action offered is one the service
 * considers valid from the CURRENT state (see `getManualTransitions`), so the
 * console can never offer a transition the backend refuses.
 *
 * Data comes from the existing contracts:
 *   GET /delivery/delivery/:id                -> the record (details/overview/proof)
 *   GET /delivery/delivery/:id/history        -> { timeline, trackingEvents, assignmentHistory }
 *   GET /admin/audit-logs?targetEntity=delivery&search=<id> -> the audit trail
 */
import { useEffect, useState } from 'react';
import { RecordDrawer, type DetailTab } from '@/components/workspace/RecordDrawer';
import { Facts } from '@/components/workspace/DetailList';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ApiError } from '@/types/api';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { deliveryAdmin } from '@/api/admin';
import { auditService } from '@/services/audit.service';
import { deliveryServicesService } from '@/services/deliveryServices.service';
import { zonesService } from '@/services/locations.service';
import { portsService } from '@/services/ports.service';
import { DeliveryStatusPill } from './components/DeliveryStatusPill';
import { getDeliveryRef, getDeliveryStatusLabel, getManualTransitions } from './utils/statusHelpers';
import { REASSIGNABLE_STATUSES } from './constants';
import { AssignProviderDialog } from './AssignProviderDialog';
import type { Delivery } from './types';

interface TimelineEntry { stage: string; label: string; timestamp: string | null; status: string; note: string }
interface TrackingEntry { stage: string; label: string; timestamp: string; status?: string; note: string }
interface AssignmentEntry { status: string; actorName?: string; at?: string }

const place = (a?: Delivery['pickupAddress']) =>
  [a?.sectorName, a?.cityName, a?.regionName].filter(Boolean).join(', ');

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {title}
      </p>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>;
}

export interface DeliveryDetailPanelProps {
  delivery: Delivery | null;
  open: boolean;
  onClose: () => void;
  /** Runs a valid transition; the parent owns the API call and dialog. */
  onRequestTransition: (delivery: Delivery, nextStatus: string) => void;
}

export function DeliveryDetailPanel({
  delivery,
  open,
  onClose,
  onRequestTransition,
}: DeliveryDetailPanelProps) {
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [tracking, setTracking] = useState<TrackingEntry[]>([]);
  const [assignments, setAssignments] = useState<AssignmentEntry[]>([]);
  const [audit, setAudit] = useState<{ action: string; actorName?: string; at?: string; newValue?: unknown }[]>([]);
  const [serviceName, setServiceName] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [assignOpen, setAssignOpen] = useState(false);
  // Resolved names for the delivery's OWN Zone/Port (the assignment context).
  const [zoneName, setZoneName] = useState<string | null>(null);
  const [portName, setPortName] = useState<string | null>(null);

  /**
   * Assignment is decided by the delivery's OWN state. Offering "Assign" while
   * a provider already holds the delivery made the console POST a create the
   * service always refuses with 409; offering it on a finished delivery is just
   * as wrong. `REASSIGNABLE_STATUSES` is the same list the service accepts.
   */
  const hasActiveAssignment =
    !!delivery?.providerId && REASSIGNABLE_STATUSES.includes(delivery.status);
  const canAssign =
    !!delivery &&
    delivery.status !== 'delivered' &&
    delivery.status !== 'cancelled' &&
    delivery.status !== 'returned';

  // Zone/Port display names — the WHERE of an assignment (§8). The delivery's
  // own area; an assignment never rewrites it, not even a forced one (§12).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const zoneId = delivery?.destination?.zoneId ?? null;
    const portId = delivery?.destination?.portId ?? delivery?.portId ?? null;
    (async () => {
      const [zone, port] = await Promise.all([
        zoneId ? zonesService.get(zoneId).catch(() => null) : Promise.resolve(null),
        portId ? portsService.get(portId).catch(() => null) : Promise.resolve(null),
      ]);
      if (cancelled) return;
      setZoneName(zone?.name ?? null);
      setPortName(port?.name ?? null);
    })();
    return () => { cancelled = true; };
  }, [open, delivery?.id, delivery?.destination?.zoneId, delivery?.destination?.portId, delivery?.portId]);

  useEffect(() => {
    if (!open || !delivery) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [history, logs] = await Promise.all([
          deliveryAdmin.getDeliveryHistory(delivery.id),
          auditService
            .listLogs({ page: 1, limit: 50, targetEntity: 'delivery', search: delivery.id })
            .catch(() => null),
        ]);
        if (cancelled) return;
        setTimeline((history.timeline ?? []) as TimelineEntry[]);
        setTracking((history.trackingEvents ?? []) as TrackingEntry[]);
        setAssignments((history.assignmentHistory ?? []) as AssignmentEntry[]);
        setAudit((logs?.logs ?? []) as typeof audit);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load the delivery record');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delivery, open, reloadKey]);

  // Resolve the service name for the Overview tab when the record names one.
  useEffect(() => {
    const serviceId = delivery?.serviceId;
    if (!open || !serviceId) {
      setServiceName(null);
      return;
    }
    let cancelled = false;
    deliveryServicesService
      .list({ page: 1, limit: 200 })
      .then((res) => {
        if (cancelled) return;
        setServiceName(res.items.find((s) => s._id === serviceId)?.name ?? null);
      })
      .catch(() => {
        if (!cancelled) setServiceName(null);
      });
    return () => {
      cancelled = true;
    };
  }, [delivery, open]);

  if (!delivery) return null;

  const validTransitions = getManualTransitions(delivery.status || '');

  const tabs: DetailTab[] = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <div className="space-y-4">
          <Block title="Delivery">
            <Facts
              items={[
                ['Delivery ID', delivery.id],
                ['Order ID', delivery.orderId],
                ['Status', <DeliveryStatusPill status={delivery.status} />],
                ['Service', serviceName ?? (delivery.serviceId ? delivery.serviceId.slice(0, 8) : '—')],
                ['Created', formatDateTime(delivery.createdAt)],
                ['Last update', formatDateTime(delivery.updatedAt ?? delivery.createdAt)],
                ['Delivered at', formatDateTime(delivery.deliveredAt)],
                ['Estimated delivery', formatDateTime(delivery.estimatedDeliveryAt ?? undefined)],
              ]}
            />
          </Block>
          <Block title="Payment">
            <Facts
              items={[
                ['Method', delivery.paymentMethod ?? '—'],
                ['Amount', delivery.paymentAmount != null ? formatCurrency(delivery.paymentAmount) : '—'],
              ]}
            />
          </Block>
          {/* WHERE the delivery belongs — the assignment decision is made from
              this Zone/Port, and an assignment never changes it (§12). */}
          <Block title="Assignment">
            <Facts
              items={[
                ['Zone', zoneName ?? 'Not identified'],
                ['Port', portName ?? 'Not identified'],
                ['Current provider', delivery.providerName || delivery.providerId || 'None'],
              ]}
            />
            <div className="mb-3 mt-4 flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)} disabled={!canAssign}>
                {hasActiveAssignment ? 'Reassign Provider' : 'Assign Provider'}
              </Button>
              <span className="text-xs text-gray-500">
                {hasActiveAssignment
                  ? 'Hand this delivery to another provider.'
                  : 'Shows providers eligible for this Zone/Port. If none are available you may force-assign with a reason.'}
              </span>
            </div>
          </Block>
          <Block title="Valid actions from this state">
            {validTransitions.length === 0 ? (
              <Empty text="This delivery has reached a terminal state — no further transitions are allowed." />
            ) : (
              <div className="flex flex-wrap gap-2">
                {validTransitions.map((next) => (
                  <Button
                    key={next}
                    size="sm"
                    variant="outline"
                    onClick={() => onRequestTransition(delivery, next)}
                  >
                    Mark as {getDeliveryStatusLabel(next)}
                  </Button>
                ))}
              </div>
            )}
          </Block>
        </div>
      ),
    },
    {
      id: 'details',
      label: 'Details',
      content: (
        <div>
          <Block title="Pickup">
            <Facts
              items={[
                ['Shop', delivery.pickupAddress?.shopName || '—'],
                ['Area', place(delivery.pickupAddress) || '—'],
                ['Contact', delivery.pickupAddress?.contactName || '—'],
                ['Phone', delivery.pickupAddress?.contactPhone || '—'],
                ['Picked up at', formatDateTime(delivery.pickedUpAt ?? undefined)],
              ]}
            />
          </Block>
          <Block title="Destination">
            <Facts
              items={[
                ['Area', place(delivery.destinationAddress ?? delivery.deliveryAddress) || '—'],
                ['Address', delivery.destinationAddress?.addressDetail || delivery.deliveryAddress?.addressDetail || '—'],
                ['Contact', delivery.destinationAddress?.contactName || delivery.deliveryAddress?.contactName || '—'],
                ['Phone', delivery.destinationAddress?.contactPhone || delivery.deliveryAddress?.contactPhone || '—'],
                ['Instructions', delivery.destinationAddress?.instructions || '—'],
              ]}
            />
          </Block>
          <Block title="Issues">
            <Facts
              items={[
                ['Attempt count', delivery.retryCount ?? 0],
                ['Agreed next action', delivery.nextAction || '—'],
                ['Failure reason', delivery.failureReason || '—'],
                ['Cancellation reason', delivery.cancellationReason || '—'],
                ['Return reason', delivery.returnReason || '—'],
              ]}
            />
          </Block>
          <Block title="Proof of delivery">
            <Facts
              items={[
                ['Delivered at', formatDateTime(delivery.deliveredAt ?? undefined)],
                ['Received by', delivery.proofOfDelivery?.recipientName || '—'],
                ['Cash collected', delivery.paymentMethod === 'COD' ? formatCurrency(delivery.paymentAmount ?? 0) : 'Not applicable'],
                ['Proof reference', delivery.proofOfDelivery?.recipientReference || '—'],
              ]}
            />
          </Block>
        </div>
      ),
    },
    {
      id: 'history',
      label: 'History',
      content: (
        <div>
          <Block title="Timeline">
            {timeline.length === 0 ? (
              <Empty text="No timeline entries recorded yet." />
            ) : (
              <ul className="space-y-2">
                {timeline.map((t, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="w-32 shrink-0 text-xs text-gray-500">{formatDateTime(t.timestamp ?? undefined)}</span>
                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-dark-800 dark:text-gray-300">
                      {t.label || getDeliveryStatusLabel(t.status)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">{t.note || '—'}</span>
                  </li>
                ))}
              </ul>
            )}
          </Block>
          <Block title="Tracking events">
            {tracking.length === 0 ? (
              <Empty text="No tracking events recorded for this delivery." />
            ) : (
              <ul className="space-y-2">
                {tracking.map((e, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="w-32 shrink-0 text-xs text-gray-500">{formatDateTime(e.timestamp)}</span>
                    <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800 dark:bg-sky-900 dark:text-sky-300">
                      {e.label || getDeliveryStatusLabel(e.status ?? '')}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">{e.note || '—'}</span>
                  </li>
                ))}
              </ul>
            )}
          </Block>
          <Block title="Assignment history">
            {assignments.length === 0 ? (
              <Empty text="No assignments recorded for this delivery yet." />
            ) : (
              <ul className="space-y-2">
                {assignments.map((a, i) => (
                  <li key={i} className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 py-2 text-sm last:border-0 dark:border-dark-600">
                    <span className="text-gray-700 dark:text-gray-200">{a.actorName || 'System'}</span>
                    <span className="flex items-center gap-3">
                      <StatusBadge label={a.status} />
                      <span className="text-xs text-gray-500">{formatDateTime(a.at)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Block>
          <Block title="Audit">
            {audit.length === 0 ? (
              <Empty text="No audit entries recorded for this delivery." />
            ) : (
              <ul className="space-y-2">
                {audit.map((a, i) => (
                  <li key={i} className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 py-2 text-sm last:border-0 dark:border-dark-600">
                    <span className="text-gray-700 dark:text-gray-200">{a.action}</span>
                    <span className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{a.actorName || 'System'}</span>
                      <span className="text-xs text-gray-500">{formatDateTime(a.at)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Block>
        </div>
      ),
    },
  ];

  return (
    <>
    <RecordDrawer
      open={open}
      onClose={onClose}
      title={getDeliveryRef(delivery)}
      subtitle={delivery.id}
      statusLabel={getDeliveryStatusLabel(delivery.status)}
      loading={loading}
      error={error}
      onRetry={() => setReloadKey((k) => k + 1)}
      summary={[
        { label: 'Status', value: <DeliveryStatusPill status={delivery.status} /> },
        { label: 'Order', value: delivery.orderId },
        { label: 'Created', value: formatDateTime(delivery.createdAt) },
      ]}
      tabs={tabs}
      activeTab={tab}
      onTabChange={setTab}
    />
    {assignOpen && (
      <AssignProviderDialog
        delivery={delivery}
        mode={hasActiveAssignment ? 'reassign' : 'assign'}
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        onDone={() => setReloadKey((k) => k + 1)}
      />
    )}
  </>
  );
}
