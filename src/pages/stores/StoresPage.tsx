import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storesService, type StoreListFilter } from '@/services/stores.service';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { useSector } from '@/hooks/useSector';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Avatar } from '@/components/common/Avatar';
import { Pagination } from '@/components/common/Pagination';
import { SelectField } from '@/components/forms/SelectField';
import { DataTable, type Column } from '@/components/tables/DataTable';
import type { Store } from '@/types';

export function StoresPage() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const { selectedSector, sectors } = useSector();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('all');
  const debouncedSearch = useDebounce(search, 300);

  const filter: StoreListFilter = {
    page,
    limit: 10,
    search: debouncedSearch,
    ...(sector !== 'all' ? { sector } : {}),
  };

  const { data, loading, error, refetch } = useAsync(
    () => storesService.list(filter),
    [page, debouncedSearch, sector, selectedSector]
  );

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
      key: 'rating',
      header: 'Rating',
      accessor: (row) => (row.rating ?? 0).toFixed(1),
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
        title={t('Stores')}
        description={t('Manage marketplace stores')}
        actions={
          <div className="flex items-center gap-2">
            <SelectField
              aria-label={t('Sectors')}
              value={sector}
              options={[
                { value: 'all', label: t('All sectors') },
                ...sectors.map((item) => ({
                  value: item.id,
                  label: item.name,
                })),
              ]}
              onChange={(event) => setSector(event.target.value)}
              className="h-9 w-44"
            />
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('Search')}
              aria-label={t('Search')}
            />
          </div>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <DataTable<Store>
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(row) => row.id}
            loading={loading}
            emptyTitle={t('No data available')}
            onRowClick={(row) => navigate(`/stores/${row.id}`)}
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