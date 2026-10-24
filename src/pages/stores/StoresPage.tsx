import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { storesService } from '@/services/stores.service';
import { businessesService } from '@/services/businesses.service';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { useSector } from '@/hooks/useSector';
import { useToast } from '@/hooks/useToast';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { FilterBar, type FilterDef } from '@/components/workspace/FilterBar';
import { apiErrorMessage } from '@/utils/error';
import type { Store } from '@/types';

export function StoresManagementPage() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const { sectors } = useSector();
  const { showToast } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  // Status lives in `?status=` so the approval queue is deep-linkable
  // (`/stores?status=PENDING_APPROVAL`) — the sidebar's pending-shops entry
  // was removed in favour of this filter.
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState(() => searchParams.get('status') ?? 'all');
  const setStatusParam = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'all') next.set('status', value);
    else next.delete('status');
    setSearchParams(next, { replace: true });
  };
  const [sector, setSector] = useState('all');
  const [businessId, setBusinessId] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const { data, loading, error, refetch } = useAsync(
    () =>
      storesService.list({
        page,
        limit: 10,
        search: debouncedSearch,
        status: status !== 'all' ? status : undefined,
        sectorId: sector !== 'all' ? sector : undefined,
        businessId: businessId || undefined,
        ownerEmail: ownerEmail || undefined,
      }),
    [page, debouncedSearch, status, sector, businessId, ownerEmail]
  );

  // Business filter picks by NAME — the console must never ask for a raw
  // Mongo id, it is not a vocabulary a human thinks in.
  const { data: businesses } = useAsync(
    () => businessesService.listApplications({ page: 1, limit: 200 }),
    []
  );
  const businessOptions = [
    { value: '', label: t('All Businesses') },
    ...(businesses?.items ?? []).map((business) => ({
      value: business.id,
      label:
        business.businessInformation?.businessName ||
        business.businessName ||
        business.shopInformation?.shopName ||
        business.id,
    })),
  ];

  const getLocationDisplay = (store: Store) => {
    const snap = store.locationSnapshot;
    if (snap) {
      const parts = [snap.regionName, snap.cityName, snap.sectorName].filter(Boolean);
      return parts.length ? parts.join(' › ') : store.address || '—';
    }
    return store.address || '—';
  };

  const getRegionDisplay = (store: Store) => {
    return store.locationSnapshot?.regionName || '—';
  };

  const getCityDisplay = (store: Store) => {
    return store.locationSnapshot?.cityName || '—';
  };

  const getSectorDisplay = (store: Store) => {
    return store.locationSnapshot?.sectorName || '—';
  };

  // Admin "allow in public" — the in-place switch on this table (no separate
  // page). Hiding a shop cascades to its products' public visibility.
  const handleTogglePublic = async (row: Store) => {
    try {
      await storesService.setShowOnPublic(row.id, row.showOnPublic === false);
    } finally {
      refetch();
    }
  };

  // Lifecycle decisions straight from the table — same endpoints the pending
  // queue and the detail page use. approve/activate → APPROVED (publicly
  // visible); reject → INACTIVE and suspend → SUSPENDED (both hidden from the
  // marketplace, reason recorded on the shop).
  const handleStatusAction = async (
    row: Store,
    action: 'approve' | 'reject' | 'suspend' | 'activate'
  ) => {
    let reason: string | undefined;
    if (action === 'reject' || action === 'suspend') {
      const answer = window.prompt(
        action === 'reject'
          ? t('Reason for rejecting this shop (optional)')
          : t('Reason for suspending this shop (optional)'),
        ''
      );
      if (answer === null) return; // cancelled
      reason = answer || undefined;
    }

    setBusyId(row.id);
    try {
      if (action === 'approve') {
        await storesService.approve(row.id);
        showToast({ type: 'success', message: t('Shop approved') });
      } else if (action === 'reject') {
        await storesService.reject(row.id, reason);
        showToast({ type: 'success', message: t('Shop rejected') });
      } else if (action === 'suspend') {
        await storesService.suspend(row.id, reason);
        showToast({ type: 'success', message: t('Shop suspended') });
      } else {
        await storesService.activate(row.id);
        showToast({ type: 'success', message: t('Shop activated') });
      }
    } catch (err) {
      showToast({
        type: 'error',
        message: apiErrorMessage(err, t('Could not update this shop')),
      });
    } finally {
      setBusyId(null);
      refetch();
    }
  };

  const columns: Column<Store>[] = [
    {
      key: 'name',
      header: t('Shop'),
      width: '200px',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{row.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{row.ownerName || row.ownerEmail || '—'}</p>
        </div>
      ),
    },
    {
      key: 'owner',
      header: t('Owner'),
      width: '180px',
      render: (row) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {row.ownerId ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/sellers/${row.ownerId}`);
              }}
              className="text-primary-dark hover:underline dark:text-primary-color p-0 h-auto"
            >
              {row.ownerName || row.ownerEmail || '—'}
            </Button>
          ) : (
            row.ownerName || row.ownerEmail || '—'
          )}
        </span>
      ),
    },
    {
      key: 'business',
      header: t('Business'),
      width: '180px',
      render: (row) => (
        <div>
          {row.businessId ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/businesses/${row.businessId}`);
              }}
              className="text-sm text-primary-dark hover:underline dark:text-primary-color p-0 h-auto"
            >
              {row.businessName || '—'}
            </Button>
          ) : (
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {row.businessName || '—'}
            </span>
          )}
          {row.businessStatus && (
            <div className="text-xs text-gray-500">{row.businessStatus}</div>
          )}
        </div>
      ),
    },
    {
      key: 'location',
      header: t('Location'),
      width: '200px',
      render: (row) => (
        <div className="text-sm text-gray-700 dark:text-gray-300">
          <div>{getLocationDisplay(row)}</div>
          <div className="text-xs text-gray-400">{getSectorDisplay(row)}</div>
        </div>
      ),
    },
    {
      key: 'region',
      header: t('Region'),
      width: '120px',
      render: (row) => (
        <span className="text-xs text-gray-500">{getRegionDisplay(row)}</span>
      ),
    },
    {
      key: 'city',
      header: t('City'),
      width: '120px',
      render: (row) => (
        <span className="text-xs text-gray-500">{getCityDisplay(row)}</span>
      ),
    },
    {
      // Shop category (Category type 'business') — what the public /shops
      // filter uses. Blank on shops registered before the field existed.
      key: 'category',
      header: t('Category'),
      width: '120px',
      render: (row) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">{row.category || '—'}</span>
      ),
    },
    {
      key: 'status',
      header: t('Status'),
      width: '150px',
      render: (row) => <StatusBadge label={row.status} />,
    },
    {
      // Admin public-allow: controls whether this shop (and its products)
      // appears in any guest/public view. Click toggles in place.
      key: 'showOnPublic',
      header: t('Public'),
      width: '100px',
      render: (row) => {
        const allowed = row.showOnPublic !== false;
        return (
          <Button
            size="sm"
            variant={allowed ? 'outline' : 'ghost'}
            onClick={(e) => {
              e.stopPropagation(); // don't trigger the row's navigation
              handleTogglePublic(row);
            }}
            className={`text-xs ${
              allowed
                ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            title={
              allowed
                ? 'Visible in the public marketplace — click to hide'
                : 'Hidden from the public marketplace — click to allow'
            }
          >
            {allowed ? t('Public') : t('Hidden')}
          </Button>
        );
      },
    },
    {
      // Lifecycle decisions, contextual to the row's current status:
      // pending → Approve/Reject · approved/active → Suspend ·
      // suspended/inactive → Activate/Reject.
      key: 'actions',
      header: t('Actions'),
      width: '200px',
      render: (row) => {
        const isBusy = busyId === row.id;
        return (
          <div
            className="flex flex-wrap items-center gap-1.5"
            onClick={(e) => e.stopPropagation()} // don't trigger row navigation
          >
            {row.status === 'PENDING_APPROVAL' && (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  disabled={isBusy}
                  onClick={() => handleStatusAction(row, 'approve')}
                >
                  {t('Approve')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isBusy}
                  onClick={() => handleStatusAction(row, 'reject')}
                >
                  {t('Reject')}
                </Button>
              </>
            )}
            {(row.status === 'APPROVED' || row.status === 'ACTIVE') && (
              <Button
                size="sm"
                variant="danger"
                disabled={isBusy}
                onClick={() => handleStatusAction(row, 'suspend')}
              >
                {t('Suspend')}
              </Button>
            )}
            {(row.status === 'SUSPENDED' || row.status === 'INACTIVE') && (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  disabled={isBusy}
                  onClick={() => handleStatusAction(row, 'activate')}
                >
                  {t('Activate')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isBusy}
                  onClick={() => handleStatusAction(row, 'reject')}
                >
                  {t('Reject')}
                </Button>
              </>
            )}
          </div>
        );
      },
    },
    {
      key: 'ratings',
      header: t('Rating'),
      width: '80px',
      numeric: true,
      accessor: (row) =>
        row.ratings != null && Number(row.ratings) > 0
          ? Number(row.ratings).toFixed(1)
          : row.rating != null && Number(row.rating) > 0
            ? Number(row.rating).toFixed(1)
            : '—',
    },
    {
      key: 'createdAt',
      header: t('Created'),
      width: '120px',
      accessor: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—',
    },
  ];

  const statusOptions = [
    { value: 'all', label: t('All Statuses') },
    { value: 'PENDING_APPROVAL', label: t('Pending Approval') },
    { value: 'APPROVED', label: t('Approved') },
    { value: 'ACTIVE', label: t('Active') },
    { value: 'SUSPENDED', label: t('Suspended') },
    { value: 'INACTIVE', label: t('Inactive') },
  ];

  const sectorOptions = [
    { value: 'all', label: t('All Sectors') },
    ...sectors.map((item) => ({ value: item.id, label: item.name })),
  ];

  const handleResetFilters = () => {
    setSearch('');
    setStatus('all');
    setStatusParam('all');
    setSector('all');
    setBusinessId('');
    setOwnerEmail('');
    setPage(1);
  };

  const hasActiveFilters =
    search !== '' ||
    status !== 'all' ||
    sector !== 'all' ||
    businessId !== '' ||
    ownerEmail !== '';

  const filters: FilterDef[] = [
    {
      key: 'status',
      label: t('Status'),
      value: status,
      options: statusOptions,
      onChange: (v) => { setStatus(v); setStatusParam(v); setPage(1); },
    },
    {
      key: 'sector',
      label: t('Sector'),
      value: sector,
      options: sectorOptions,
      onChange: (v) => { setSector(v); setPage(1); },
    },
    {
      key: 'businessId',
      label: t('Business'),
      value: businessId,
      options: businessOptions,
      onChange: (v) => { setBusinessId(v); setPage(1); },
    },
    {
      key: 'ownerEmail',
      label: t('Owner Email'),
      value: ownerEmail,
      type: 'text',
      onChange: (v) => { setOwnerEmail(v); setPage(1); },
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('Stores')}
        description={t('Manage marketplace stores')}
      />

      {/* Modern Segmented Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3 dark:border-dark-700">
        {[
          { key: 'all', label: t('All Shops'), count: data?.total },
          { key: 'PENDING_APPROVAL', label: t('Pending Approval'), count: data?.statusCounts?.PENDING_APPROVAL },
          { key: 'APPROVED', label: t('Approved / Active'), count: (data?.statusCounts?.APPROVED ?? 0) + (data?.statusCounts?.ACTIVE ?? 0) },
          { key: 'SUSPENDED', label: t('Suspended'), count: data?.statusCounts?.SUSPENDED },
        ].map((tab) => {
          const isActive = status === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setStatus(tab.key);
                setStatusParam(tab.key);
                setPage(1);
              }}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-lime-500 text-white shadow-sm shadow-lime-500/25 dark:bg-lime-600'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80 dark:border-dark-600 dark:bg-dark-900 dark:text-slate-300 dark:hover:bg-dark-800'
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isActive
                      ? 'bg-white/25 text-white'
                      : 'bg-slate-100 text-slate-600 dark:bg-dark-800 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('Search by shop name or owner...')}
        filters={filters}
        onReset={handleResetFilters}
        isFiltered={hasActiveFilters}
        resultSummary={data?.total ? `${t('Showing')} ${data?.total} ${t('stores')}` : undefined}
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
            emptyTitle={t('No stores found')}
            onRowClick={(row) => navigate(`/stores/${row.id}`)}
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
