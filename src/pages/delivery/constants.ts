// Constants for Delivery & Logistics module

export const DELIVERY_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'reassigned', label: 'Reassigned' },
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
  pending: ['assigned', 'cancelled'],
  assigned: ['pickup', 'cancelled', 'reassigned'],
  pickup: ['in_transit', 'cancelled'],
  in_transit: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'failed'],
  delivered: [],
  failed: ['pending', 'cancelled'],
  cancelled: [],
  reassigned: ['pending'],
};

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
  assigned: 'bg-blue-100 text-blue-800',
  pickup: 'bg-cyan-100 text-cyan-800',
  in_transit: 'bg-indigo-100 text-indigo-800',
  out_for_delivery: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-300 text-gray-900',
  reassigned: 'bg-amber-100 text-amber-800',
};

export const BULK_ACTIONS = [
  { value: '', label: 'Select Action' },
  { value: 'activate', label: 'Set Available' },
  { value: 'set-busy', label: 'Set Busy' },
  { value: 'deactivate', label: 'Suspend' },
];