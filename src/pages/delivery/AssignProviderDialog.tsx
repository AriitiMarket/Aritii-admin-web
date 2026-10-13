/**
 * Assign Provider — the ONE place an admin hands a delivery to a provider
 * (MVP §8-§13). Opened from the delivery detail's Assignment tab; there is no
 * separate Assignments page.
 *
 *   Normal:  Delivery Zone/Port -> eligible providers for THAT area -> select.
 *   Empty:   "No eligible provider found for this Zone/Port." -> [Force Assign]
 *   Force:   every otherwise-eligible provider, labelled Other Zone / Other
 *            Port -> explicit selection -> warning + REQUIRED reason -> confirm.
 *
 * The backend enforces all of this again (reason + admin identity required for
 * `forceAssignment`, Zone/Port checked server-side); this dialog only makes the
 * rules visible. Force mode is never enabled automatically.
 */
import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Spinner } from '@/components/common/Spinner';
import { ReasonDialog } from '@/components/common/ReasonDialog';
import { zonesService } from '@/services/locations.service';
import { portsService } from '@/services/ports.service';
import {
  assignmentsService,
  type EligiblePartner,
} from '@/services/assignments.service';
import { getDeliveryRef, getDeliveryStatusLabel } from './utils/statusHelpers';
import type { Delivery } from './types';
import { ApiError } from '@/types/api';

/** Read-only availability badge derived from the provider's real state. */
const availabilityOf = (p: EligiblePartner) =>
  p.status === 'available' && p.isOnline !== false
    ? { label: 'Available', variant: 'success' as const }
    : { label: p.status === 'busy' ? 'Busy' : 'Offline', variant: 'neutral' as const };

export function AssignProviderDialog({
  delivery,
  mode,
  open,
  onClose,
  onDone,
}: {
  delivery: Delivery | null;
  mode: 'assign' | 'reassign';
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const { showToast } = useToast();
  const [providers, setProviders] = useState<EligiblePartner[]>([]);
  const [loading, setLoading] = useState(false);
  const [providerId, setProviderId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Force mode is opt-in — the admin must intentionally choose it (§13).
  const [forceMode, setForceMode] = useState(false);
  const [confirmForce, setConfirmForce] = useState(false);

  const deliveryZoneId = delivery?.destination?.zoneId ?? null;
  // Mirrors the backend: `destination.portId`, falling back to the legacy
  // top-level `portId` — the same value the eligibility check uses.
  const deliveryPortId = delivery?.destination?.portId ?? delivery?.portId ?? null;
  const [zoneName, setZoneName] = useState<string | null>(null);
  const [portName, setPortName] = useState<string | null>(null);

  const load = useCallback(async (force: boolean) => {
    if (!delivery) return;
    setLoading(true);
    setError(null);
    setProviderId('');
    try {
      const list = await assignmentsService.eligiblePartners({
        deliveryId: delivery.id,
        force,
      });
      setProviders(list);
    } catch (err) {
      setProviders([]);
      setError(err instanceof ApiError ? err.message : 'Could not load eligible providers');
    } finally {
      setLoading(false);
    }
  }, [delivery]);

  // Reset + load the NORMAL list whenever the dialog opens.
  useEffect(() => {
    if (!open || !delivery) return;
    setForceMode(false);
    setConfirmForce(false);
    void load(false);
  }, [open, delivery, load]);

  // Delivery Zone/Port names for the context line (display only — the backend
  // is the source of truth for eligibility).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const [z, p] = await Promise.all([
        deliveryZoneId ? zonesService.get(deliveryZoneId).catch(() => null) : Promise.resolve(null),
        deliveryPortId ? portsService.get(deliveryPortId).catch(() => null) : Promise.resolve(null),
      ]);
      if (cancelled) return;
      setZoneName(z?.name ?? null);
      setPortName(p?.name ?? null);
    })();
    return () => { cancelled = true; };
  }, [open, deliveryZoneId, deliveryPortId]);

  const submit = async (reason?: string) => {
    if (!delivery || !providerId) return;
    setSaving(true);
    setError(null);
    try {
      if (mode === 'reassign') {
        await assignmentsService.reassign(delivery.id, providerId, reason);
      } else {
        await assignmentsService.create({
          deliveryId: delivery.id,
          providerId,
          ...(reason ? { forceAssignment: true, reason } : {}),
        });
      }
      showToast({
        type: 'success',
        title: reason ? 'Provider force-assigned' : 'Provider assigned',
        message: reason
          ? 'The exception (reason, admin, both zones/ports) is recorded in the delivery history.'
          : 'The provider received the delivery offer.',
      });
      onDone();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not assign the provider');
    } finally {
      setSaving(false);
      setConfirmForce(false);
    }
  };

  if (!open || !delivery) return null;

  const selected = providers.find((p) => p._id === providerId) || null;
  const isOutArea = (p: EligiblePartner) => {
    const zoneOk = !deliveryZoneId || !p.zoneId || p.zoneId === deliveryZoneId;
    const portOk = !deliveryPortId || !p.portId || p.portId === deliveryPortId;
    return !(zoneOk && portOk);
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={mode === 'reassign' ? 'Reassign provider' : 'Assign provider'}
        size="md"
      >
        <div className="space-y-4">
          {/* WHERE — the delivery's own Zone/Port, never changed by an assignment. */}
          <div className="rounded-md bg-gray-50 p-3 text-sm dark:bg-dark-700">
            <p className="font-medium dark:text-white">{getDeliveryRef(delivery)}</p>
            <p className="mt-1 text-gray-600 dark:text-gray-300">
              Zone: {zoneName || deliveryZoneId || '—'}
              {'  ·  '}
              Port: {portName || deliveryPortId || '—'}
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Status: {getDeliveryStatusLabel(delivery.status)}
            </p>
          </div>

          {error && (
            <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </p>
          )}

          {forceMode && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
              Force mode: these providers are outside the delivery&apos;s normal
              delivery area. The delivery keeps its own Zone/Port — only the
              provider is the exception, and it will be recorded with your reason.
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-gray-500">
              <Spinner size="sm" /> Loading providers…
            </div>
          ) : providers.length === 0 ? (
            <div className="rounded-md border border-dashed border-gray-300 p-4 text-center dark:border-dark-600">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                No eligible provider found for this Zone/Port.
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {forceMode
                  ? 'No active provider can receive work right now.'
                  : 'Force assign is optional — only when you deliberately want a provider from another area.'}
              </p>
              {!forceMode && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => { setForceMode(true); void load(true); }}
                >
                  Force Assign
                </Button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-dark-600">
              {providers.map((p) => {
                const out = forceMode && isOutArea(p);
                const availability = availabilityOf(p);
                return (
                  <li key={p._id}>
                    <label className="flex cursor-pointer items-center gap-3 py-2.5">
                      <input
                        type="radio"
                        name="assign-provider"
                        checked={providerId === p._id}
                        onChange={() => setProviderId(p._id)}
                        className="mt-0.5"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium dark:text-white">{p.name}</span>
                        <span className="block text-xs text-gray-500">
                          {p.zoneName || 'No zone'} · {p.portName || 'No port'}
                          {' · '}
                          {p.activeDeliveries ?? 0}/{p.maxActiveAssignments ?? 3} active
                        </span>
                      </span>
                      {out && deliveryZoneId && p.zoneId !== deliveryZoneId && (
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          Other Zone
                        </span>
                      )}
                      {out && deliveryPortId && p.portId && p.portId !== deliveryPortId && (
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          Other Port
                        </span>
                      )}
                      <StatusBadge label={availability.label} variant={availability.variant} />
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex items-center justify-between gap-2 pt-1">
            <div>
              {!forceMode && providers.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => { setForceMode(true); void load(true); }}>
                  Force Assign…
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!providerId || loading || saving}
                loading={saving}
                onClick={() => (forceMode ? setConfirmForce(true) : void submit())}
              >
                {forceMode ? 'Force Assign' : mode === 'reassign' ? 'Reassign' : 'Assign Provider'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* The one confirmation a force assignment needs: warning + reason. */}
      <ReasonDialog
        open={confirmForce}
        title="Force assign provider?"
        message={
          selected
            ? `This provider is outside the normal delivery area (${selected.zoneName || 'no zone'} / ${selected.portName || 'no port'}). Continue?`
            : 'This provider is outside the normal delivery area. Continue?'
        }
        confirmLabel="Confirm force assign"
        placeholder="Reason (e.g. No available provider in the delivery zone.)"
        loading={saving}
        onClose={() => setConfirmForce(false)}
        onConfirm={(reason) => void submit(reason)}
      />
    </>
  );
}

