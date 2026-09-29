// Permission constants for the Delivery & Logistics module (canonical catalogue:
// they must match the keys Identity actually grants, e.g. locations.* / delivery.*).
//
// NOTE: the previous draft added fine-grained keys (zones.*, routes.*, expansion.*)
// that never existed in the Identity catalogue, so granting them was a no-op and
// the Delivery module could only ever be fully open or fully closed. These
// exports now mirror the canonical catalogue exactly.

export const PERMISSION_MODULES: Record<string, string> = {
  dashboard: 'Dashboard',
  users: 'Users',
  roles: 'Roles & Permissions',
  admins: 'Administrators',
  businesses: 'Businesses',
  shops: 'Shops',
  delivery: 'Delivery',
  locations: 'Locations',
  commerce: 'Commerce',
  orders: 'Orders',
  disputes: 'Disputes',
  reports: 'Reports & Analytics',
  audit: 'Audit Logs',
  settings: 'Settings',
};

// Canonical keys — labels mirror the Identity catalogue descriptions.
export const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  // Locations & expansion
  'locations.view': 'View locations',
  'locations.manage': 'Manage locations',
  'delivery.view': 'View delivery',
  'delivery.manage': 'Manage delivery',
  'admin_roles.view': 'View admin roles',
  'admin_roles.manage': 'Manage admin roles',
  'orders.view': 'View orders',
  'orders.manage': 'Manage orders',
  'disputes.view': 'View disputes',
  'disputes.manage': 'Manage disputes',
  'businesses.view': 'View businesses',
  'businesses.manage': 'Manage businesses',
  'shops.view': 'View shops',
  'shops.manage': 'Manage shops',
  'commerce.view': 'View commerce',
  'commerce.manage': 'Manage commerce',
  'audit.view': 'View audit logs',
  'audit.manage': 'Clear audit logs',
  'platform_settings.view': 'View platform settings',
  'platform_settings.manage': 'Manage platform settings',
  'reports.view': 'View reports',
};

// Coarse typed permissions used to render role forms.
export const LOCATION_PERMISSIONS = {
  VIEW: 'locations.view',
  MANAGE: 'locations.manage',
} as const;

export const DELIVERY_PERMISSIONS = {
  VIEW: 'delivery.view',
  MANAGE: 'delivery.manage',
} as const;
