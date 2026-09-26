import { useState } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Pagination } from '@/components/common/Pagination';
import { Card } from '@/components/common/Card';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { formatDate } from '@/utils/format';
import { commerceService } from '@/services/commerce.service';
import type { CouponRecord } from '@/services/commerce.service';

export function PromotionsPage() {
  const { t } = useLocalization();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data, loading, error, refetch } = useAsync(
    async () => {
      return commerceService.listCoupons({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
      });
    },
    [page, debouncedSearch]
  );

  const columns: Column<CouponRecord>[] = [
    {
      key: 'name',
      header: t('Name'),
      render: (row) => (
        <div>
          <div className="font-medium text-gray-800 dark:text-gray-100">{row.name}</div>
          {row.shopId && (
            <div className="text-xs text-gray-500">Shop: {row.shopId}</div>
          )}
        </div>
      ),
    },
    {
      key: 'value',
      header: t('Discount'),
      render: (row) => (
        <span className="font-medium">
          {row.value || 0}{row.minAmount ? '%' : ' ETB'}
        </span>
      ),
    },
    {
      key: 'minAmount',
      header: t('Min Amount'),
      render: (row) => row.minAmount ? `${row.minAmount.toLocaleString()} ETB` : '—',
    },
    {
      key: 'maxAmount',
      header: t('Max Discount'),
      render: (row) => row.maxAmount ? `${row.maxAmount.toLocaleString()} ETB` : '—',
    },
    {
      key: 'dateRange',
      header: t('Period'),
      render: (row) => (
        <div className="text-sm">
          {row.startDate && (
            <div className="text-gray-600 dark:text-gray-400">
              From: {formatDate(row.startDate)}
            </div>
          )}
          {row.endDate && (
            <div className="text-gray-600 dark:text-gray-400">
              To: {formatDate(row.endDate)}
            </div>
          )}
          {!row.startDate && !row.endDate && '—'}
        </div>
      ),
    },
    {
      key: 'usage',
      header: t('Usage'),
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.usageCount || 0}{row.maxUsage ? `/${row.maxUsage}` : ''}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('Status'),
      render: (row) => {
        let statusLabel = 'ACTIVE';
        let statusClass = '';
        if (row.endDate && new Date(row.endDate) < new Date()) {
          statusLabel = 'EXPIRED';
          statusClass = 'bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-100';
        } else if (row.startDate && new Date(row.startDate) > new Date()) {
          statusLabel = 'SCHEDULED';
          statusClass = 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-100';
        }
        return <StatusBadge label={statusLabel} className={statusClass} />;
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('Promotions & Coupons')}
        description={t('View platform promotions and discount codes')}
      />

      {/* Info Card */}
      <Card className="mb-4">
        <div className="flex items-start gap-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">
              {t('Seller-Owned Coupons')}
            </p>
            <p>
              {t('Coupons are created and managed by individual sellers for their shops.')}
              {t('Use the search to look up a coupon by its code.')}
            </p>
          </div>
        </div>
      </Card>

      {/* Search */}
      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t('Search by coupon code')}
          aria-label={t('Search promotions')}
        />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <DataTable<CouponRecord>
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(row) => row.id}
            loading={loading}
            emptyTitle={t('No promotions found')}
            emptyDescription={t('Search for a specific coupon code to view its details')}
          />
          {(data?.items?.length ?? 0) > 0 && data?.total && data.total > 20 && (
            <Pagination
              className="mt-4"
              page={page}
              totalPages={Math.ceil((data.total || 0) / 20)}
              total={data?.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
