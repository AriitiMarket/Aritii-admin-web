// Permission constants for Locations & Expansion module

export const PERMISSION_MODULES: Record<string, string> = {
  locations: 'Locations',
  zones: 'Delivery Zones',
  routes: 'Delivery Routes',
  expansion: 'Expansion',
  users: 'Users',
  roles: 'Roles & Permissions',
  admins: 'Administrators',
  content: 'Content',
  commerce: 'Commerce',
  settings: 'Settings',
  audit: 'Audit Logs',
};

export const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  'locations.view': 'View locations',
  'locations.create': 'Create locations',
  'locations.update': 'Update locations',
  'locations.activate': 'Activate locations',
  'locations.deactivate': 'Deactivate locations',
  'locations.delete': 'Delete locations',
  'locations.manage_expansion': 'Manage expansion plans',
  'zones.view': 'View delivery zones',
  'zones.create': 'Create delivery zones',
  'zones.update': 'Update delivery zones',
  'zones.activate': 'Activate delivery zones',
  'zones.deactivate': 'Deactivate delivery zones',
  'zones.delete': 'Delete delivery zones',
  'zones.manage_boundaries': 'Manage zone boundaries',
  'routes.view': 'View delivery routes',
  'routes.create': 'Create delivery routes',
  'routes.update': 'Update delivery routes',
  'routes.activate': 'Activate delivery routes',
  'routes.deactivate': 'Deactivate delivery routes',
  'routes.delete': 'Delete delivery routes',
  'routes.assign_provider': 'Assign providers to routes',
  'expansion.view': 'View expansion plans',
  'expansion.create': 'Create expansion plans',
  'expansion.approve': 'Approve expansion plans',
  'expansion.activate': 'Activate expansion plans',
  'expansion.suspend': 'Suspend expansion plans',
};

export const LOCATION_PERMISSIONS = {
  VIEW: 'locations.view',
  CREATE: 'locations.create',
  UPDATE: 'locations.update',
  ACTIVATE: 'locations.activate',
  DEACTIVATE: 'locations.deactivate',
  DELETE: 'locations.delete',
  MANAGE_EXPANSION: 'locations.manage_expansion',
} as const;

export const ZONE_PERMISSIONS = {
  VIEW: 'zones.view',
  CREATE: 'zones.create',
  UPDATE: 'zones.update',
  ACTIVATE: 'zones.activate',
  DEACTIVATE: 'zones.deactivate',
  DELETE: 'zones.delete',
  MANAGE_BOUNDARIES: 'zones.manage_boundaries',
} as const;

export const ROUTE_PERMISSIONS = {
  VIEW: 'routes.view',
  CREATE: 'routes.create',
  UPDATE: 'routes.update',
  ACTIVATE: 'routes.activate',
  DEACTIVATE: 'routes.deactivate',
  DELETE: 'routes.delete',
  ASSIGN_PROVIDER: 'routes.assign_provider',
} as const;

export const EXPANSION_PERMISSIONS = {
  VIEW: 'expansion.view',
  CREATE: 'expansion.create',
  APPROVE: 'expansion.approve',
  ACTIVATE: 'expansion.activate',
  SUSPEND: 'expansion.suspend',
} as const;

const allLocationPermissions = Object.values(LOCATION_PERMISSIONS);
const allZonePermissions = Object.values(ZONE_PERMISSIONS);
const allRoutePermissions = Object.values(ROUTE_PERMISSIONS);
const allExpansionPermissions = Object.values(EXPANSION_PERMISSIONS);

export const PERMISSION_MAPPING = {
  SUPER_ADMIN: [
    ...allLocationPermissions,
    ...allZonePermissions,
    ...allRoutePermissions,
    ...allExpansionPermissions,
  ],
  RIDER_ADMIN: [
    LOCATION_PERMISSIONS.VIEW,
    ZONE_PERMISSIONS.VIEW,
    ROUTE_PERMISSIONS.VIEW,
  ],
} as const;

export function hasPermission(userRole: string, permission: string): boolean {
  const rolePermissions: readonly string[] =
    PERMISSION_MAPPING[userRole as keyof typeof PERMISSION_MAPPING] || [];
  return rolePermissions.includes(permission);
}

export function hasAnyPermission(userRole: string, permissions: string[]): boolean {
  return permissions.some((perm) => hasPermission(userRole, perm));
}