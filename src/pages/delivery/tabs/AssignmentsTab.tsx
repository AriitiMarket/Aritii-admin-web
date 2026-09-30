// Assignments Tab Component

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Pagination } from '@/components/common/Pagination';
import { SelectField } from '@/components/forms/SelectField';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { FilterBar } from '@/components/workspace/FilterBar';
import { DataSection } from '@/components/workspace/DataSection';
import { formatDate } from '@/utils/format';
import { locationsService, type Location } from '@/services/locations.service';
import { assignmentsService, type EligiblePartner } from '@/services/assignments.service';
import { deliveryAdmin } from '@/api/admin';
import { DELIVERY_STATUSES, ASSIGNABLE_STATUSES, REASSIGNABLE_STATUSES } from '../constants';
import { getDeliveryStatusColor, getManualTransitions } from '../utils/statusHelpers';
import { StatusChangeDialog } from '../components/StatusChangeDialog';
import { useAssignments } from '../hooks/useAssignments';
import type { Delivery } from '../types';
import { useToast } from '@/hooks/useToast';
import { ApiError } from '@/types/api';

export function AssignmentsTab() {
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [regions, setRegions] = useState<Location[]>([]);
  const [cities, setCities] = useState<Location[]>([]);
  const [sectors, setSectors] = useState<Location[]>([]);
  const [eligibleRiders, setEligibleRiders] = useState<EligiblePartner[]>([]);
  const [ridersLoading, setRidersLoading] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState('');
  const [selectedDeliveryOrderId, setSelectedDeliveryOrderId] = useState('');
  const [selectedReassignDeliveryId, setSelectedReassignDeliveryId] = useState('');
  const [selectedReassignOrderId, setSelectedReassignOrderId] = useState('');
  const [selectedRiderId, setSelectedRiderId] = useState('');
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [changeReq, setChangeReq] = useState<{ row: Delivery; next: string } | null>(null);
  const [changeError, setChangeError] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const isFiltered = !!(debouncedSearch || status || selectedRegion || selectedCity || selectedSector);

  const { data, loading, error, refetch } = useAssignments({
    page,
    status,
    search: debouncedSearch,
    sectorId: selectedSector || undefined,
  });

  // Region → City → Sector cascade; the chosen sector filters the queue.
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

  /**
   * Riders offered in the dialogs are the ones the backend will actually
   * accept for THIS delivery (§8) — not every available rider.
   */
  const loadEligibleRiders = async (deliveryId: string) => {
    setRidersLoading(true);
    setDialogError(null);
    try {
      setEligibleRiders(await assignmentsService.eligiblePartners({ deliveryId }));
    } catch (err) {
      setDialogError(err instanceof ApiError ? err.message : 'Failed to load eligible riders');
      setEligibleRiders([]);
    } finally {
      setRidersLoading(false);
    }
  };

  const openAssignDialog = (deliveryId: string, orderId: string) => {
    setSelectedDeliveryId(deliveryId);
    setSelectedDeliveryOrderId(orderId);
    setSelectedRiderId('');
    setAssignDialogOpen(true);
    void loadEligibleRiders(deliveryId);
  };

  const openReassignDialog = (deliveryId: string, orderId: string) => {
    setSelectedReassignDeliveryId(deliveryId);
    setSelectedReassignOrderId(orderId);
    setSelectedRiderId('');
    setReassignDialogOpen(true);
    void loadEligibleRiders(deliveryId);
  };

  const handleAssign = async () => {
    if (!selectedDeliveryId || !selectedRiderId) return;
    setActionLoading(true);
    setDialogError(null);
    try {
      await assignmentsService.create({
        deliveryId: selectedDeliveryId,
        providerId: selectedRiderId,
      });
      setAssignDialogOpen(false);
      showToast({ type: 'success', message: `Order ${selectedDeliveryOrderId} assigned` });
      refetch();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Assignment failed';
      setDialogError(message);
      showToast({ type: 'error', message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReassign = async () => {
    if (!selectedReassignDeliveryId || !selectedRiderId) return;
    setActionLoading(true);
    setDialogError(null);
    try {
      await assignmentsService.reassign(selectedReassignDeliveryId, selectedRiderId);
      setReassignDialogOpen(false);
      showToast({ type: 'success', message: `Order ${selectedReassignOrderId} reassigned` });
      refetch();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Reassignment failed';
      setDialogError(message);
      showToast({ type: 'error', message });
    } finally {
      setActionLoading(false);
    }
  };

  const openStatusChange = (row: Delivery, nextStatus: string) => {
    setChangeError(null);
    setChangeReq({ row, next: nextStatus });
  };

  /** Fire the requested transition with the payload the dialog collected. */
  const confirmStatusChange = async (extra: Record<string, unknown>) => {
    if (!changeReq) return;
    setActionLoading(true);
    setChangeError(null);
    try {
      await deliveryAdmin.updateDeliveryStatus(changeReq.row.id, changeReq.next, extra);
      setChangeReq(null);
      showToast({ type: 'success', message: `Delivery ${changeReq.row.orderId} → ${changeReq.next.replace(/_/g, ' ')}` });
      refetch();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to change delivery status';
      setChangeError(message);
      showToast({ type: 'error', message });
    } finally {
      setActionLoading(false);
    }
  };

  const riderOptions = eligibleRiders.map((r) => ({
    value: r._id,
    label: `${r.name} — ${r.activeDeliveries ?? 0}/${r.maxActiveAssignments ?? '—'} active`,
  }));

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
          {row.providerName || row.partnerName || (row.providerId ? 'Assigned' : <span className="text-gray-400">Unassigned</span>)}
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
        const transitions = getManualTransitions(row.status || '');
        // New assignment: an unowned delivery in the ready pool (or a
        // requeued `reassigned` one) — states where no active assignment can
        // exist and `assigned` is a legal transition.
        const showAssign = ASSIGNABLE_STATUSES.includes(row.status || '');
        // Hand-over to another rider: only states the reassign flow can move
        // through `reassigned` (see REASSIGNABLE_STATUSES).
        const showReassign = REASSIGNABLE_STATUSES.includes(row.status || '');
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
                onClick={(e) => { e.stopPropagation(); openStatusChange(row, t); }}
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

  const resetFilters = () => {
    setSearch('');
    setStatus('');
    setSelectedRegion('');
    setSelectedCity('');
    setSelectedSector('');
    setPage(1);
  };

  return (
    <>
      <FilterBar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search order ID"
        filters={[
          {
            key: 'status',
            label: 'Status',
            value: status,
            options: DELIVERY_STATUSES,
            onChange: (v) => { setStatus(v); setPage(1); },
          },
          {
            key: 'region',
            label: 'Region',
            value: selectedRegion,
            options: [
              { value: '', label: 'All Regions' },
              ...regions.map((r) => ({ value: r._id, label: r.name })),
            ],
            onChange: (v) => { setSelectedRegion(v); setSelectedCity(''); setSelectedSector(''); setPage(1); },
          },
          {
            key: 'city',
            label: 'City',
            value: selectedCity,
            options: [
              { value: '', label: 'All Cities' },
              ...cities.map((c) => ({ value: c._id, label: c.name })),
            ],
            onChange: (v) => { setSelectedCity(v); setSelectedSector(''); setPage(1); },
          },
          {
            key: 'sector',
            label: 'Sector',
            value: selectedSector,
            options: [
              { value: '', label: 'All Sectors' },
              ...sectors.map((s) => ({ value: s._id, label: s.name })),
            ],
            onChange: (v) => { setSelectedSector(v); setPage(1); },
          },
        ]}
        onReset={resetFilters}
        isFiltered={isFiltered}
        resultSummary={
          data?.total !== undefined
            ? `${data.total} deliver${data.total === 1 ? 'y' : 'ies'}${isFiltered ? ' matching filters' : ''}`
            : undefined
        }
      />

      <DataSection
        error={error}
        onRetry={refetch}
        isEmpty={!loading && (data?.items ?? []).length === 0}
        emptyTitle={isFiltered ? 'No deliveries match these filters' : 'No deliveries to assign'}
        emptyDescription="Deliveries appear here once they are pending and need a rider."
      >
        <DataTable<Delivery>
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(row) => row.id}
          loading={loading}
        />
        <Pagination
          className="mt-4"
          page={page}
          totalPages={data?.totalPages ?? 0}
          total={data?.total}
          onPageChange={setPage}
        />
      </DataSection>

      {/* Assignment Dialog */}
      {assignDialogOpen && (
        <Modal open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} title="Assign Rider">
          <p className="text-sm text-gray-500 mb-4">Order: <span className="font-medium">{selectedDeliveryOrderId}</span></p>
          {dialogError && <p className="mb-3 text-sm text-red-600">{dialogError}</p>}
          {ridersLoading ? (
            <p className="text-gray-400">Loading eligible riders…</p>
          ) : eligibleRiders.length === 0 ? (
            <p className="text-gray-400">No riders are eligible for this delivery.</p>
          ) : (
            <SelectField
              value={selectedRiderId}
              onChange={(e) => setSelectedRiderId(e.target.value)}
              options={riderOptions}
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
          {dialogError && <p className="mb-3 text-sm text-red-600">{dialogError}</p>}
          {ridersLoading ? (
            <p className="text-gray-400">Loading eligible riders…</p>
          ) : eligibleRiders.length === 0 ? (
            <p className="text-gray-400">No riders are eligible for this delivery.</p>
          ) : (
            <SelectField
              value={selectedRiderId}
              onChange={(e) => setSelectedRiderId(e.target.value)}
              options={riderOptions}
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

      {/* Status-change dialog (reason / proof collection before the PUT) */}
      <StatusChangeDialog
        open={!!changeReq}
        delivery={changeReq?.row ?? null}
        nextStatus={changeReq?.next ?? ''}
        busy={actionLoading}
        error={changeError}
        onClose={() => { setChangeReq(null); setChangeError(null); }}
        onConfirm={confirmStatusChange}
      />
    </>
  );
}
