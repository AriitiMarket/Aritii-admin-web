// Assignments Tab Component

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { SearchInput } from '@/components/common/SearchInput';
import { ErrorState } from '@/components/common/ErrorState';
import { Pagination } from '@/components/common/Pagination';
import { SelectField } from '@/components/forms/SelectField';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Modal } from '@/components/common/Modal';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { formatDate } from '@/utils/format';
import { locationsService, type Location } from '@/services/locations.service';
import { ridersService } from '@/services/riders.service';
import { assignmentsService } from '@/services/assignments.service';
import { deliveryAdmin } from '@/api/admin';
import { DELIVERY_STATUSES } from '../constants';
import { getDeliveryStatusColor, getValidTransitions } from '../utils/statusHelpers';
import { useAssignments } from '../hooks/useAssignments';
import type { Delivery } from '../types';
import type { Rider } from '@/types';

export function AssignmentsTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [regions, setRegions] = useState<Location[]>([]);
  const [cities, setCities] = useState<Location[]>([]);
  const [sectors, setSectors] = useState<Location[]>([]);
  const [availableRiders, setAvailableRiders] = useState<Rider[]>([]);
  const [ridersLoading, setRidersLoading] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState('');
  const [selectedDeliveryOrderId, setSelectedDeliveryOrderId] = useState('');
  const [selectedReassignDeliveryId, setSelectedReassignDeliveryId] = useState('');
  const [selectedReassignOrderId, setSelectedReassignOrderId] = useState('');
  const [selectedRiderId, setSelectedRiderId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data, loading, error, refetch } = useAssignments({
    page,
    status,
    search: debouncedSearch,
  });

  // Load regions
  useEffect(() => {
    locationsService.list({ type: 'region' }).then(setRegions).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedRegion) { setCities([]); return; }
    locationsService.getChildren(selectedRegion).then(setCities).catch(console.error);
  }, [selectedRegion]);

  useEffect(() => {
    if (!selectedCity) { setSectors([]); return; }
    locationsService.getChildren(selectedCity).then(setSectors).catch(console.error);
  }, [selectedCity]);

  const loadAvailableRiders = () => {
    setRidersLoading(true);
    ridersService.list({ page: 1, limit: 100, status: 'available' })
      .then((r) => setAvailableRiders(r.items))
      .catch(console.error)
      .finally(() => setRidersLoading(false));
  };

  const openAssignDialog = (deliveryId: string, orderId: string) => {
    setSelectedDeliveryId(deliveryId);
    setSelectedDeliveryOrderId(orderId);
    setSelectedRiderId('');
    setAssignDialogOpen(true);
    loadAvailableRiders();
  };

  const openReassignDialog = (deliveryId: string, orderId: string) => {
    setSelectedReassignDeliveryId(deliveryId);
    setSelectedReassignOrderId(orderId);
    setSelectedRiderId('');
    setReassignDialogOpen(true);
    loadAvailableRiders();
  };

  const handleAssign = async () => {
    if (!selectedDeliveryId || !selectedRiderId) return;
    setActionLoading(true);
    try {
      await assignmentsService.create({
        deliveryId: selectedDeliveryId,
        partnerId: selectedRiderId,
      });
      setAssignDialogOpen(false);
      refetch();
    } catch (err) {
      console.error('Assignment failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReassign = async () => {
    if (!selectedReassignDeliveryId || !selectedRiderId) return;
    setActionLoading(true);
    try {
      await assignmentsService.reassign(selectedReassignDeliveryId, selectedRiderId);
      setReassignDialogOpen(false);
      refetch();
    } catch (err) {
      console.error('Reassignment failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (deliveryId: string, newStatus: string) => {
    setActionLoading(true);
    try {
      await deliveryAdmin.updateDeliveryStatus(deliveryId, newStatus);
      refetch();
    } catch (err) {
      console.error('Status change failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<Delivery>[] = [
    {
      key: 'orderId',
      header: 'Order',
      render: (row) => (
        <span className="font-medium text-gray-800 dark:text-gray-100">
          {row.orderId || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getDeliveryStatusColor(row.status || '')}`}>
          {(row.status || '—').replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'partnerName',
      header: 'Rider',
      render: (row) => (
        <span className="text-sm text-gray-800 dark:text-gray-100">
          {row.partnerName || row.partnerId || <span className="text-gray-400">Unassigned</span>}
        </span>
      ),
    },
    {
      key: 'pickupAddress',
      header: 'Pickup',
      render: (row) => {
        const addr = row.pickupAddress;
        const location = [addr?.sectorName, addr?.cityName, addr?.regionName].filter(Boolean).join(', ');
        return (
          <div className="text-sm">
            <p className="font-medium text-gray-800 dark:text-gray-100">{addr?.shopName || '—'}</p>
            <p className="text-gray-500 dark:text-gray-400">{location || '—'}</p>
          </div>
        );
      },
    },
    {
      key: 'destinationAddress',
      header: 'Destination',
      render: (row) => {
        const addr = row.destinationAddress || row.deliveryAddress;
        const location = [addr?.sectorName, addr?.areaName, addr?.cityName, addr?.regionName].filter(Boolean).join(', ');
        return (
          <div className="text-sm">
            <p className="font-medium text-gray-800 dark:text-gray-100">{addr?.contactName || '—'}</p>
            <p className="text-gray-500 dark:text-gray-400">{location || '—'}</p>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => {
        const transitions = getValidTransitions(row.status);
        const showAssign = !row.partnerId && row.status === 'pending';
        const showReassign = row.partnerId && row.status !== 'delivered' && row.status !== 'cancelled' && row.status !== 'pending';
        return (
          <div className="flex gap-1 flex-wrap">
            {showAssign && (
              <Button
                size="sm"
                variant="primary"
                onClick={(e) => { e.stopPropagation(); openAssignDialog(row.id, row.orderId); }}
              >
                Assign
              </Button>
            )}
            {showReassign && (
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => { e.stopPropagation(); openReassignDialog(row.id, row.orderId); }}
              >
                Reassign
              </Button>
            )}
            {transitions.map((t: string) => (
              <Button
                key={t}
                size="sm"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); handleStatusChange(row.id, t); }}
                disabled={actionLoading}
              >
                {t.replace(/_/g, ' ')}
              </Button>
            ))}
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search order ID"
          aria-label="Search"
        />
        <SelectField
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          options={DELIVERY_STATUSES}
          className="w-48"
        />
      </div>

      {/* Location Filters */}
      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <SelectField
            label="Region"
            value={selectedRegion}
            onChange={(e) => { setSelectedRegion(e.target.value); setSelectedCity(''); setSelectedSector(''); }}
            options={[
              { value: '', label: 'All Regions' },
              ...regions.map((r) => ({ value: r._id, label: r.name })),
            ]}
            className="w-44"
          />
          <SelectField
            label="City/Area"
            value={selectedCity}
            onChange={(e) => { setSelectedCity(e.target.value); setSelectedSector(''); }}
            options={[
              { value: '', label: 'All Cities' },
              ...cities.map((c) => ({ value: c._id, label: c.name })),
            ]}
            className="w-44"
            disabled={!selectedRegion}
          />
          <SelectField
            label="Sector"
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            options={[
              { value: '', label: 'All Sectors' },
              ...sectors.map((s) => ({ value: s._id, label: s.name })),
            ]}
            className="w-44"
            disabled={!selectedCity}
          />
          {(selectedRegion || selectedCity || selectedSector) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSelectedRegion(''); setSelectedCity(''); setSelectedSector(''); }}
            >
              Clear Location Filters
            </Button>
          )}
        </div>
      </Card>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <DataTable<Delivery>
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(row) => row.id}
            loading={loading}
            emptyTitle="No deliveries found"
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

      {/* Assignment Dialog */}
      {assignDialogOpen && (
        <Modal open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} title="Assign Rider">
          <p className="text-sm text-gray-500 mb-4">Order: <span className="font-medium">{selectedDeliveryOrderId}</span></p>
          {ridersLoading ? (
            <p className="text-gray-400">Loading riders...</p>
          ) : availableRiders.length === 0 ? (
            <p className="text-gray-400">No available riders</p>
          ) : (
            <SelectField
              value={selectedRiderId}
              onChange={(e) => setSelectedRiderId(e.target.value)}
              options={availableRiders.map((r) => ({ value: r.id, label: `${r.name} — ${r.vehicleType}` }))}
              placeholder="Select a rider"
              className="w-full mb-4"
            />
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!selectedRiderId || ridersLoading}
              onClick={handleAssign}
            >
              {actionLoading ? 'Assigning...' : 'Assign'}
            </Button>
          </div>
        </Modal>
      )}

      {/* Reassignment Dialog */}
      {reassignDialogOpen && (
        <Modal open={reassignDialogOpen} onClose={() => setReassignDialogOpen(false)} title="Reassign Rider">
          <p className="text-sm text-gray-500 mb-4">Order: <span className="font-medium">{selectedReassignOrderId}</span></p>
          {ridersLoading ? (
            <p className="text-gray-400">Loading riders...</p>
          ) : availableRiders.length === 0 ? (
            <p className="text-gray-400">No available riders</p>
          ) : (
            <SelectField
              value={selectedRiderId}
              onChange={(e) => setSelectedRiderId(e.target.value)}
              options={availableRiders.map((r) => ({ value: r.id, label: `${r.name} — ${r.vehicleType}` }))}
              placeholder="Select a rider"
              className="w-full mb-4"
            />
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setReassignDialogOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!selectedRiderId || ridersLoading}
              onClick={handleReassign}
            >
              {actionLoading ? 'Reassigning...' : 'Reassign'}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}