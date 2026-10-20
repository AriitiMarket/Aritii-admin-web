import { useState, useEffect, useCallback, type FormEvent } from 'react';
import {
  rolesPermissionsService,
  type Permission,
  type PermissionsByModule,
  type Role,
  type RoleInput,
} from '@/services/rolesPermissions.admin.service';

/** The role form payload assembled by the console. */
export interface RoleFormData {
  name: string;
  description: string;
  permissions: string[];
}

/**
 * Roles & Permissions Management Hook
 */
export function useRolesPermissions() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionsByModule, setPermissionsByModule] =
    useState<PermissionsByModule>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [rolesData, permissionsData, byModule] = await Promise.all([
          rolesPermissionsService.getRoles(),
          rolesPermissionsService.getPermissions(),
          rolesPermissionsService.getPermissionsByModule(),
        ]);

        setRoles(rolesData.roles);
        setPermissions(permissionsData.permissions);
        setPermissionsByModule(byModule);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const createRole = useCallback(async (roleData: RoleInput) => {
    setActionLoading((prev) => ({ ...prev, create: true }));
    setError(null);
    setSuccess(null);

    try {
      const newRole = await rolesPermissionsService.createRole(roleData);
      setRoles((prev) => [...prev, newRole]);
      setSuccess('Role created successfully');
      return newRole;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setActionLoading((prev) => ({ ...prev, create: false }));
    }
  }, []);

  const updateRole = useCallback(async (roleId: string, roleData: RoleInput) => {
    setActionLoading((prev) => ({ ...prev, [roleId]: true }));
    setError(null);
    setSuccess(null);

    try {
      const updated = await rolesPermissionsService.updateRole(roleId, roleData);
      setRoles((prev) =>
        prev.map((r) => (r._id === roleId || r.id === roleId ? updated : r))
      );
      setSuccess('Role updated successfully');
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setActionLoading((prev) => ({ ...prev, [roleId]: false }));
    }
  }, []);

  const deleteRole = useCallback(async (roleId: string) => {
    setActionLoading((prev) => ({ ...prev, [roleId]: true }));
    setError(null);
    setSuccess(null);

    try {
      await rolesPermissionsService.deleteRole(roleId);
      setRoles((prev) => prev.filter((r) => r._id !== roleId && r.id !== roleId));
      setSuccess('Role deleted successfully');
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setActionLoading((prev) => ({ ...prev, [roleId]: false }));
    }
  }, []);

  const assignRoleToUser = useCallback(async (userId: string, roleId: string) => {
    setActionLoading((prev) => ({ ...prev, [`user-${userId}`]: true }));
    setError(null);

    try {
      await rolesPermissionsService.assignRoleToUser(userId, roleId);
      setSuccess('Role assigned successfully');
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setActionLoading((prev) => ({ ...prev, [`user-${userId}`]: false }));
    }
  }, []);

  return {
    roles,
    permissions,
    permissionsByModule,
    loading,
    error,
    success,
    actionLoading,
    clearMessages,
    createRole,
    updateRole,
    deleteRole,
    assignRoleToUser,
  };
}

/**
 * Roles & Permissions Management Page
 */
export function RolesPermissionsPage() {
  const [activeTab, setActiveTab] = useState('roles');
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const {
    roles,
    permissions,
    permissionsByModule,
    loading,
    error,
    success,
    actionLoading,
    clearMessages,
    createRole,
    updateRole,
    deleteRole,
  } = useRolesPermissions();

  if (loading) {
    return <div className="roles-loading">Loading roles and permissions...</div>;
  }

  return (
    <div className="roles-permissions-page">
      <h1>Roles & Permissions Management</h1>

      {error && (
        <div className="alert alert-error" onClick={clearMessages}>
          {error} ✕
        </div>
      )}

      {success && (
        <div className="alert alert-success" onClick={clearMessages}>
          {success} ✕
        </div>
      )}

      <div className="management-tabs">
        <button
          className={`tab-button ${activeTab === 'roles' ? 'active' : ''}`}
          onClick={() => setActiveTab('roles')}
        >
          Roles
        </button>
        <button
          className={`tab-button ${activeTab === 'permissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('permissions')}
        >
          Permissions
        </button>
      </div>

      {activeTab === 'roles' && (
        <RolesManager
          roles={roles}
          permissions={permissions}
          actionLoading={actionLoading}
          editingRole={editingRole}
          onEditingChange={setEditingRole}
          onCreateRole={createRole}
          onUpdateRole={updateRole}
          onDeleteRole={deleteRole}
        />
      )}

      {activeTab === 'permissions' && (
        <PermissionsViewer permissionsByModule={permissionsByModule} />
      )}
    </div>
  );
}

/**
 * Roles Manager Component
 */
function RolesManager({
  roles,
  permissions,
  actionLoading,
  editingRole,
  onEditingChange,
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
}: {
  roles: Role[];
  permissions: Permission[];
  actionLoading: Record<string, boolean>;
  editingRole: Role | null;
  onEditingChange: (role: Role | null) => void;
  onCreateRole: (roleData: RoleInput) => Promise<Role | null>;
  onUpdateRole: (roleId: string, roleData: RoleInput) => Promise<Role | null>;
  onDeleteRole: (roleId: string) => Promise<boolean>;
}) {
  return (
    <div className="roles-manager">
      <RoleForm
        permissions={permissions}
        existingRole={editingRole}
        actionLoading={actionLoading.create || actionLoading[editingRole?.id ?? '']}
        onSubmit={async (data) => {
          if (editingRole) {
            const result = await onUpdateRole(editingRole._id || editingRole.id, data);
            if (result) onEditingChange(null);
          } else {
            const result = await onCreateRole(data);
            if (result) {
              // Form cleared automatically
            }
          }
        }}
        onCancel={() => onEditingChange(null)}
      />

      <div className="roles-list">
        <h3>Existing Roles</h3>
        <table>
          <thead>
            <tr>
              <th>Role Name</th>
              <th>Description</th>
              <th>Permissions</th>
              <th>Users Count</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role._id || role.id}>
                <td>{role.name}</td>
                <td>{role.description}</td>
                <td>{role.permissions?.length || 0}</td>
                <td>{role.usersCount || 0}</td>
                <td>
                  <button
                    onClick={() => onEditingChange(role)}
                    className="btn btn-sm btn-secondary"
                    disabled={actionLoading[role._id || role.id]}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteRole(role._id || role.id)}
                    className="btn btn-sm btn-danger"
                    disabled={actionLoading[role._id || role.id]}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Role Form Component
 */
function RoleForm({
  permissions,
  existingRole,
  actionLoading,
  onSubmit,
  onCancel,
}: {
  permissions: Permission[];
  existingRole: Role | null;
  actionLoading: boolean;
  onSubmit: (data: RoleFormData) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<RoleFormData>(
    existingRole
      ? {
          name: existingRole.name,
          description: existingRole.description,
          permissions: existingRole.permissions || [],
        }
      : { name: '', description: '', permissions: [] }
  );

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Role name is required');
      return;
    }
    onSubmit(formData);
  };

  const togglePermission = (permId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter((p) => p !== permId)
        : [...prev.permissions, permId],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="role-form">
      <div className="form-group">
        <label>Role Name:</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>

      <div className="form-group">
        <label>Description:</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="permissions-selector">
        <h4>Permissions:</h4>
        <div className="permissions-grid">
          {permissions.map((perm) => (
            <label key={perm._id || perm.id} className="permission-checkbox">
              <input
                type="checkbox"
                checked={formData.permissions.includes(perm._id || perm.id)}
                onChange={() => togglePermission(perm._id || perm.id)}
              />
              <span>{perm.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" disabled={actionLoading} className="btn btn-primary">
          {actionLoading ? 'Saving...' : existingRole ? 'Update Role' : 'Create Role'}
        </button>
        {existingRole && (
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

/**
 * Permissions Viewer Component
 */
function PermissionsViewer({
  permissionsByModule,
}: {
  permissionsByModule: PermissionsByModule;
}) {
  return (
    <div className="permissions-viewer">
      <div className="permissions-grid">
        {Object.entries(permissionsByModule).map(([module, modulePerms]) => (
          <div key={module} className="module-permissions">
            <h3>{module}</h3>
            <ul>
              {modulePerms?.map((perm) => (
                <li key={perm._id || perm.id}>
                  <code>{perm.name}</code>
                  <p>{perm.description}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
