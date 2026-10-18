/**
 * Users list panel — the list behind the "All Users" and "Buyers" tabs.
 *
 * This is the body of the old standalone `/users` page (usersService query, role
 * filter, CSV export, bulk suspend/ban, pagination, detail navigation), extracted
 * so the single Users page can reuse it instead of duplicating it.
 *
 * `role` pins the list to one role — the Customers tab passes `BUYER` (the
 * canonical role behind the "Customer" label). When it is omitted (the All
 * Users tab) the role dropdown stays available, which is how an operator can
 * still narrow the list to `AGENT`: a real role that has no tab of its own.
 */
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { usersService } from '@/services/users.service';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocalization } from '@/i18n/I18nProvider';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { Avatar } from '@/components/common/Avatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Pagination } from '@/components/common/Pagination';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { TableToolbar } from '@/components/tables/TableToolbar';
import { Card } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { formatDate, formatNumber } from '@/utils/format';
import type { User } from '@/types';

const USER_ROLES: Record<string, string> = {
  // Display copy: BUYER is the role, "Customer" is what the console calls it.
  BUYER: 'Customer',
  SELLER: 'Seller',
  AGENT: 'Agent',
  ADMIN: 'Admin',
};

const USER_ROLE_FILTERS = [
  { value: '', label: 'All' },
  { value: 'BUYER', label: 'Customers' },
  { value: 'SELLER', label: 'Sellers' },
  { value: 'AGENT', label: 'Agents' },
  { value: 'ADMIN', label: 'Admins' },
];

/** Identity roles the list can be pinned to. */
export type UsersRoleFilter = '' | 'BUYER' | 'SELLER' | 'AGENT' | 'ADMIN';

const exportUsersToCSV = (users: User[]) => {
  const headers = ['ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Verified', 'Joined'];
  const rows = users.map(u => [
    u.id,
    u.name,
    u.email,
    u.phoneNumber || '',
    USER_ROLES[u.role] || u.role,
    u.status,
    u.isVerified ? 'Yes' : 'No',
    new Date(u.createdAt).toLocaleDateString(),
  ]);

  const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export function UsersListPanel({ role: pinnedRole }: { role?: UsersRoleFilter }) {
  const { t } = useLocalization();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UsersRoleFilter>(pinnedRole ?? '');
  const debouncedSearch = useDebounce(search, 300);

  // A pinned role wins over the dropdown, so the Customers tab can never drift.
  const effectiveRole = pinnedRole ?? roleFilter;

  const { data, loading, error, refetch } = useAsync(
    useCallback(
      () => usersService.list({
        page,
        limit: 10,
        search: debouncedSearch,
        role: effectiveRole,
      }),
      [page, debouncedSearch, effectiveRole]
    ),
    [page, debouncedSearch, effectiveRole]
  );

  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'suspend' | 'ban' | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const toggleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === data?.items?.length) {
      setSelectedUsers(new Set());
    } else {
      const allIds = new Set((data?.items ?? []).map(u => u.id));
      setSelectedUsers(allIds);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.size === 0) return;
    setBulkLoading(true);
    try {
      const status = bulkAction === 'suspend' ? 'suspended' : 'banned';
      const ids = Array.from(selectedUsers);
      await Promise.all(ids.map(id => usersService.update(id, { status })));
      showToast({
        type: 'success',
        title: t('Bulk Action'),
        message: `${ids.length} user(s) ${bulkAction === 'suspend' ? 'suspended' : 'banned'} successfully`,
      });
      setSelectedUsers(new Set());
      setBulkAction(null);
      refetch();
    } catch (err) {
      showToast({
        type: 'error',
        title: t('Bulk Action'),
        message: err instanceof Error ? err.message : t('Failed to complete bulk action'),
      });
    } finally {
      setBulkLoading(false);
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={selectedUsers.size > 0 && selectedUsers.size === data?.items?.length}
          onChange={toggleSelectAll}
          aria-label="Select all users"
          className="rounded border-gray-300"
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedUsers.has(row.id)}
          onChange={() => toggleSelectUser(row.id)}
          aria-label={`Select ${row.name}`}
          className="rounded border-gray-300"
        />
      ),
      className: 'w-[50px]',
    },
    {
      key: 'name',
      header: t('Name'),
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} size="sm" />
          <span className="font-medium text-gray-800 dark:text-gray-100">
            {row.name}
          </span>
        </div>
      ),
    },
    { key: 'email', header: t('Email'), accessor: (row) => row.email },
    {
      key: 'role',
      header: t('Role'),
      render: (row) => (
        <span className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
          {USER_ROLES[row.role] ?? row.role}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('Status'),
      render: (row) => <StatusBadge label={row.status} />,
    },
    {
      key: 'isVerified',
      header: t('Verified'),
      render: (row) => (
        <span className={`text-xs font-semibold ${row.isVerified ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
          {row.isVerified ? '✓ Yes' : '○ No'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t('Joined'),
      accessor: (row) => formatDate(row.createdAt),
    },
  ];

  return (
    <div className="space-y-4">
      <TableToolbar
        resultCount={formatNumber(data?.total ?? 0)}
        resultLabel={t('Users')}
        search={search}
        onSearchChange={(next) => {
          setSearch(next);
          setPage(1);
        }}
        searchPlaceholder={t('Search by name or email...')}
        searchLabel={t('Search')}
        filters={
          !pinnedRole ? (
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as UsersRoleFilter);
                setPage(1);
              }}
              aria-label={t('Role')}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-dark-600 dark:bg-dark-800 dark:text-white"
            >
              {USER_ROLE_FILTERS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          ) : undefined
        }
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportUsersToCSV(data?.items || [])}
            title={t('Export users as CSV')}
          >
            <FontAwesomeIcon icon={faDownload} className="mr-2" />
            {t('Export')}
          </Button>
        }
      />

      {selectedUsers.size > 0 && (
        <Card className="flex items-center justify-between gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {selectedUsers.size} {t('users selected')}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setBulkAction('suspend')}
              loading={bulkLoading}
            >
              {t('Suspend')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setBulkAction('ban')}
              loading={bulkLoading}
            >
              {t('Ban')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedUsers(new Set())}
            >
              {t('Clear')}
            </Button>
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={bulkAction !== null}
        onClose={() => setBulkAction(null)}
        onConfirm={handleBulkAction}
        title={bulkAction === 'suspend' ? t('Suspend Users') : t('Ban Users')}
        message={`${t('Are you sure you want to')} ${bulkAction} ${selectedUsers.size} ${t('user(s)? This action can be reversed later.')}`}
        confirmLabel={bulkAction === 'suspend' ? t('Suspend') : t('Ban')}
        loading={bulkLoading}
      />

      {error ? (
        <ErrorState message={String(error)} onRetry={refetch} />
      ) : (
        <>
          <DataTable<User>
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(row) => row.id}
            loading={loading}
            emptyTitle={t('No users found')}
            emptyDescription={t('Try adjusting your search or filters')}
            onRowClick={(row) => navigate(`/users/${row.id}`)}
          />
          {(data?.totalPages ?? 0) > 1 && (
            <Pagination
              className="mt-4"
              page={page}
              totalPages={data?.totalPages ?? 0}
              total={data?.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
