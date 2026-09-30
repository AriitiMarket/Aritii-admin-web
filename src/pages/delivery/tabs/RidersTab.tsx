// Riders Tab Component with Modal Details

import { useState } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { SearchInput } from '@/components/common/SearchInput';
import { ErrorState } from '@/components/common/ErrorState';
import { Avatar } from '@/components/common/Avatar';
import { Pagination } from '@/components/common/Pagination';
import { SelectField } from '@/components/forms/SelectField';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Modal } from '@/components/common/Modal';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { formatDate } from '@/utils/format';
import { ridersService } from '@/services/riders.service';
import { RIDER_STATUSES, BULK_ACTIONS } from '../constants';
import { getRiderStatusColor, getRiderStatusLabel } from '../utils/statusHelpers';
import type { Rider } from '@/types';

export function RidersTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selectedRiders, setSelectedRiders] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [riderDetailModalOpen, setRiderDetailModalOpen] = useState(false);
  const [selectedRiderForDetail, setSelectedRiderForDetail] = useState<Rider | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
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

  const handleSelectAllRiders = () => {
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
      const statusMap = new Map((data?.items ?? []).map(r => [r.id, r.status]));
      const allowedFrom: Record<string, string[]> = {
        activate: ['pending', 'offline', 'busy'],
        deactivate: ['available', 'busy', 'offline', 'pending'],
        'set-busy': ['available', 'offline'],
      };
      const allowed = allowedFrom[bulkAction] ?? [];
      let skipped = 0;
      for (const riderId of selectedRiders) {
        const current = statusMap.get(riderId);
        if (current && !allowed.includes(current)) { skipped++; continue; }
        if (bulkAction === 'activate') {
          await ridersService.updateStatus(riderId, 'available');
        } else if (bulkAction === 'deactivate') {
          await ridersService.updateStatus(riderId, 'suspended');
        } else if (bulkAction === 'set-busy') {
          await ridersService.updateStatus(riderId, 'busy');
        }
      }
      if (skipped > 0) {
        console.warn(`Skipped ${skipped} rider(s): current status does not allow this transition`);
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

  const openRiderDetailModal = (rider: Rider) => {
    setSelectedRiderForDetail(rider);
    setRiderDetailModalOpen(true);
  };

  const handleToggleRiderStatus = async (rider: Rider) => {
    setActionLoading(true);
    try {
      const current = rider.status;
      let newStatus: string;
      if (current === 'available') {
        newStatus = 'busy';
      } else if (current === 'busy') {
        newStatus = 'available';
      } else if (current === 'pending' || current === 'suspended') {
        newStatus = 'offline';
      } else {
        newStatus = 'suspended';
      }
      await ridersService.updateStatus(rider.id, newStatus);
      await refetch();
      if (selectedRiderForDetail?.id === rider.id) {
        setSelectedRiderForDetail({ ...rider, status: newStatus as Rider['status'] });
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<Rider>[] = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={selectedRiders.size === data?.items?.length && (data?.items?.length ?? 0) > 0}
          onChange={handleSelectAllRiders}
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
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getRiderStatusColor(row.status || '')}`}>
          {getRiderStatusLabel(row.status)}
        </span>
      ),
    },
    {
      key: 'sector',
      header: 'Coverage',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.sectorId ? 'Assigned' : 'All'}
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
          {row.completedDeliveries ?? 0}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => { e.stopPropagation(); openRiderDetailModal(row); }}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
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

      {selectedRiders.size > 0 && (
        <Card className="mb-4 flex items-center justify-between gap-4 p-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {selectedRiders.size} rider{selectedRiders.size !== 1 ? 's' : ''} selected
          </p>
          <div className="flex gap-2">
            <SelectField
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              options={BULK_ACTIONS}
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

      {/* Rider Detail Modal */}
      {riderDetailModalOpen && selectedRiderForDetail && (
        <Modal
          open={riderDetailModalOpen}
          onClose={() => setRiderDetailModalOpen(false)}
          title={selectedRiderForDetail.name}
          size="lg"
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Profile Card */}
            <Card className="flex flex-col items-center gap-3 p-6 text-center">
              <Avatar name={selectedRiderForDetail.name} size="lg" />
              <p className="text-lg font-bold dark:text-white">{selectedRiderForDetail.name}</p>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${getRiderStatusColor(selectedRiderForDetail.status || '')}`}>
                {getRiderStatusLabel(selectedRiderForDetail.status)}
              </span>
              <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p>{selectedRiderForDetail.email ?? '—'}</p>
                <p>{selectedRiderForDetail.phone ?? '—'}</p>
                <p>Vehicle: {selectedRiderForDetail.vehicleType ?? '—'}</p>
              </div>
            </Card>

            {/* Details */}
            <Card className="lg:col-span-2 p-6">
              <h2 className="mb-4 text-lg font-semibold dark:text-white">Details</h2>
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Email</dt>
                  <dd className="text-gray-800 dark:text-gray-100">{selectedRiderForDetail.email ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Phone</dt>
                  <dd className="text-gray-800 dark:text-gray-100">{selectedRiderForDetail.phone ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Vehicle</dt>
                  <dd className="text-gray-800 dark:text-gray-100">{selectedRiderForDetail.vehicleType ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Zone</dt>
                  <dd className="text-gray-800 dark:text-gray-100">{selectedRiderForDetail.zoneIds?.length ? `${selectedRiderForDetail.zoneIds.length} zone(s)` : '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Sector Coverage</dt>
                  <dd className="text-gray-800 dark:text-gray-100">{selectedRiderForDetail.sectorId ? 'Assigned' : 'All sectors'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Active Deliveries</dt>
                  <dd className="text-gray-800 dark:text-gray-100">{selectedRiderForDetail.activeDeliveries ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Total Deliveries</dt>
                  <dd className="text-gray-800 dark:text-gray-100">{selectedRiderForDetail.completedDeliveries ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Joined</dt>
                  <dd className="text-gray-800 dark:text-gray-100">{formatDate(selectedRiderForDetail.createdAt)}</dd>
                </div>
              </dl>
            </Card>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRiderDetailModalOpen(false)}>
              Close
            </Button>
            <Button
              variant={selectedRiderForDetail.status === 'available' ? 'danger' : 'primary'}
              loading={actionLoading}
              onClick={() => handleToggleRiderStatus(selectedRiderForDetail)}
            >
              {selectedRiderForDetail.status === 'available' ? 'Set Busy' :
               selectedRiderForDetail.status === 'busy' ? 'Set Available' :
               selectedRiderForDetail.status === 'pending' ? 'Approve' :
               selectedRiderForDetail.status === 'suspended' ? 'Reactivate' : 'Suspend'}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}