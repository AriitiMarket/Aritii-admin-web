// Constants for Delivery & Logistics module
//
// The status vocabulary and the transition table are copies of the Delivery
// Service contract (`delivery-service/src/shared/constants/index.js`). They
// must stay in step with it: the console renders transitions from
// `VALID_TRANSITIONS`, and offering a transition the service refuses (or
// hiding one it allows) turns the screen into a guaranteed error.

export const DELIVERY_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Requested' },
  { value: 'validated', label: 'Validated' },
  { value: 'ready_for_pickup', label: 'Ready for Pickup' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'reassigned', label: 'Reassigned' },
  { value: 'pickup', label: 'Picked Up' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'arrived_at_hub', label: 'Arrived at Hub' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'return_requested', label: 'Return Requested' },
  { value: 'returned', label: 'Returned' },
];

export const RIDER_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'available', label: 'Available' },
  { value: 'busy', label: 'Busy' },
  { value: 'offline', label: 'Offline' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
];

export const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['validated', 'ready_for_pickup', 'assigned', 'failed', 'cancelled'],
  validated: ['ready_for_pickup', 'assigned', 'failed', 'cancelled'],
  ready_for_pickup: ['assigned', 'failed', 'cancelled'],
  assigned: ['pickup', 'reassigned', 'pending', 'failed', 'cancelled'],
  reassigned: ['assigned', 'pickup', 'pending', 'failed', 'cancelled'],
  pickup: ['in_transit', 'arrived_at_hub', 'out_for_delivery', 'assigned', 'reassigned', 'pending', 'failed', 'cancelled'],
  in_transit: ['arrived_at_hub', 'out_for_delivery', 'delivered', 'assigned', 'reassigned', 'pending', 'failed', 'cancelled'],
  arrived_at_hub: ['out_for_delivery', 'in_transit', 'delivered', 'assigned', 'pending', 'failed', 'cancelled'],
  out_for_delivery: ['delivered', 'assigned', 'failed', 'cancelled'],
  delivered: ['return_requested'],
  failed: ['pending', 'cancelled', 'return_requested'],
  cancelled: [],
  return_requested: ['returned'],
  returned: [],
};

/**
 * Statuses from which the console may create a NEW assignment
 * (`POST /delivery/assignment`): `assigned` must be a legal transition and no
 * active assignment can exist in these states. Mirrors the service's
 * `assertAssignable` + `VALID_TRANSITIONS`.
 */
export const ASSIGNABLE_STATUSES = ['pending', 'validated', 'ready_for_pickup', 'reassigned'];

/**
 * Statuses from which the console may hand the delivery to another rider
 * (`POST /delivery/assignment/reassign`). The reassign flow first moves the
 * delivery to `reassigned`, which the state machine only allows from these
 * states — offering it elsewhere (e.g. `arrived_at_hub`, `out_for_delivery`)
 * would fail with `INVALID_TRANSITION`.
 */
export const REASSIGNABLE_STATUSES = ['assigned', 'pickup', 'in_transit'];

/** Values accepted for a failed delivery's `nextAction` (service contract). */
export const FAILURE_NEXT_ACTIONS = [
  { value: '', label: 'No next action' },
  { value: 'retry', label: 'Retry delivery' },
  { value: 'reschedule', label: 'Reschedule' },
  { value: 'return', label: 'Return to sender' },
  { value: 'escalation', label: 'Escalate' },
];

export const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  busy: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  offline: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  suspended: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export const ACTOR_STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  busy: 'Busy',
  offline: 'Offline',
  pending: 'Pending',
  suspended: 'Suspended',
};

export const DELIVERY_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  validated: 'bg-teal-100 text-teal-800',
  ready_for_pickup: 'bg-lime-100 text-lime-800',
  assigned: 'bg-blue-100 text-blue-800',
  pickup: 'bg-cyan-100 text-cyan-800',
  in_transit: 'bg-indigo-100 text-indigo-800',
  arrived_at_hub: 'bg-sky-100 text-sky-800',
  out_for_delivery: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-300 text-gray-900',
  reassigned: 'bg-amber-100 text-amber-800',
  return_requested: 'bg-orange-100 text-orange-800',
  returned: 'bg-slate-200 text-slate-800',
};

export const BULK_ACTIONS = [
  { value: '', label: 'Select Action' },
  { value: 'activate', label: 'Set Available' },
  { value: 'set-busy', label: 'Set Busy' },
  { value: 'deactivate', label: 'Suspend' },
];