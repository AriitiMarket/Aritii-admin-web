import { catalogService } from '@/services/catalog.service';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { formatDate } from '@/utils/format';
import type { Category } from '@/types/catalog';

export function CategoriesPage() {
  const { t } = useLocalization();
  const { data, loading, error, refetch } = useAsync(
    () => catalogService.listCategories(),
    []
  );

  const columns: Column<Category>[] = [
    { key: 'title', header: t('Title'), accessor: (row) => row.title },
    { key: 'sector', header: t('Sectors'), accessor: (row) => row.sector },
    {
      key: 'status',
      header: t('Status'),
      render: (row) => (
        <StatusBadge label={row.isActive ? 'ACTIVE' : 'INACTIVE'} />
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      accessor: (row) => formatDate(row.createdAt),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('Categories')}
        description={t('Manage product categories across sectors')}
      />

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <DataTable<Category>
          columns={columns}
          rows={data ?? []}
          rowKey={(row) => row.id}
          loading={loading}
          emptyTitle={t('No data available')}
        />
      )}
    </div>
  );
}