// Constants for Locations & Expansion module

// MVP geography: Region (optional) -> City. Zone and Port are separate models
// (coverage area / known local point) and never location types.
export const LOCATION_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'country', label: 'Country' },
  { value: 'region', label: 'Region' },
  { value: 'city', label: 'City' },
  { value: 'other', label: 'Other' },
];

export const LOCATION_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export const SERVICEABILITY_FILTERS = [
  { value: '', label: 'All' },
  { value: 'serviceable', label: 'Serviceable' },
  { value: 'non-serviceable', label: 'Non-Serviceable' },
];

export const HUB_FILTERS = [
  { value: '', label: 'All' },
  { value: 'port', label: 'Ports Only' },
  { value: 'non-port', label: 'Non-Ports' },
];

export const EXPANSION_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'planned', label: 'Planned' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'testing', label: 'Testing' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'closed', label: 'Closed' },
];

export const LOCATION_TYPE_LABELS: Record<string, string> = {
  country: '🌍 Country',
  region: '📍 Region',
  city: '🏙️ City',
  other: '📌 Other',
};

export const LOCATION_TYPE_COLORS: Record<string, string> = {
  country: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  region: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  city: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

export const EXPANSION_STATUS_COLORS: Record<string, string> = {
  planned: 'bg-gray-100 text-gray-800',
  preparing: 'bg-blue-100 text-blue-800',
  testing: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-orange-100 text-orange-800',
  closed: 'bg-red-100 text-red-800',
};

export const EXPANSION_STATUS_LABELS: Record<string, string> = {
  planned: 'Planned',
  preparing: 'Preparing',
  testing: 'Testing',
  active: 'Active',
  suspended: 'Suspended',
  closed: 'Closed',
};