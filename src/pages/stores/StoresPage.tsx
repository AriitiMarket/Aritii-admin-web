import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storesService } from '@/services/stores.service';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { useSector } from '@/hooks/useSector';
import { useToast } from '@/hooks/useToast';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { SelectField } from '@/components/forms/SelectField';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { apiErrorMessage } from '@/utils/error';
import type { Store } from '@/types';

export function StoresManagementPage() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const { sectors } = useSector();
  const { showToast } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
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
      render: (row) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {row.ownerName || row.ownerEmail || '—'}
        </span>
      ),
    },
    {
      key: 'location',
      header: t('Location'),
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
      render: (row) => (
        <span className="text-xs text-gray-500">{getRegionDisplay(row)}</span>
      ),
    },
    {
      key: 'city',
      header: t('City'),
      render: (row) => (
        <span className="text-xs text-gray-500">{getCityDisplay(row)}</span>
      ),
    },
    {
      // Shop category (Category type 'business') — what the public /shops
      // filter uses. Blank on shops registered before the field existed.
      key: 'category',
      header: t('Category'),
      render: (row) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">{row.category || '—'}</span>
      ),
    },
    {
      key: 'status',
      header: t('Status'),
      render: (row) => <StatusBadge label={row.status} />,
    },
    {
      // Admin public-allow: controls whether this shop (and its products)
      // appears in any guest/public view. Click toggles in place.
      key: 'showOnPublic',
      header: t('Public'),
      render: (row) => {
        const allowed = row.showOnPublic !== false;
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation(); // don't trigger the row's navigation
              handleTogglePublic(row);
            }}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition ${
              allowed
                ? 'bg-green-50 text-green-700 hover:bg-green-100'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            title={
              allowed
                ? 'Visible in the public marketplace — click to hide'
                : 'Hidden from the public marketplace — click to allow'
            }
          >
            {allowed ? t('Public') : t('Hidden')}
          </button>
        );
      },
    },
    {
      // Lifecycle decisions, contextual to the row's current status:
      // pending → Approve/Reject · approved/active → Suspend ·
      // suspended/inactive → Activate/Reject.
      key: 'actions',
      header: t('Actions'),
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

  return (
    <div>
      <PageHeader
        title={t('Stores')}
        description={t('Manage marketplace stores')}
      />

      {/* Filters */}
      <Card className="mb-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('Search by shop name or owner...')}
            aria-label={t('Search stores')}
          />
          <SelectField
            value={status}
            options={statusOptions}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            label={t('Status')}
          />
          <SelectField
            value={sector}
            options={sectorOptions}
            onChange={(e) => { setSector(e.target.value); setPage(1); }}
            label={t('Sector')}
          />
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('Business ID')}</label>
            <input
              type="text"
              value={businessId}
              onChange={(e) => { setBusinessId(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-dark-800 dark:text-white text-sm"
              placeholder={t('Filter by business')}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('Owner Email')}</label>
            <input
              type="email"
              value={ownerEmail}
              onChange={(e) => { setOwnerEmail(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-dark-800 dark:text-white text-sm"
              placeholder={t('Filter by owner')}
            />
          </div>
        </div>
        {(search || status !== 'all' || sector !== 'all' || businessId || ownerEmail) && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => {
                setSearch('');
                setStatus('all');
                setSector('all');
                setBusinessId('');
                setOwnerEmail('');
                setPage(1);
              }}
              className="text-sm text-primary-dark hover:underline dark:text-primary-color"
            >
              {t('Clear Filters')}
            </button>
          </div>
        )}
      </Card>

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
