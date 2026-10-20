import { http } from '@/services/client/httpClient';
import { isApiError } from '@/types/api';

/** Query parameters accepted by the roles/permissions endpoints. */
export type RolesPermissionsParams = Record<
  string,
  string | number | boolean | null | undefined
>;

/** A single permission the console can grant to a role. */
export interface Permission {
  _id: string;
  id: string;
  name: string;
  description?: string;
  module?: string;
  action?: string;
}

/** A role as returned by the admin roles API. */
export interface Role {
  _id: string;
  id: string;
  name: string;
  description: string;
  permissions?: string[];
  usersCount?: number;
}

/** Payload accepted when creating or updating a role. */
export type RoleInput = {
  name: string;
  description?: string;
  permissions: string[];
};

/** Permissions grouped by the module they belong to. */
export type PermissionsByModule = Record<string, Permission[]>;

/** Admin scope assigned to a console user. */
export type AdminScope = Record<string, unknown>;

class RolesPermissionsService {
  /** The server's message for a failed call, or a generic fallback. */
  private static reason(err: unknown, fallback: string): string {
    if (isApiError(err) && err.message) return err.message;
    if (err instanceof Error && err.message) return err.message;
    return fallback;
  }

  /**
   * Get all permissions
   * @param params - Query params
   */
  async getPermissions(
    params: RolesPermissionsParams = {}
  ): Promise<{ permissions: Permission[]; total: number }> {
    try {
      const data = await http.get<{
        permissions?: Permission[];
        total?: number;
      }>('/admin/permissions', { params });
      return {
        permissions: data?.permissions || [],
        total: data?.total || 0,
      };
    } catch (err) {
      throw new Error(
        `Failed to fetch permissions: ${RolesPermissionsService.reason(err, 'Unknown error')}`
      );
    }
  }

  /**
   * Get permissions grouped by module
   */
  async getPermissionsByModule(): Promise<PermissionsByModule> {
    try {
      // The service answers `ok(res, { permissions })`, where `permissions` is
      // the map keyed by module — there is no `modules` key.
      const data = await http.get<{ permissions?: PermissionsByModule }>(
        '/admin/permissions/by-module'
      );
      return data?.permissions || {};
    } catch (err) {
      throw new Error(
        `Failed to fetch permissions by module: ${RolesPermissionsService.reason(err, 'Unknown error')}`
      );
    }
  }

  /**
   * Get all roles
   * @param params - Query params
   */
  async getRoles(
    params: RolesPermissionsParams = {}
  ): Promise<{ roles: Role[]; total: number }> {
    try {
      const data = await http.get<{ roles?: Role[]; total?: number }>(
        '/admin/roles',
        { params }
      );
      return {
        roles: data?.roles || [],
        total: data?.total || 0,
      };
    } catch (err) {
      throw new Error(
        `Failed to fetch roles: ${RolesPermissionsService.reason(err, 'Unknown error')}`
      );
    }
  }

  /**
   * Get single role details
   * @param roleId - Role ID
   */
  async getRole(roleId: string): Promise<Role> {
    if (!roleId) throw new Error('Role ID is required');

    try {
      const data = await http.get<Role & { role?: Role }>(
        `/admin/roles/${roleId}`
      );
      return data?.role || data;
    } catch (err) {
      throw new Error(
        `Failed to fetch role: ${RolesPermissionsService.reason(err, 'Unknown error')}`
      );
    }
  }

  /**
   * Create new role
   * @param roleData - Role data
   */
  async createRole(roleData: RoleInput): Promise<Role> {
    if (!roleData?.name) throw new Error('Role name is required');
    if (!roleData?.permissions || !Array.isArray(roleData.permissions)) {
      throw new Error('Permissions must be an array');
    }

    try {
      const data = await http.post<Role & { role?: Role }>(
        '/admin/roles',
        roleData
      );
      return data?.role || data;
    } catch (err) {
      throw new Error(
        `Failed to create role: ${RolesPermissionsService.reason(err, 'Unknown error')}`
      );
    }
  }

  /**
   * Update role
   * @param roleId - Role ID
   * @param roleData - Updated role data
   */
  async updateRole(roleId: string, roleData: RoleInput): Promise<Role> {
    if (!roleId) throw new Error('Role ID is required');

    try {
      const data = await http.put<Role & { role?: Role }>(
        `/admin/roles/${roleId}`,
        roleData
      );
      return data?.role || data;
    } catch (err) {
      throw new Error(
        `Failed to update role: ${RolesPermissionsService.reason(err, 'Unknown error')}`
      );
    }
  }

  /**
   * Delete role
   * @param roleId - Role ID
   */
  async deleteRole(roleId: string): Promise<{ success: boolean }> {
    if (!roleId) throw new Error('Role ID is required');

    try {
      const data = await http.delete<{ success?: boolean }>(
        `/admin/roles/${roleId}`
      );
      return { success: data?.success !== false };
    } catch (err) {
      throw new Error(
        `Failed to delete role: ${RolesPermissionsService.reason(err, 'Unknown error')}`
      );
    }
  }

  /**
   * Assign role to user
   * @param userId - User ID
   * @param roleId - Role ID
   */
  async assignRoleToUser(
    userId: string,
    roleId: string
  ): Promise<{ success: boolean }> {
    if (!userId || !roleId) throw new Error('User ID and Role ID are required');

    try {
      const data = await http.put<{ success?: boolean }>(
        `/admin/users/${userId}/role`,
        { roleId }
      );
      return { success: data?.success !== false };
    } catch (err) {
      throw new Error(
        `Failed to assign role: ${RolesPermissionsService.reason(err, 'Unknown error')}`
      );
    }
  }

  /**
   * Remove role from user
   * @param userId - User ID
   */
  async removeRoleFromUser(userId: string): Promise<{ success: boolean }> {
    if (!userId) throw new Error('User ID is required');

    try {
      const data = await http.put<{ success?: boolean }>(
        `/admin/users/${userId}/role`,
        { roleId: null }
      );
      return { success: data?.success !== false };
    } catch (err) {
      throw new Error(
        `Failed to remove role: ${RolesPermissionsService.reason(err, 'Unknown error')}`
      );
    }
  }

  /**
   * Set user admin scope/permissions
   * @param userId - User ID
   * @param scope - Scope data
   */
  async setUserAdminScope(
    userId: string,
    scope: AdminScope
  ): Promise<{ success: boolean }> {
    if (!userId) throw new Error('User ID is required');

    try {
      const data = await http.put<{ success?: boolean }>(
        `/admin/users/${userId}/scope`,
        scope
      );
      return { success: data?.success !== false };
    } catch (err) {
      throw new Error(
        `Failed to set admin scope: ${RolesPermissionsService.reason(err, 'Unknown error')}`
      );
    }
  }

  /**
   * Check if user has permission
   * @param userId - User ID
   * @param permission - Permission to check
   */
  async checkUserPermission(
    userId: string,
    permission: string
  ): Promise<{ hasPermission: boolean }> {
    if (!userId || !permission) {
      throw new Error('User ID and permission are required');
    }

    try {
      const data = await http.get<{ hasPermission?: boolean }>(
        `/admin/users/${userId}/permission/${permission}`
      );
      return { hasPermission: data?.hasPermission === true };
    } catch {
      return { hasPermission: false };
    }
  }

  /**
   * Bulk assign permissions to role
   * @param roleId - Role ID
   * @param permissions - Permission IDs
   */
  async bulkAssignPermissions(
    roleId: string,
    permissions: string[]
  ): Promise<Role> {
    if (!roleId || !Array.isArray(permissions)) {
      throw new Error('Role ID and permissions array are required');
    }

    try {
      const data = await http.post<Role & { role?: Role }>(
        `/admin/roles/${roleId}/permissions/bulk`,
        { permissions }
      );
      return data?.role || data;
    } catch (err) {
      throw new Error(
        `Failed to assign permissions: ${RolesPermissionsService.reason(err, 'Unknown error')}`
      );
    }
  }
}

export const rolesPermissionsService = new RolesPermissionsService();
