// Helper functions for status colors and labels

import {
  DELIVERY_STATUS_COLORS,
  DELIVERY_STATUSES,
  VALID_TRANSITIONS,
} from '../constants';

export function getDeliveryStatusColor(status: string): string {
  return DELIVERY_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
}

/**
 * The ONE display label for a delivery status.
 *
 * Every page must render the canonical vocabulary from `DELIVERY_STATUSES`
 * (the Delivery Service contract) — never a page-local map and never raw
 * snake_case — so the same backend value reads the same everywhere.
 */
export function getDeliveryStatusLabel(status?: string | null): string {
  if (!status) return '—';
  const entry = DELIVERY_STATUSES.find((s) => s.value === status);
  return entry?.label ?? status.replace(/_/g, ' ');
}

/**
 * The readable delivery reference shown everywhere an id used to be.
 *
 * Prefers a human reference (`DEL-1001`, assigned by the Delivery Service);
 * otherwise falls back to a readable short form of the document id instead of
 * dumping a raw ObjectId on the operator. The full id stays available as a
 * tooltip for support.
 */
export function getDeliveryRef(delivery?: {
  deliveryRef?: string | null;
  orderId?: string | null;
  id?: string | null;
  _id?: string | null;
} | null): string {
  if (!delivery) return '—';
  if (delivery.deliveryRef) return delivery.deliveryRef;
  if (delivery.orderId) return `Order ${delivery.orderId}`;
  const raw = delivery.id ?? delivery._id ?? '';
  return raw ? `Delivery ${raw.slice(0, 6).toUpperCase()}` : '—';
}

/** The raw document id — tooltips and copy only, never a table cell. */
export function getDeliveryDocumentId(delivery?: {
  id?: string | null;
  _id?: string | null;
} | null): string {
  return delivery?.id ?? delivery?._id ?? '';
}

/** Full service transition table for a status — the raw material for the
 *  filtered manual actions below; not part of the module's public surface. */
function getValidTransitions(currentStatus: string): string[] {
  return VALID_TRANSITIONS[currentStatus] || [];
}

/**
 * Transitions the console may fire as one-click buttons.
 *
 * `VALID_TRANSITIONS` is the full service table and includes the steps the
 * assignment flow owns (`assigned`, `reassigned`) plus the requeue to `pending`
 * (the recovery step, offered only from `failed`). Manual buttons keep only what
 * an operator legitimately drives here.
 */
export function getManualTransitions(currentStatus: string): string[] {
  return getValidTransitions(currentStatus).filter((target) => {
    // `assigned` and `reassigned` are the assignment flow's own states: the
    // console hands a delivery to a rider through the assignment dialog, which
    // drives the transition itself. Offering the status as a bare button would
    // produce an "assigned" delivery with no provider and no assignment record.
    if (target === 'assigned' || target === 'reassigned') return false;
    // Requeue to the ready pool is the retry step, and only `failed` has one.
    // Anywhere else it silently releases a rider mid-job.
    if (target === 'pending') return currentStatus === 'failed';
    return true;
  });
}