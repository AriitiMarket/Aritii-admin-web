/** Role helpers — frontend UI/route authorization only. The backend remains the source of truth. */
import type { AdminRole, LegacyUserType } from '@/types/auth';

export const ADMIN_ROLES: AdminRole[] = [
  'SUPER_ADMIN',
  'RIDER_ADMIN',
  'SELLER_ADMIN',
  'CUSTOMER_ADMIN',
];

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  RIDER_ADMIN: 'Rider Admin',
  SELLER_ADMIN: 'Seller Admin',
  CUSTOMER_ADMIN: 'Customer Admin',
};

/** Maps the legacy userType to an Aritii admin role. */
export function mapUserTypeToRole(userType: LegacyUserType): AdminRole {
  switch (userType) {
    case 'STAFF':
    case 'ADMIN':
      return 'SUPER_ADMIN';
    case 'VENDOR':
    case 'RESTAURANT':
      return 'SELLER_ADMIN';
    default:
      return 'SUPER_ADMIN';
  }
}

export function hasPermission(permissions: string[], permission: string): boolean {
  return permissions.includes('*') || permissions.includes(permission);
}