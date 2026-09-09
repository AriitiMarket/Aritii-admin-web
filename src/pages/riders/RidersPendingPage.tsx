import { useNavigate } from 'react-router-dom';
import { ridersService } from '@/services/riders.service';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/common/Button';
import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Avatar } from '@/components/common/Avatar';
import type { Rider } from '@/types';

export function RidersPendingPage() {
  const { t } = useLocalization();
  const navigate = useNavigate();

  // Pending riders = accounts that are not yet active.
  const { data, loading, error, refetch } = useAsync(
    async () => {
      const result = await ridersService.list({ page: 1, limit: 100 });
      return result.items.filter((rider) => rider.status === 'PENDING');
    },
    []
  );

  const columns: Column<Rider>[] = [
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
    { key: 'username', header: 'Username', accessor: (row) => row.username },
    { key: 'vehicle', header: 'Vehicle', accessor: (row) => row.vehicleType },
    {
      key: 'status',
      header: t('Status'),
      render: (row) => <StatusBadge label={row.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('Pending Riders')}
        description={t('Rider onboarding requests awaiting approval')}
        actions={
          <Link to="/riders">
            <Button variant="outline">{t('All riders')}</Button>
          </Link>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <DataTable<Rider>
            columns={columns}
            rows={data ?? []}
            rowKey={(row) => row.id}
            loading={loading}
            emptyTitle={t('No data available')}
            onRowClick={(row) => navigate(`/riders/${row.id}`)}
          />
        </>
      )}
    </div>
  );
}