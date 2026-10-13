// Constants for Delivery & Logistics module
//
// The status vocabulary and the transition table are copies of the Delivery
// Service contract (`delivery-service/src/shared/constants/index.js`). They
// must stay in step with it: the console renders transitions from
// `VALID_TRANSITIONS`, and offering a transition the service refuses (or
// hiding one it allows) turns the screen into a guaranteed error.
//
// They are duplicated rather than imported because this is a separate
// application from the service. Every duplicate below names its source, and
// `deliveryLifecycleParity.test.ts` asserts the two lists still agree, so a
// change on either side that is not mirrored fails the build instead of
// silently shipping a status the API will reject.

/**
 * The canonical delivery lifecycle, in forward order.
 *
 * The backend contract (`delivery-service` `DELIVERY_STATUSES`) defines the
 * persisted states; these labels are the ONE display vocabulary for the whole
 * console. Every page renders these — never raw snake_case, never an invented
 * synonym ("Shipping", "On Road", "Completed", "Processing", …).
 *
 * Only states that some flow can actually produce are listed. The service used
 * to also carry `validated`, `ready_for_pickup`, `out_for_delivery`,
 * `return_requested` and `returned`: no dispatch, assignment, batch or admin
 * flow could ever write them, yet the console rendered them and offered
 * "Ready for Pickup" as the main forward action — a button that moved the
 * delivery out of the only pool dispatch looks at (`pending`), so the delivery
 * vanished from Ready Orders and could no longer be assigned to anyone.
 */
export const DELIVERY_STATUSES = [
  { value: 'pending', label: 'Requested' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'reassigned', label: 'Reassigned' },
  { value: 'pickup', label: 'Picked Up' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

/**
 * The statuses the Admin works with as filters, in forward order.
 *
 * Identical to the canonical list: with the unreachable states gone, every real
 * status is something an operator can act on, so there is no longer a reason to
 * maintain a second, shorter list that drifts from the contract.
 */
export const ADMIN_DELIVERY_STATUS_FILTERS = [
  { value: '', label: 'All Statuses' },
  ...DELIVERY_STATUSES.map((s) => ({ value: s.value as string, label: s.label })),
];

/**
 * Nothing further may happen to these deliveries — no rider, no status change.
 * Mirrors the service's BLOCKED group, and is the ONE terminal/exceptional set
 * in the console (it used to be spelled out three different ways across the
 * module, disagreeing on whether `return_requested` counted).
 */
export const BLOCKED_DELIVERY_STATUSES = ['delivered', 'failed', 'cancelled'];

/**
 * No transition ever leaves these. `failed` is BLOCKED but not TERMINAL: the
 * retry requeue is its one way out, so treating it as terminal would strand
 * every failed delivery.
 */
export const TERMINAL_DELIVERY_STATUSES = ['delivered', 'cancelled'];

/** Exceptional / terminal outcomes — flagged separately in the UI. */
export const EXCEPTIONAL_DELIVERY_STATUSES = BLOCKED_DELIVERY_STATUSES;

export const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['assigned', 'failed', 'cancelled'],
  assigned: ['pickup', 'reassigned', 'pending', 'failed', 'cancelled'],
  reassigned: ['assigned', 'pickup', 'pending', 'failed', 'cancelled'],
  pickup: ['in_transit', 'assigned', 'reassigned', 'pending', 'failed', 'cancelled'],
  in_transit: ['delivered', 'assigned', 'reassigned', 'pending', 'failed', 'cancelled'],
  delivered: [],
  failed: ['pending', 'cancelled'],
  cancelled: [],
};

/**
 * Statuses from which the console may hand the delivery to another rider
 * (`POST /delivery/assignment/reassign`). The reassign flow first moves the
 * delivery to `reassigned`, which the state machine only allows from these
 * states — offering it elsewhere (e.g. `in_transit` after the rider is at the
 * door) would fail with `INVALID_TRANSITION`.
 */
export const REASSIGNABLE_STATUSES = ['assigned', 'pickup', 'in_transit'];

/** Values accepted for a failed delivery's `nextAction` (service contract). */
export const FAILURE_NEXT_ACTIONS = [
  { value: '', label: 'No next action' },
  { value: 'retry', label: 'Retry delivery' },
  { value: 'reschedule', label: 'Reschedule' },
  { value: 'escalation', label: 'Escalate' },
];

/**
 * Cancelling from these statuses needs an explicit administrative override or
 * the service answers `OVERRIDE_REQUIRED` (delivery-service
 * `CANCELLATION_OVERRIDE_FROM`). Mirrored so the dialog can offer the checkbox
 * before the operator submits, instead of surfacing a 409 after the fact.
 */
export const CANCELLATION_OVERRIDE_FROM = ['in_transit'];

export const DELIVERY_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  assigned: 'bg-blue-100 text-blue-800',
  reassigned: 'bg-amber-100 text-amber-800',
  pickup: 'bg-cyan-100 text-cyan-800',
  in_transit: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-300 text-gray-900',
};