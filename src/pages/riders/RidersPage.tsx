import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ridersService } from '@/services/riders.service';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { ErrorState } from '@/components/common/ErrorState';
import { Avatar } from '@/components/common/Avatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Pagination } from '@/components/common/Pagination';
import { SelectField } from '@/components/forms/SelectField';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { formatDate } from '@/utils/format';
import type { Rider } from '@/types';

const RIDER_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'available', label: 'Available' },
  { value: 'busy', label: 'Busy' },
  { value: 'offline', label: 'Offline' },
  { value: 'suspended', label: 'Suspended' },
];

export function RidersManagementPage() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selectedRiders, setSelectedRiders] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data, loading, error, refetch } = useAsync(
    () => ridersService.list({ page, limit: 10, search: debouncedSearch, status: status || undefined }),
    [page, debouncedSearch, status]
  );

  const handleSelectRider = (riderId: string) => {
    const newSelected = new Set(selectedRiders);
    if (newSelected.has(riderId)) {
      newSelected.delete(riderId);
    } else {
      newSelected.add(riderId);
    }
    setSelectedRiders(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRiders.size === data?.items?.length) {
      setSelectedRiders(new Set());
    } else {
      const allIds = new Set((data?.items ?? []).map(r => r.id));
      setSelectedRiders(allIds);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedRiders.size === 0) return;

    setBulkLoading(true);
    try {
      for (const riderId of selectedRiders) {
        if (bulkAction === 'activate') {
          await ridersService.updateStatus(riderId, 'available');
        } else if (bulkAction === 'deactivate') {
          await ridersService.updateStatus(riderId, 'suspended');
        }
      }
      setSelectedRiders(new Set());
      setBulkAction('');
      await refetch();
    } catch (err) {
      console.error('Bulk action failed:', err);
    } finally {
      setBulkLoading(false);
    }
  };

  const columns: Column<Rider>[] = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={selectedRiders.size === data?.items?.length && (data?.items?.length ?? 0) > 0}
          onChange={handleSelectAll}
          className="rounded border-gray-300"
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedRiders.has(row.id)}
          onChange={() => handleSelectRider(row.id)}
          className="rounded border-gray-300"
        />
      ),
    },
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
    {
      key: 'phone',
      header: t('Phone'),
      accessor: (row) => row.phone,
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      accessor: (row) => row.vehicleType || '—',
    },
    {
      key: 'status',
      header: t('Status'),
      render: (row) => <StatusBadge label={row.status} />,
    },
    {
      key: 'totalDeliveries',
      header: 'Deliveries',
      render: (row) => (
        <span className="text-gray-800 dark:text-gray-100">
          {row.totalDeliveries || 0}
        </span>
      ),
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
        title={t('Riders')}
        description={t('Manage delivery riders and actors')}
        actions={
          <div className="flex gap-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('Search riders')}
              aria-label={t('Search')}
            />
            <SelectField
              value={status}
              onChange={setStatus}
              options={RIDER_STATUSES}
              className="w-48"
            />
          </div>
        }
      />

      {/* Bulk Actions Bar */}
      {selectedRiders.size > 0 && (
        <Card className="mb-4 flex items-center justify-between gap-4 p-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {selectedRiders.size} rider{selectedRiders.size !== 1 ? 's' : ''} selected
          </p>
          <div className="flex gap-2">
            <SelectField
              value={bulkAction}
              onChange={setBulkAction}
              options={[
                { value: '', label: 'Select Action' },
                { value: 'activate', label: 'Activate' },
                { value: 'deactivate', label: 'Suspend' },
              ]}
              className="w-40"
            />
            <Button
              onClick={handleBulkAction}
              disabled={!bulkAction || bulkLoading}
              loading={bulkLoading}
              size="sm"
            >
              {t('Apply')}
            </Button>
          </div>
        </Card>
      )}

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <DataTable<Rider>
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(row) => row.id}
            loading={loading}
            emptyTitle={t('No riders')}
            onRowClick={(row) => navigate(`/riders/${row.id}`)}
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