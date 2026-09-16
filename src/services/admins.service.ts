/** Admins service facade — uses identity admin + roles APIs. */
import type { AdminAccount, AdminRoleItem, AdminPermission, UserRolesResponse, UserRoleAssignment } from '@/types/admin';
import { identityAdmin, adminRolesApi } from '@/api/admin';

export const adminsService = {
  async list(): Promise<AdminAccount[]> {
    const result = await identityAdmin.listUsers(1, 200, '', 'ADMIN');
    return result.items as unknown as AdminAccount[];
  },

  async get(id: string): Promise<AdminAccount | null> {
    const user = await identityAdmin.getUser(id);
    return (user as any) || null;
  },

  async create(input: Omit<AdminAccount, 'id' | 'createdAt'>): Promise<AdminAccount> {
    return Promise.resolve(input as AdminAccount);
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
