import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sellersService } from '@/services/sellers.service';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { ErrorState } from '@/components/common/ErrorState';
import { Avatar } from '@/components/common/Avatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Pagination } from '@/components/common/Pagination';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { formatDate, formatNumber } from '@/utils/format';
import type { Seller } from '@/types';

export function SellersManagementPage() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data, loading, error, refetch } = useAsync(
    () => sellersService.list({ page, limit: 10, search: debouncedSearch }),
    [page, debouncedSearch]
  );

  const columns: Column<Seller>[] = [
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
      key: 'stores',
      header: t('Stores'),
      accessor: (row) => formatNumber(row.storesCount),
    },
    {
      key: 'status',
      header: t('Status'),
      render: (row) => <StatusBadge label={row.status} />,
    },
    {
      key: 'createdAt',
      header: 'Joined',
      accessor: (row) => formatDate(row.createdAt),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('Sellers')}
        description={t('Manage seller accounts and their stores')}
        actions={
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('Search')}
            aria-label={t('Search')}
          />
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <DataTable<Seller>
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(row) => row.id}
            loading={loading}
            emptyTitle={t('No data available')}
            onRowClick={(row) => navigate(`/sellers/${row.id}`)}
          />
          <Pagination
            className="mt-4"
            page={page}
            totalPages={data?.totalPages ?? 0}
            total={data?.total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}