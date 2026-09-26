import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { businessesService, type SellerApplication } from '@/services/businesses.service';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { ErrorState } from '@/components/common/ErrorState';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Pagination } from '@/components/common/Pagination';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { formatDate, formatNumber } from '@/utils/format';

interface SellerApplicationRow extends SellerApplication {
  shopCount?: number;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Applications' },
  { value: 'PENDING_REVIEW', label: 'Pending Review' },
  { value: 'MORE_INFORMATION_REQUIRED', label: 'Needs Info' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'DRAFT', label: 'Draft' },
];

export function BusinessesManagementPage() {
  const { t } = useLocalization();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const debouncedSearch = useDebounce(search, 300);

  const { data, loading, error, refetch } = useAsync(
    () =>
      businessesService.listApplications({
        page,
        limit: 10,
        status: statusFilter || undefined,
        search: debouncedSearch,
      }),
    [page, statusFilter, debouncedSearch]
  );

  const getLocationDisplay = (app: SellerApplicationRow) => {
    const loc = app.location || {};
    const parts = [loc.regionName || loc.region, loc.cityName || loc.city].filter(Boolean);
    // Never surface a raw sectorId — only the readable name.
    if (loc.sectorName) parts.push(loc.sectorName);
    if (!parts.length && loc.address) parts.push(loc.address);
    return parts.length ? parts.join(' › ') : '—';
  };

  const getShopCount = (app: SellerApplicationRow) => {
    return app.shopCount ?? (app.shopId ? 1 : 0);
  };

  const getOwnerName = (app: SellerApplicationRow) =>
    app.ownerName || app.owner?.name || '—';
  const getOwnerEmail = (app: SellerApplicationRow) =>
    app.ownerEmail || app.owner?.email || '—';

  const stats = {
    total: data?.total || 0,
    pending: data?.items?.filter((a: SellerApplicationRow) => a.status === 'PENDING_REVIEW').length || 0,
    approved: data?.items?.filter((a: SellerApplicationRow) => a.status === 'APPROVED').length || 0,
    rejected: data?.items?.filter((a: SellerApplicationRow) => a.status === 'REJECTED').length || 0,
    suspended: data?.items?.filter((a: SellerApplicationRow) => a.status === 'SUSPENDED').length || 0,
  };

  const columns: Column<SellerApplicationRow>[] = [
    {
      key: 'businessName',
      header: t('Business'),
      render: (row) => {
        return (
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{row.businessInformation?.businessName || row.businessName || 'N/A'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{row.sellerType || ''}</p>
          </div>
        );
      },
    },
    {
      key: 'ownerName',
      header: t('Owner'),
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{getOwnerName(row)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{getOwnerEmail(row)}</p>
        </div>
      ),
    },
    {
      key: 'location',
      header: t('Location'),
      render: (row) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {getLocationDisplay(row)}
        </span>
      ),
    },
    {
      key: 'businessCategory',
      header: t('Category'),
      render: (row) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {row.businessInformation?.businessCategory || row.businessCategory || '—'}
        </span>
      ),
    },
    {
      key: 'shopCount',
      header: t('Shops'),
      render: (row) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {getShopCount(row)}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('Status'),
      render: (row) => <StatusBadge label={row.status} />,
    },
    {
      key: 'submittedAt',
      header: t('Submitted'),
      render: (row) => <span className="text-sm">{formatDate(row.submittedAt || row.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('Businesses & Applications')}
        description={`Manage seller applications — ${formatNumber(stats.total)} total`}
        actions={
          <div className="flex items-center gap-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('Search by business or owner...')}
              aria-label={t('Search')}
            />
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              {t('Refresh')}
            </Button>
          </div>
        }
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{t('Total')}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.pending}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{t('Pending')}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.approved}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{t('Approved')}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{t('Rejected')}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.suspended}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{t('Suspended')}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setStatusFilter(opt.value); setPage(1); }}
            className={`px-3 py-1 rounded text-sm font-medium transition ${
              statusFilter === opt.value
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-dark-700 dark:text-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState message={String(error)} onRetry={refetch} />
      ) : (
        <>
          <DataTable<SellerApplicationRow>
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(row) => row.id}
            loading={loading}
            emptyTitle={t('No applications found')}
            onRowClick={(row) => navigate(`/businesses/${row.id}`)}
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
