// Constants for Locations & Expansion module

export const LOCATION_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'country', label: 'Country' },
  { value: 'region', label: 'Region' },
  { value: 'city', label: 'City' },
  { value: 'town', label: 'Town' },
  { value: 'area', label: 'Area' },
  { value: 'sector', label: 'Sector' },
  { value: 'community', label: 'Community' },
  { value: 'village', label: 'Village' },
  { value: 'rural', label: 'Rural' },
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
  { value: 'hub', label: 'Hubs Only' },
  { value: 'non-hub', label: 'Non-Hubs' },
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
  town: '🏘️ Town',
  area: '🗺️ Area',
  sector: '📐 Sector',
  community: '👥 Community',
  village: '🏡 Village',
  rural: '🌾 Rural',
  other: '📌 Other',
};

export const LOCATION_TYPE_COLORS: Record<string, string> = {
  country: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  region: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  city: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  town: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  area: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  sector: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  community: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  village: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
  rural: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
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