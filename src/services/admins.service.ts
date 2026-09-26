/** Admins service facade — uses identity admin + roles APIs. */
import type { AdminAccount, AdminRoleItem, AdminPermission, UserRolesResponse, UserRoleAssignment } from '@/types/admin';
import { ApiError } from '@/types/api';
import { identityAdmin, adminRolesApi } from '@/api/admin';

export const adminsService = {
  async list(): Promise<AdminAccount[]> {
    const result = await identityAdmin.listUsers(1, 200, '', 'ADMIN');
    return result.items as unknown as AdminAccount[];
  },

  async get(id: string): Promise<AdminAccount | null> {
    const user = await identityAdmin.getUser(id);
    // getUser returns the identity user profile, which is wider than the console's
    // AdminAccount view model; the caller reads it as an AdminAccount.
    return (user as unknown as AdminAccount | null) || null;
  },

  /**
   * Admin provisioning is NOT implemented by the backend.
   *
   * `POST /auth/register` creates CUSTOMER accounts only (identity
   * `authService.registerCustomer`) and there is no admin-create endpoint, so
   * this must not report a fake success. To give a person admin access today,
   * create/normalise the account and then grant the role through
   * `PUT /admin/users/:id/role`.
   *
   * Replace this body with the real call once an endpoint exists.
   */
  async create(_input: Omit<AdminAccount, 'id' | 'createdAt'>): Promise<AdminAccount> {
    throw new ApiError(
      501,
      'Creating admins is not supported by the API yet. Add the account, then grant it the ADMIN role.',
      'NOT_IMPLEMENTED'
    );
  },

  // ── Roles ──
  async listRoles(): Promise<AdminRoleItem[]> {
    return adminRolesApi.listRoles();
  },

  async getRole(id: string): Promise<AdminRoleItem> {
    return adminRolesApi.getRole(id);
  },

  async createRole(data: { name: string; displayName: string; description?: string; permissions?: string[] }): Promise<AdminRoleItem> {
    return adminRolesApi.createRole(data);
  },

  async updateRole(id: string, data: { displayName?: string; description?: string; permissions?: string[] }): Promise<AdminRoleItem> {
    return adminRolesApi.updateRole(id, data);
  },

  async deleteRole(id: string): Promise<boolean> {
    return adminRolesApi.deleteRole(id);
  },

  // ── Permissions ──
  async listPermissions(): Promise<AdminPermission[]> {
    return adminRolesApi.listPermissions();
  },

  async listPermissionsByModule(): Promise<Record<string, AdminPermission[]>> {
    return adminRolesApi.listPermissionsByModule();
  },

  // ── User-Role Assignments ──
  async getAllUserRoles(): Promise<UserRoleAssignment[]> {
    return adminRolesApi.getAllUserRoles();
  },

  async getUserRoles(userId: string): Promise<UserRolesResponse> {
    return adminRolesApi.getUserRoles(userId);
  },

  async getUserPermissions(userId: string): Promise<string[]> {
    return adminRolesApi.getUserPermissions(userId);
  },

  async assignRole(userId: string, roleId: string): Promise<boolean> {
    return adminRolesApi.assignRole(userId, roleId);
  },

  async removeRole(userId: string, roleId: string): Promise<boolean> {
    return adminRolesApi.removeRole(userId, roleId);
  },
};
