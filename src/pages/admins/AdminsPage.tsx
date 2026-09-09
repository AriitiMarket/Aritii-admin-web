import { useNavigate } from 'react-router-dom';
import { adminsService } from '@/services/admins.service';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Avatar } from '@/components/common/Avatar';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Button } from '@/components/common/Button';
import { Link } from 'react-router-dom';
import type { AdminAccount } from '@/types/admin';

export function AdminsPage() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useAsync(
    () => adminsService.list(),
    []
  );

  const columns: Column<AdminAccount>[] = [
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
    { key: 'role', header: 'Role', accessor: (row) => row.role },
    {
      key: 'sectors',
      header: t('Sectors'),
      render: (row) => (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {row.sectors.length === 3 ? 'All' : `${row.sectors.length} sectors`}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('Status'),
      render: (row) => <StatusBadge label={row.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('Admins')}
        description={t('Manage administrator accounts')}
        actions={
          <Link to="/admins/new">
            <Button>{t('New Admin')}</Button>
          </Link>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <DataTable<AdminAccount>
          columns={columns}
          rows={data ?? []}
          rowKey={(row) => row.id}
          loading={loading}
          emptyTitle={t('No data available')}
          onRowClick={(row) => navigate(`/admins/${row.id}`)}
        />
      )}
    </div>
  );
}