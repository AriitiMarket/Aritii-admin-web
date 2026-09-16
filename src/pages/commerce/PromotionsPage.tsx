import { useState } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Pagination } from '@/components/common/Pagination';
import { SelectField } from '@/components/forms/SelectField';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { formatDate } from '@/utils/format';
import { http } from '@/services/client/httpClient';

interface Promotion {
  id: string;
  name: string;
  code?: string;
  value?: number;
  type?: 'PERCENTAGE' | 'FIXED';
  status: 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'DISABLED';
  startDate?: string;
  endDate?: string;
  usageCount?: number;
  maxUsage?: number;
  createdAt?: string;
}

interface PromotionsResponse {
  items: Promotion[];
  total: number;
  totalPages: number;
}

export function PromotionsPage() {
  const { t } = useLocalization();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const debouncedSearch = useDebounce(search, 300);

  const { data, loading, error, refetch } = useAsync(
    async () => {
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: '20',
          search: debouncedSearch,
          ...(status !== 'all' && { status }),
        });
        const res = await http.get(`/coupon/get-coupon-value/${debouncedSearch || 'all'}?${params}`);
        return res as PromotionsResponse;
      } catch (err) {
        throw new Error('Failed to load promotions');
      }
    },
    [page, debouncedSearch, status]
  );

  const columns: Column<Promotion>[] = [
    { key: 'name', header: t('Name'), accessor: (row) => row.name },
    { key: 'code', header: t('Code'), accessor: (row) => row.code || '-' },
    {
      key: 'value',
      header: t('Discount'),
      render: (row) => `${row.value || 0}${row.type === 'PERCENTAGE' ? '%' : ' ETB'}`,
    },
    {
      key: 'dateRange',
      header: t('Period'),
      render: (row) => (
        <div className="text-sm">
          <div className="text-gray-600 dark:text-gray-400">{formatDate(row.startDate)}</div>
          <div className="text-gray-600 dark:text-gray-400">{formatDate(row.endDate)}</div>
        </div>
      ),
    },
    {
      key: 'usage',
      header: t('Usage'),
      render: (row) => `${row.usageCount || 0}${row.maxUsage ? `/${row.maxUsage}` : ''}`,
    },
    {
      key: 'status',
      header: t('Status'),
      render: (row) => (
        <StatusBadge
          label={row.status}
          className={
            row.status === 'EXPIRED'
              ? 'bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-100'
              : row.status === 'SCHEDULED'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                : row.status === 'DISABLED'
                  ? 'bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-100'
                  : ''
          }
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('Promotions & Coupons')}
        description={t('Manage platform-wide promotions and discount codes')}
        actions={
          <div className="flex items-center gap-2">
            <SelectField
              value={status}
              options={[
                { value: 'all', label: t('All Promotions') },
                { value: 'ACTIVE', label: t('Active') },
                { value: 'SCHEDULED', label: t('Scheduled') },
                { value: 'EXPIRED', label: t('Expired') },
                { value: 'DISABLED', label: t('Disabled') },
              ]}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-48"
            />
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('Search promotions')}
              aria-label={t('Search')}
            />
          </div>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <DataTable<Promotion>
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(row) => row.id}
            loading={loading}
            emptyTitle={t('No promotions found')}
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
