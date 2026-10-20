/** Role helpers — frontend UI/route authorization only. The backend remains the source of truth. */
import type { AdminRole, LegacyUserType } from '@/types/auth';

export const ADMIN_ROLES: AdminRole[] = [
  'SUPER_ADMIN',
  'OPERATIONS_ADMIN',
];

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: 'Super Administrator',
  OPERATIONS_ADMIN: 'Operations Administrator',
};

/** Maps the legacy userType to an Aritii admin role. */
export function mapUserTypeToRole(userType: LegacyUserType): AdminRole {
  switch (userType) {
    case 'STAFF':
    case 'ADMIN':
      return 'SUPER_ADMIN';
    case 'VENDOR':
    case 'RESTAURANT':
    default:
      return 'OPERATIONS_ADMIN';
  }
}

export function hasPermission(permissions: string[], permission: string): boolean {
  return permissions.includes('*') || permissions.includes(permission);
}