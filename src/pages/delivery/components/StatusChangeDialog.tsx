import { useEffect, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { TextField } from '@/components/common/TextField';
import { SelectField } from '@/components/forms/SelectField';
import { CANCELLATION_OVERRIDE_FROM, FAILURE_NEXT_ACTIONS } from '../constants';
import { getDeliveryStatusLabel } from '../utils/statusHelpers';
import type { Delivery } from '../types';

const TEXTAREA_BASE =
  'w-full rounded-md border border-dark-border bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-dark focus:ring-1 focus:ring-primary-dark dark:border-dark-600 dark:bg-dark-900 dark:text-white';

/**
 * Collects the input a status change actually needs before the console fires
 * `PUT /delivery/delivery/:id/status`:
 *
 *  - `delivered` — optional proof (COD amount + recipient). Without it the
 *    service records an operator proof-override, so the fields are optional by
 *    design; with them the delivery closes out with real proof.
 *  - `failed`    — a reason (stored as `failureReason`) and the agreed
 *    `nextAction` (retry / reschedule / escalation).
 *  - `cancelled` — a reason (stored as `cancellationReason`); cancelling a
 *    delivery that is already `in_transit` needs the administrative `override`
 *    flag or the service answers `OVERRIDE_REQUIRED`.
 *  - anything else — an optional note, sent as `note`.
 *
 * The parent performs the API call and passes its busy/error state back in.
 */
export function StatusChangeDialog({
  open,
  delivery,
  nextStatus,
  busy = false,
  error,
  onClose,
  onConfirm,
}: {
  open: boolean;
  delivery: Pick<Delivery, 'id' | 'orderId' | 'status' | 'paymentMethod' | 'paymentAmount'> | null;
  nextStatus: string;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (extra: Record<string, unknown>) => void;
}) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [codAmount, setCodAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [override, setOverride] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const isCod = delivery?.paymentMethod === 'COD';

  // Reset every time a new change is requested.
  useEffect(() => {
    if (!open) return;
    setReason('');
    setNote('');
    setNextAction('');
    setCodAmount(
      delivery?.paymentMethod === 'COD' && typeof delivery?.paymentAmount === 'number'
        ? String(delivery.paymentAmount)
        : ''
    );
    setRecipient('');
    setOverride(false);
    setLocalError(null);
  }, [open, delivery?.id, delivery?.paymentMethod, delivery?.paymentAmount]);

  if (!open || !delivery || !nextStatus) return null;

  const isFailed = nextStatus === 'failed';
  const isCancelled = nextStatus === 'cancelled';
  const isDelivered = nextStatus === 'delivered';
  // The service refuses a plain cancel once the rider is on the customer leg:
  // the parcel is out of the seller's hands, so cancelling needs an audited
  // decision. Mirrors the service's CANCELLATION_OVERRIDE_FROM.
  const needsOverride = isCancelled && CANCELLATION_OVERRIDE_FROM.includes(delivery.status || '');

  const submit = () => {
    setLocalError(null);
    const extra: Record<string, unknown> = {};

    if ((isFailed || isCancelled) && !reason.trim()) {
      setLocalError('A reason is required for this change.');
      return;
    }
    if (isFailed) {
      extra.reason = reason.trim();
      if (nextAction) extra.nextAction = nextAction;
    } else if (isCancelled) {
      extra.reason = reason.trim();
      if (needsOverride) extra.override = true;
    }
    if (isDelivered) {
      const proof: Record<string, unknown> = {};
      if (isCod && codAmount.trim() !== '' && Number.isFinite(Number(codAmount))) {
        proof.codConfirmed = true;
        proof.codCollectedAmount = Number(codAmount);
      }
      if (recipient.trim()) proof.recipientName = recipient.trim();
      if (Object.keys(proof).length > 0) {
        proof.confirmedAt = new Date().toISOString();
        extra.proofOfDelivery = proof;
      }
    }
    if (note.trim()) extra.note = note.trim();

    onConfirm(extra);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${getDeliveryStatusLabel(nextStatus)} — order ${delivery.orderId}`}
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Current status:{' '}
          <span className="font-medium text-gray-800 dark:text-gray-100">
            {getDeliveryStatusLabel(delivery.status || '')}
          </span>
        </p>

        {isFailed && (
          <>
            <TextField
              label="Reason"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why did the delivery fail?"
              disabled={busy}
            />
            <SelectField
              label="Next action"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              options={FAILURE_NEXT_ACTIONS}
              disabled={busy}
            />
          </>
        )}

        {isCancelled && (
          <TextField
            label="Reason"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this delivery being cancelled?"
            disabled={busy}
          />
        )}

        {needsOverride && (
          <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={override}
              onChange={(e) => setOverride(e.target.checked)}
              disabled={busy}
              className="mt-0.5"
            />
            <span>
              Administrative override — the delivery is already in transit and can
              no longer be cancelled without one.
            </span>
          </label>
        )}

        {isDelivered && (
          <>
            {isCod && (
              <TextField
                label="Cash collected (ETB)"
                type="number"
                step="0.01"
                value={codAmount}
                onChange={(e) => setCodAmount(e.target.value)}
                placeholder={String(delivery.paymentAmount ?? '')}
                disabled={busy}
              />
            )}
            <TextField
              label="Received by"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Name of the person who received it"
              disabled={busy}
            />
            <p className="text-xs text-gray-500">
              Leaving the proof fields empty completes the delivery as an
              operator override, recorded on the delivery and in the audit log.
            </p>
          </>
        )}

        {!isFailed && !isCancelled && (
          <div className="flex flex-col">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Note
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Optional note for the delivery history"
              disabled={busy}
              className={TEXTAREA_BASE}
            />
          </div>
        )}

        {needsOverride && !override && (
          <p className="text-xs text-amber-700">The override confirmation is required.</p>
        )}
        {(localError || error) && (
          <p className="text-sm text-red-600">{localError || error}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={submit}
            disabled={busy || (needsOverride && !override)}
          >
            {busy ? 'Applying…' : `Change to ${getDeliveryStatusLabel(nextStatus)}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default StatusChangeDialog;
