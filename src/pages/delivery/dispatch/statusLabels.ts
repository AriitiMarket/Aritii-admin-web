// Display helpers for the multi-order assignment workflow.
//
// The backend stores terse snake_case statuses; the admin UI speaks the
// product vocabulary (Ready for Pickup, Waiting for Acceptance, ...).

import type { AssignmentStatus, OrderDeliveryStatus } from '@/services/dispatch.service';
import type { StatusVariant } from '@/components/common/StatusBadge';

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  waiting_acceptance: 'Waiting for Acceptance',
  accepted: 'Accepted',
  picking_up: 'Picking Up',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  completed: 'Completed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export const ASSIGNMENT_STATUS_VARIANTS: Record<AssignmentStatus, StatusVariant> = {
  waiting_acceptance: 'warning',
  accepted: 'info',
  picking_up: 'warning',
  picked_up: 'warning',
  in_transit: 'info',
  completed: 'success',
  rejected: 'danger',
  cancelled: 'danger',
};

/** Per-order status vocabulary (section 12 of the workflow). */
export const ORDER_STATUS_LABELS: Record<OrderDeliveryStatus, string> = {
  pending: 'Ready for Pickup',
  assigned: 'Assigned',
  pickup: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  failed: 'Failed',
  cancelled: 'Cancelled',
  reassigned: 'Reassigned',
};

export const ORDER_STATUS_VARIANTS: Record<OrderDeliveryStatus, StatusVariant> = {
  pending: 'neutral',
  assigned: 'info',
  pickup: 'warning',
  in_transit: 'info',
  delivered: 'success',
  failed: 'danger',
  cancelled: 'danger',
  reassigned: 'warning',
};

export const ASSIGNMENT_STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  ...(Object.keys(ASSIGNMENT_STATUS_LABELS) as AssignmentStatus[]).map((value) => ({
    value,
    label: ASSIGNMENT_STATUS_LABELS[value],
  })),
];

export function assignmentStatusLabel(status?: string): string {
  return status && status in ASSIGNMENT_STATUS_LABELS
    ? ASSIGNMENT_STATUS_LABELS[status as AssignmentStatus]
    : (status ?? '—');
}

export function orderStatusLabel(status?: string): string {
  return status && status in ORDER_STATUS_LABELS
    ? ORDER_STATUS_LABELS[status as OrderDeliveryStatus]
    : (status ?? '—');
}

/** Statuses an admin may still reassign or cancel. */
export const REASSIGNABLE_STATUSES: AssignmentStatus[] = [
  'waiting_acceptance',
  'accepted',
  'picking_up',
  'picked_up',
  'in_transit',
];

export function isReassignable(status?: string): boolean {
  return !!status && REASSIGNABLE_STATUSES.includes(status as AssignmentStatus);
}

/**
 * Roll individual order statuses up into the single line the admin sees under
 * the order list, e.g. "In Progress — 2 of 3 delivered".
 */
export function summariseProgress(statuses: OrderDeliveryStatus[]): {
  label: string;
  variant: StatusVariant;
  delivered: number;
  total: number;
} {
  const total = statuses.length;
  const delivered = statuses.filter((s) => s === 'delivered').length;
  if (total > 0 && delivered === total) {
    return { label: 'Completed', variant: 'success', delivered, total };
  }
  if (statuses.some((s) => s === 'in_transit')) {
    return {
      label: `In Progress — ${delivered}/${total} delivered`,
      variant: 'info',
      delivered,
      total,
    };
  }
  if (statuses.some((s) => s === 'pickup')) {
    return {
      label: `Picked Up — ${delivered}/${total} delivered`,
      variant: 'warning',
      delivered,
      total,
    };
  }
  return { label: `Not started — 0/${total} delivered`, variant: 'neutral', delivered, total };
}
