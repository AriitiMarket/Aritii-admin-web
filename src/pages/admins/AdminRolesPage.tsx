import { useState } from 'react';
import { adminsService } from '@/services/admins.service';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { TextField } from '@/components/forms/TextField';
import { ErrorState } from '@/components/common/ErrorState';
import { PageLoader } from '@/components/common/PageLoader';
import { Avatar } from '@/components/common/Avatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { PERMISSION_MODULES, PERMISSION_DESCRIPTIONS } from '@/utils/permissions';
import type { AdminRoleItem, AdminPermission, AdminAccount } from '@/types/admin';

function RoleFormModal({
  role,
  allPermissions,
  onSave,
  onClose,
}: {
  role?: AdminRoleItem | null;
  allPermissions: AdminPermission[];
  onSave: (data: { name: string; displayName: string; description: string; permissions: string[] }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(role?.name || '');
  const [displayName, setDisplayName] = useState(role?.display_name || '');
  const [description, setDescription] = useState(role?.description || '');
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set(role?.permissions || []));
  const isEdit = !!role;

  function togglePerm(key: string) {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleModule(_module: string, keys: string[]) {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      const allSelected = keys.every((k) => next.has(k));
      keys.forEach((k) => allSelected ? next.delete(k) : next.add(k));
      return next;
    });
  }

  const grouped: Record<string, AdminPermission[]> = {};
  allPermissions.forEach((p) => {
    if (!grouped[p.module]) grouped[p.module] = [];
    grouped[p.module].push(p);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="mx-4 max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          {isEdit ? 'Edit Role' : 'Create Role'}
        </h3>
        <div className="space-y-4">
          {!isEdit && (
            <TextField label="Role Code" value={name} onChange={(e) => setName(e.target.value.toUpperCase().replace(/\s+/g, '_'))} name="name" placeholder="e.g. CONTENT_ADMIN" />
          )}
          <TextField label="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} name="displayName" placeholder="e.g. Content Admin" />
          <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} name="description" />

          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Permissions</h4>
            <div className="max-h-60 overflow-y-auto rounded border border-gray-200 p-3 dark:border-gray-700">
              {Object.entries(grouped).map(([module, perms]) => {
                const allSelected = perms.every((p) => selectedPerms.has(p.key));
                return (
                  <div key={module} className="mb-3">
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => toggleModule(module, perms.map((p) => p.key))}
                        className="h-3.5 w-3.5"
                      />
                      {PERMISSION_MODULES[module] || module}
                    </label>
                    <div className="ml-5 mt-1 space-y-1">
                      {perms.map((p) => (
                        <label key={p.key} className="flex cursor-pointer items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <input
                            type="checkbox"
                            checked={selectedPerms.has(p.key)}
                            onChange={() => togglePerm(p.key)}
                            className="h-3 w-3"
                          />
                          <span>{p.name}</span>
                          <span className="text-gray-400">— {PERMISSION_DESCRIPTIONS[p.key] || p.description}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave({ name, displayName, description, permissions: Array.from(selectedPerms) })}>
            {isEdit ? 'Save Changes' : 'Create Role'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AssignRoleModal({
  admins,
  roles,
  onAssign,
  onClose,
}: {
  admins: AdminAccount[];
  roles: AdminRoleItem[];
  onAssign: (userId: string, roleId: string) => void;
  onClose: () => void;
}) {
  const [userId, setUserId] = useState('');
  const [roleId, setRoleId] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Assign Role</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">Admin User</label>
            <select value={userId} onChange={(e) => setUserId(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white">
              <option value="">Select admin...</option>
              {admins.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">Role</label>
            <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white">
              <option value="">Select role...</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.display_name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!userId || !roleId} onClick={() => { onAssign(userId, roleId); onClose(); }}>Assign</Button>
        </div>
      </div>
    </div>
  );
}

export function AdminRolesPage() {
  const { t } = useLocalization();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'roles' | 'users'>('roles');
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState<AdminRoleItem | null>(null);
  const [showAssignForm, setShowAssignForm] = useState(false);

  const roles = useAsync(() => adminsService.listRoles(), []);
  const permissions = useAsync(() => adminsService.listPermissions(), []);
  const admins = useAsync(() => adminsService.list(), []);
  const userRoles = useAsync(() => adminsService.getAllUserRoles(), []);

  const anyError = roles.error ?? permissions.error;
  if (roles.loading && !roles.data) return <PageLoader />;
  if (anyError) return <ErrorState message={anyError} onRetry={roles.refetch} />;

  const roleData = (roles.data || []) as AdminRoleItem[];
  const permData = (permissions.data || []) as AdminPermission[];
  const adminData = (admins.data || []) as AdminAccount[];
  const userRoleData = (userRoles.data || []) as { user_id: string; user_name: string; user_email: string; role_name: string; role_display_name: string; assigned_at: string }[];

  async function handleCreateRole(data: { name: string; displayName: string; description: string; permissions: string[] }) {
    try {
      await adminsService.createRole(data);
      showToast({ type: 'success', message: 'Role created' });
      roles.refetch();
      setShowRoleForm(false);
    } catch (err) {
      showToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to create role' });
    }
  }

  async function handleUpdateRole(data: { name: string; displayName: string; description: string; permissions: string[] }) {
    if (!editingRole) return;
    try {
      await adminsService.updateRole(editingRole.id, { displayName: data.displayName, description: data.description, permissions: data.permissions });
      showToast({ type: 'success', message: 'Role updated' });
      roles.refetch();
      setEditingRole(null);
      setShowRoleForm(false);
    } catch (err) {
      showToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to update role' });
    }
  }

  async function handleDeleteRole(role: AdminRoleItem) {
    if (role.is_system) {
      showToast({ type: 'error', message: 'Cannot delete system roles' });
      return;
    }
    if (!confirm(`Delete role "${role.display_name}"?`)) return;
    try {
      await adminsService.deleteRole(role.id);
      showToast({ type: 'success', message: 'Role deleted' });
      roles.refetch();
    } catch (err) {
      showToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to delete role' });
    }
  }

  async function handleAssignRole(userId: string, roleId: string) {
    try {
      await adminsService.assignRole(userId, roleId);
      showToast({ type: 'success', message: 'Role assigned' });
      userRoles.refetch();
    } catch (err) {
      showToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to assign role' });
    }
  }

  async function handleRemoveUserRole(userId: string, roleId: string) {
    try {
      await adminsService.removeRole(userId, roleId);
      showToast({ type: 'success', message: 'Role removed' });
      userRoles.refetch();
    } catch (err) {
      showToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to remove role' });
    }
  }

  const roleColumns: Column<AdminRoleItem>[] = [
    { key: 'name', header: t('Role'), render: (row) => (
      <div>
        <div className="font-medium text-gray-800 dark:text-gray-100">{row.display_name}</div>
        <div className="text-xs text-gray-400">{row.name}</div>
      </div>
    )},
    { key: 'description', header: t('Description'), accessor: (row) => row.description || '-' },
    { key: 'permissions', header: t('Permissions'), render: (row) => (
      <span className="text-xs text-gray-500">{row.permissions.length} permissions</span>
    )},
    { key: 'user_count', header: t('Users'), render: (row) => (
      <span className="text-xs text-gray-500">{row.user_count || 0}</span>
    )},
    { key: 'is_system', header: t('Type'), render: (row) => (
      row.is_system ? <StatusBadge label="System" variant="info" /> : <StatusBadge label="Custom" />
    )},
    { key: 'actions', header: '', render: (row) => (
      <div className="flex gap-1">
        <button onClick={(e) => { e.stopPropagation(); setEditingRole(row); setShowRoleForm(true); }} className="text-xs text-blue-600 hover:underline">Edit</button>
        {!row.is_system && <button onClick={(e) => { e.stopPropagation(); handleDeleteRole(row); }} className="text-xs text-red-600 hover:underline">Delete</button>}
      </div>
    )},
  ];

  const userColumns: Column<{ user_id: string; user_name: string; user_email: string; role_name: string; role_display_name: string; assigned_at: string }>[] = [
    { key: 'user_name', header: t('Admin'), render: (row) => (
      <div className="flex items-center gap-2">
        <Avatar name={row.user_name} size="sm" />
        <div>
          <div className="font-medium text-gray-800 dark:text-gray-100">{row.user_name}</div>
          <div className="text-xs text-gray-400">{row.user_email}</div>
        </div>
      </div>
    )},
    { key: 'role_display_name', header: t('Role'), render: (row) => (
      <StatusBadge label={row.role_display_name} variant="info" />
    )},
    { key: 'assigned_at', header: t('Assigned'), render: (row) => (
      <span className="text-xs text-gray-500">{new Date(row.assigned_at).toLocaleDateString()}</span>
    )},
    { key: 'actions', header: '', render: (row) => (
      <button onClick={(e) => { e.stopPropagation(); handleRemoveUserRole(row.user_id, row.role_name); }} className="text-xs text-red-600 hover:underline">Remove</button>
    )},
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('Admin Roles & Permissions')}
        description={t('Manage admin roles, permissions, and assignments')}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setActiveTab('users'); setShowAssignForm(true); }}>
              {t('Assign Role')}
            </Button>
            <Button onClick={() => { setEditingRole(null); setShowRoleForm(true); }}>
              {t('New Role')}
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        <button onClick={() => setActiveTab('roles')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'roles' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}>
          {t('Roles')} ({roleData.length})
        </button>
        <button onClick={() => setActiveTab('users')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'users' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}>
          {t('User Assignments')} ({userRoleData.length})
        </button>
      </div>

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <Card>
          <DataTable<AdminRoleItem>
            columns={roleColumns}
            rows={roleData}
            rowKey={(row) => row.id}
            loading={roles.loading}
            emptyTitle={t('No roles found')}
            onRowClick={(row) => { setEditingRole(row); setShowRoleForm(true); }}
          />
        </Card>
      )}

      {/* User Assignments Tab */}
      {activeTab === 'users' && (
        <Card>
          <DataTable
            columns={userColumns}
            rows={userRoleData}
            rowKey={(row: any) => `${row.user_id}-${row.role_name}`}
            loading={userRoles.loading}
            emptyTitle={t('No assignments found')}
          />
        </Card>
      )}

      {/* Role Form Modal */}
      {showRoleForm && (
        <RoleFormModal
          role={editingRole}
          allPermissions={permData}
          onSave={editingRole ? handleUpdateRole : handleCreateRole}
          onClose={() => { setShowRoleForm(false); setEditingRole(null); }}
        />
      )}

      {/* Assign Role Modal */}
      {showAssignForm && (
        <AssignRoleModal
          admins={adminData}
          roles={roleData}
          onAssign={handleAssignRole}
          onClose={() => setShowAssignForm(false)}
        />
      )}
    </div>
  );
}
