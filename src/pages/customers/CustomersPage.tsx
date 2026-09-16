import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customersService } from '@/services/customers.service';
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
import { formatCurrency, formatNumber } from '@/utils/format';
import type { Customer } from '@/types';

export function CustomersManagementPage() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data, loading, error, refetch } = useAsync(
    () => customersService.list({ page, limit: 10, search: debouncedSearch }),
    [page, debouncedSearch]
  );

  const columns: Column<Customer>[] = [
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
      key: 'orders',
      header: t('Orders'),
      accessor: (row) => formatNumber(row.ordersCount),
    },
    {
      key: 'spent',
      header: 'Spent',
      accessor: (row) => formatCurrency(row.totalSpent),
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
        title={t('Customers')}
        description={t('Manage customer accounts')}
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
          <DataTable<Customer>
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(row) => row.id}
            loading={loading}
            emptyTitle={t('No data available')}
            onRowClick={(row) => navigate(`/customers/${row.id}`)}
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