import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ridersService } from '@/services/riders.service';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { ErrorState } from '@/components/common/ErrorState';
import { Avatar } from '@/components/common/Avatar';
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
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
];

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  busy: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  offline: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  suspended: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export function RidersManagementPage() {
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
        } else if (bulkAction === 'set-busy') {
          await ridersService.updateStatus(riderId, 'busy');
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

  const getStatusColor = (s: string) => {
    return STATUS_COLORS[s] || 'bg-gray-100 text-gray-800';
  };

  const isActiveActor = (status: string) =>
    status === 'available' || status === 'busy' || status === 'offline';

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
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      key: 'name',
      header: 'Rider',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} size="sm" />
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-100">{row.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{row.phone || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      accessor: (row) => row.vehicleType || '—',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(row.status || '')}`}>
          {(row.status || '—').charAt(0).toUpperCase() + (row.status || '').slice(1)}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Active',
      render: (row) => (
        <span className={`text-sm ${isActiveActor(row.status) ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
          {isActiveActor(row.status) ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'sector',
      header: 'Coverage',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.sector || 'All'}
        </span>
      ),
    },
    {
      key: 'activeDeliveries',
      header: 'Active',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.activeDeliveries ?? 0} active
        </span>
      ),
    },
    {
      key: 'totalDeliveries',
      header: 'Total',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.totalDeliveries ?? 0}
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
        title="Riders / Delivery Actors"
        description="Manage delivery riders, availability, and assignments"
        actions={
          <div className="flex gap-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search riders"
              aria-label="Search"
            />
            <SelectField
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              options={RIDER_STATUSES}
              className="w-48"
            />
          </div>
        }
      />

      {selectedRiders.size > 0 && (
        <Card className="mb-4 flex items-center justify-between gap-4 p-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {selectedRiders.size} rider{selectedRiders.size !== 1 ? 's' : ''} selected
          </p>
          <div className="flex gap-2">
            <SelectField
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              options={[
                { value: '', label: 'Select Action' },
                { value: 'activate', label: 'Set Available' },
                { value: 'set-busy', label: 'Set Busy' },
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
              Apply
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
            emptyTitle="No riders found"
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
