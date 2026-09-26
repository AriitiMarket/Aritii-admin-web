import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAsync } from '@/hooks/useAsync';
import { PageHeader } from '@/components/common/PageHeader';
import { PageLoader } from '@/components/common/PageLoader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Modal } from '@/components/common/Modal';
import { SelectField } from '@/components/forms/SelectField';
import { ridersService } from '@/services/riders.service';
import { dispatchService } from '@/services/dispatch.service';
import { ApiError } from '@/types/api';
import { formatDate } from '@/utils/format';
import {
  ASSIGNMENT_STATUS_LABELS,
  ASSIGNMENT_STATUS_VARIANTS,
  ORDER_STATUS_VARIANTS,
  assignmentStatusLabel,
  isReassignable,
  orderStatusLabel,
  summariseProgress,
} from './dispatch/statusLabels';

/**
 * Admin assignment detail (workflow section 10).
 *
 * Shows the rider, the assignment state, every order with its OWN status, the
 * seller-grouped pickup plan, the delivery zones, and the actions an admin can
 * still take: track the rider, cancel, or reassign to another rider.
 */
export function DeliveryAssignmentDetailPage() {
  const { assignmentId, deliveryId } = useParams<{ assignmentId: string; deliveryId: string }>();
  const id = assignmentId ?? deliveryId ?? '';
  const navigate = useNavigate();

  const [reassignOpen, setReassignOpen] = useState(false);
  const [riders, setRiders] = useState<{ id: string; name: string; vehicleType?: string }[]>([]);
  const [newRiderId, setNewRiderId] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: assignment, loading, error, refetch } = useAsync(
    () => dispatchService.get(id),
    [id]
  );

  const openReassign = () => {
    setActionError(null);
    setNewRiderId('');
    setReassignOpen(true);
    ridersService
      .list({ page: 1, limit: 100, status: 'available' })
      .then((r) => setRiders(r.items))
      .catch(() => setRiders([]));
  };

  const handleReassign = async () => {
    if (!newRiderId) return;
    setBusy(true);
    setActionError(null);
    try {
      const next = await dispatchService.reassign(id, newRiderId, 'Reassigned from assignment detail');
      setReassignOpen(false);
      navigate(`/delivery/assignments/${next._id}`);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to reassign');
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    setBusy(true);
    setActionError(null);
    try {
      await dispatchService.cancel(id, 'Cancelled by admin');
      refetch();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to cancel assignment');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <PageLoader />;
  if (error || !assignment) {
    return <ErrorState message={error ?? 'Assignment not found'} onRetry={refetch} />;
  }

  const progress = summariseProgress(assignment.deliveries.map((d) => d.status));
  const canReassign = isReassignable(assignment.status);

  return (
    <div>
      <PageHeader
        title={assignment.reference}
        description={`Rider: ${assignment.partnerName || '—'} • ${assignment.deliveries.length} order(s)`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => navigate('/delivery/assignments')}>
              Back
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/riders/${assignment.partnerId}`)}
              disabled={!assignment.partnerId}
            >
              Track Rider
            </Button>
            {canReassign && (
              <>
                <Button variant="outline" size="sm" onClick={openReassign} disabled={busy}>
                  Reassign
                </Button>
                <Button variant="danger" size="sm" onClick={handleCancel} loading={busy}>
                  Cancel
                </Button>
              </>
            )}
          </>
        }
      />

      {actionError && (
        <Card className="mb-4 border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-300">{actionError}</p>
        </Card>
      )}

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Status</h3>
          <StatusBadge
            label={assignmentStatusLabel(assignment.status)}
            variant={ASSIGNMENT_STATUS_VARIANTS[assignment.status] ?? 'neutral'}
          />
          <p className="mt-2 text-xs text-gray-500">{progress.label}</p>
        </Card>
        <Card className="p-4">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Rider</h3>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{assignment.partnerName || '—'}</p>
        </Card>
        <Card className="p-4">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Assigned</h3>
          <p className="text-sm text-gray-800 dark:text-gray-100">{formatDate(assignment.assignedAt)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Orders</h3>
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {assignment.deliveries.map((d) => (
              <li key={d.orderId} className="flex items-center justify-between gap-3 py-2">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{d.orderId}</p>
                  <p className="text-xs text-gray-500">Seller: {d.sellerName || d.shopName || '—'}</p>
                </div>
                <StatusBadge
                  label={orderStatusLabel(d.status)}
                  variant={ORDER_STATUS_VARIANTS[d.status] ?? 'neutral'}
                />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-200">
            Overall: {progress.label}
          </p>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Pickups</h3>
            <ol className="space-y-2">
              {assignment.pickupPlan.map((stop) => (
                <li key={stop.sellerId} className="flex items-start gap-2 text-sm">
                  <span aria-hidden>{stop.completed ? '✓' : '○'}</span>
                  <div>
                    <p className={stop.completed ? 'text-gray-500 line-through' : 'text-gray-800 dark:text-gray-100'}>
                      {stop.shopName || stop.sellerName}
                    </p>
                    <p className="text-xs text-gray-500">{stop.orderIds.join(', ')}</p>
                  </div>
                </li>
              ))}
              {assignment.pickupPlan.length === 0 && (
                <li className="text-sm text-gray-500">No pickup plan</li>
              )}
            </ol>
          </Card>

          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Delivery</h3>
            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-200">
              {assignment.zoneIds.map((z) => (
                <li key={z}>{z}</li>
              ))}
              {assignment.zoneIds.length === 0 && <li className="text-gray-500">No zone</li>}
            </ul>
          </Card>
        </div>
      </div>

      <Card className="mt-4 p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">History</h3>
        <ul className="space-y-2">
          {assignment.history.map((h, i) => (
            <li key={i} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-gray-700 dark:text-gray-200">
                {ASSIGNMENT_STATUS_LABELS[h.status] ?? h.status}
                {h.note ? ` — ${h.note}` : ''}
              </span>
              <span className="text-xs text-gray-500">{formatDate(h.at)}</span>
            </li>
          ))}
        </ul>
        {assignment.reassignedFromId && (
          <p className="mt-3 text-xs text-gray-500">
            Reassigned from an earlier assignment.{' '}
            <Link to={`/delivery/assignments/${assignment.reassignedFromId}`} className="underline">
              View previous
            </Link>
          </p>
        )}
      </Card>

      <Modal open={reassignOpen} onClose={() => setReassignOpen(false)} title="Reassign to another rider">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            The current assignment is kept in history and its orders move to the new rider.
          </p>
          <SelectField
            label="Select Rider"
            value={newRiderId}
            onChange={(e) => setNewRiderId(e.target.value)}
            options={riders.map((r) => ({ value: r.id, label: `${r.name} — ${r.vehicleType ?? 'rider'}` }))}
            placeholder="Select a rider"
          />
          {actionError && <p className="text-sm text-red-600">{actionError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setReassignOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleReassign} loading={busy} disabled={!newRiderId}>
              Reassign
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
