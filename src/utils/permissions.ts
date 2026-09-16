/**
 * Permission helpers — frontend UI control only. The backend stays the source of truth.
 */
import { useAuth } from '@/hooks/useAuth';

/** All defined permission keys in the system. */
export const ALL_PERMISSIONS = [
  'dashboard.view',
  'users.view', 'users.manage',
  'businesses.view', 'businesses.manage',
  'shops.view', 'shops.manage',
  'locations.view', 'locations.manage',
  'commerce.view', 'commerce.manage',
  'orders.view', 'orders.manage',
  'delivery.view', 'delivery.manage',
  'disputes.view', 'disputes.manage',
  'reports.view',
  'audit.view',
  'platform_settings.view', 'platform_settings.manage',
  'admin_roles.view', 'admin_roles.manage',
] as const;

export type Permission = typeof ALL_PERMISSIONS[number];

/** Permission descriptions for display. */
export const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  'dashboard.view': 'View the admin dashboard and overview stats',
  'users.view': 'View user accounts and profiles',
  'users.manage': 'Create, update, suspend, or ban users',
  'businesses.view': 'View seller businesses and applications',
  'businesses.manage': 'Approve, reject, or suspend seller businesses',
  'shops.view': 'View shops and their details',
  'shops.manage': 'Approve, reject, or suspend shops',
  'locations.view': 'View locations, sectors, and zones',
  'locations.manage': 'Create, update, or delete locations and zones',
  'commerce.view': 'View products, categories, and commerce overview',
  'commerce.manage': 'Manage products, categories, and promotions',
  'orders.view': 'View orders and transaction history',
  'orders.manage': 'Update order statuses and process refunds',
  'delivery.view': 'View delivery operations and rider stats',
  'delivery.manage': 'Manage riders, assignments, and delivery zones',
  'disputes.view': 'View disputes and complaints',
  'disputes.manage': 'Resolve, reject, or close disputes',
  'reports.view': 'View analytics reports and data exports',
  'audit.view': 'View the audit log trail',
  'platform_settings.view': 'View platform configuration',
  'platform_settings.manage': 'Update platform configuration',
  'admin_roles.view': 'View admin roles and permissions',
  'admin_roles.manage': 'Create, update, or delete admin roles',
};

/** Permission module grouping for display. */
export const PERMISSION_MODULES: Record<string, string> = {
  dashboard: 'Dashboard',
  users: 'Users',
  businesses: 'Businesses',
  shops: 'Shops',
  locations: 'Locations',
  commerce: 'Commerce',
  orders: 'Orders',
  delivery: 'Delivery',
  disputes: 'Disputes',
  reports: 'Reports',
  audit: 'Audit',
  settings: 'Platform Settings',
  admin_roles: 'Admin Roles',
};

/**
 * Check if a permission list contains a specific permission.
 * Super admins with '*' permission have access to everything.
 */
export function hasPermission(permissions: string[], permission: string): boolean {
  return permissions.includes('*') || permissions.includes(permission);
}

/**
 * Check if any of the given permissions are present.
 */
export function hasAnyPermission(permissions: string[], ...checkPermissions: string[]): boolean {
  if (permissions.includes('*')) return true;
  return checkPermissions.some(p => permissions.includes(p));
}

/**
 * Hook to check current user's permissions.
 */
export function usePermissions() {
  const { user } = useAuth();
  const permissions = (user as any)?.permissions || [];

  return {
    permissions,
    has: (permission: string) => hasPermission(permissions, permission),
    hasAny: (...checkPermissions: string[]) => hasAnyPermission(permissions, ...checkPermissions),
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
  };
}
