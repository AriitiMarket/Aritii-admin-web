import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { SelectField } from '@/components/forms/SelectField';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ridersService } from '@/services/riders.service';
import { dispatchService, type ReadyOrder } from '@/services/dispatch.service';
import { ApiError } from '@/types/api';
import type { Rider as RiderType } from '@/types';

/**
 * "Assign to Rider" step of the workflow.
 *
 * Shows exactly what was selected, the zones the batch covers, the available
 * riders, then confirms. The backend re-validates every order and the rider
 * (active / available / serves the area / within capacity) on submit — this
 * panel never trusts the client-side check alone.
 */
export function AssignRiderPanel({
  open,
  orders,
  onClose,
  onAssigned,
}: {
  open: boolean;
  orders: ReadyOrder[];
  onClose: () => void;
  onAssigned: (reference: string) => void;
}) {
  const [riders, setRiders] = useState<RiderType[]>([]);
  const [ridersLoading, setRidersLoading] = useState(false);
  const [partnerId, setPartnerId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setPartnerId('');
    setError(null);
    setRidersLoading(true);
    ridersService
      .list({ page: 1, limit: 100, status: 'available' })
      .then((result) => setRiders(result.items))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load riders'))
      .finally(() => setRidersLoading(false));
  }, [open]);

  /** Zones covered by the selected orders, de-duplicated for display. */
  const zones = useMemo(() => {
    const names = new Map<string, string>();
    orders.forEach((o) => {
      if (o.zoneName && o.zoneName !== '—') names.set(o.zoneId ?? o.zoneName, o.zoneName);
    });
    return [...names.values()];
  }, [orders]);

  const selectedRider = riders.find((r) => r.id === partnerId);

  const handleConfirm = async () => {
    if (!partnerId) return;
    setSubmitting(true);
    setError(null);
    try {
      const assignment = await dispatchService.assign({
        deliveryIds: orders.map((o) => o.id),
        partnerId,
      });
      onAssigned(assignment.reference);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to assign orders');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Assign ${orders.length} Order${orders.length === 1 ? '' : 's'}`} size="lg">
      <div className="space-y-4">
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Selected Orders
          </h3>
          <ul className="max-h-32 space-y-1 overflow-y-auto rounded-md border border-gray-200 p-3 text-sm dark:border-gray-700">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3">
                <span className="font-medium text-gray-800 dark:text-gray-100">{o.orderId}</span>
                <span className="truncate text-xs text-gray-500">{o.sellerName}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Delivery Zone
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-200">
            {zones.length > 0 ? zones.join(' / ') : 'No zone assigned'}
          </p>
        </section>

        <section>
          <SelectField
            label="Select Rider"
            value={partnerId}
            onChange={(e) => setPartnerId(e.target.value)}
            placeholder={ridersLoading ? 'Loading riders…' : 'Select a rider'}
            disabled={ridersLoading}
            options={riders.map((r) => ({
              value: r.id,
              label: `${r.name} — ${r.vehicleType ?? 'rider'}`,
            }))}
          />
          {ridersLoading && (
            <p className="mt-1 text-xs text-gray-500">Loading available riders…</p>
          )}
          {!ridersLoading && riders.length === 0 && (
            <p className="mt-1 text-xs text-amber-600">
              No available riders right now.
            </p>
          )}
        </section>

        {selectedRider && (
          <div className="flex flex-wrap items-center gap-2 rounded-md bg-gray-50 p-3 text-xs dark:bg-gray-800">
            <StatusBadge label={selectedRider.status ?? 'available'} />
            <span className="text-gray-600 dark:text-gray-300">
              Active assignments: {selectedRider.activeDeliveries ?? 0}
            </span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-600 dark:text-gray-300">
              Capacity: {selectedRider.maxActiveAssignments ?? 3}
            </span>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            loading={submitting}
            disabled={!partnerId || ridersLoading || orders.length === 0}
          >
            {submitting ? 'Assigning…' : 'Assign Orders'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
