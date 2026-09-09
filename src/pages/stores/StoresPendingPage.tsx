import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storesService } from '@/services/stores.service';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { Pagination } from '@/components/common/Pagination';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Avatar } from '@/components/common/Avatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Link } from 'react-router-dom';
import type { Store } from '@/types';

export function StoresPendingPage() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data, loading, error, refetch } = useAsync(
    () => storesService.pending(),
    []
  );

  const start = (page - 1) * 10;
  const items = (data ?? []).slice(start, start + 10);

  const columns: Column<Store>[] = [
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
    { key: 'address', header: t('Address'), accessor: (row) => row.address },
    {
      key: 'status',
      header: t('Status'),
      render: (row) => <StatusBadge label={row.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('Pending Stores')}
        description={t('Store onboarding requests awaiting approval')}
        actions={
          <Link to="/stores">
            <Button variant="outline">{t('All stores')}</Button>
          </Link>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <DataTable<Store>
            columns={columns}
            rows={items}
            rowKey={(row) => row.id}
            loading={loading}
            emptyTitle={t('No data available')}
            onRowClick={(row) => navigate(`/stores/${row.id}`)}
          />
          <Pagination
            className="mt-4"
            page={page}
            totalPages={Math.ceil((data ?? []).length / 10)}
            total={data?.length}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}