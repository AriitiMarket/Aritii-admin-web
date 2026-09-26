import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { Modal } from '@/components/common/Modal';
import { routesService } from '@/services/locations.service';
import { useAsync } from '@/hooks/useAsync';
import { EnhancedRouteForm } from './components/EnhancedRouteForm';

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  suspended: 'Suspended',
  archived: 'Archived',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  suspended: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  archived: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

function extractLocationId(id: unknown): string | undefined {
  if (typeof id === 'string') return id;
  if (id && typeof id === 'object') {
    const obj = id as { _id?: string; id?: string };
    return obj._id || obj.id;
  }
  return undefined;
}

export default function RouteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: route, loading, error, refetch } = useAsync(() => routesService.get(id!), [id]);

  const [showEdit, setShowEdit] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-red-600 dark:text-red-400">
          {error || 'Route not found'}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate('/delivery/routes')}
        >
          Back to Routes
        </Button>
      </div>
    );
  }

  const originName =
    route.originLocationName ||
    (typeof route.originLocationId === 'object'
      ? (route.originLocationId as { name?: string }).name
      : undefined);
  const destName =
    route.destinationLocationName ||
    (typeof route.destinationLocationId === 'object'
      ? (route.destinationLocationId as { name?: string }).name
      : undefined);

  const editInitial = {
    ...route,
    originLocationId: extractLocationId(route.originLocationId) || '',
    destinationLocationId: extractLocationId(route.destinationLocationId) || '',
  };

  return (
    <div>
      <PageHeader
        title={route.name || 'Delivery Route'}
        description={`Route Details • ID: ${route._id}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/delivery/routes')}>
              Back
            </Button>
            <Button variant="outline" onClick={() => setShowEdit(true)}>
              Edit
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Main info */}
        <Card className="p-4 lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
            Route Details
          </h2>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Name</dt>
              <dd className="mt-0.5 text-sm text-gray-900 dark:text-white">{route.name}</dd>
            </div>
            {route.code && (
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Code</dt>
                <dd className="mt-0.5 text-sm text-gray-900 dark:text-white">{route.code}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</dt>
              <dd className="mt-0.5">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    STATUS_STYLES[route.status] || STATUS_STYLES.inactive
                  }`}
                >
                  {STATUS_LABELS[route.status] || route.status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Distance</dt>
              <dd className="mt-0.5 text-sm text-gray-900 dark:text-white">
                {route.distanceKm != null ? `${route.distanceKm} km` : route.distance != null ? `${route.distance} km` : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Estimated Duration</dt>
              <dd className="mt-0.5 text-sm text-gray-900 dark:text-white">
                {route.estimatedDurationMinutes != null
                  ? `${route.estimatedDurationMinutes} min`
                  : route.estimatedDuration != null
                  ? `${route.estimatedDuration} min`
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Origin</dt>
              <dd className="mt-0.5 text-sm text-gray-900 dark:text-white">{originName || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Destination</dt>
              <dd className="mt-0.5 text-sm text-gray-900 dark:text-white">{destName || '—'}</dd>
            </div>
            {route.priority != null && (
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Priority</dt>
                <dd className="mt-0.5 text-sm text-gray-900 dark:text-white">{route.priority}</dd>
              </div>
            )}
            {route.maxCapacity != null && (
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Max Capacity</dt>
                <dd className="mt-0.5 text-sm text-gray-900 dark:text-white">{route.maxCapacity}</dd>
              </div>
            )}
            {route.providerId && (
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Provider</dt>
                <dd className="mt-0.5 text-sm text-gray-900 dark:text-white">{route.providerId}</dd>
              </div>
            )}
            {route.description && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Description</dt>
                <dd className="mt-0.5 text-sm text-gray-900 dark:text-white">{route.description}</dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Additional info */}
        <Card className="p-4">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
            Additional Information
          </h2>
          {route.operatingHours && (
            <div className="mb-4">
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Operating Hours</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {route.operatingHours.open} – {route.operatingHours.close}
                {route.operatingHours.days?.length ? ` (${route.operatingHours.days.join(', ')})` : ''}
              </dd>
            </div>
          )}
          {route.waypoints && route.waypoints.length > 0 && (
            <div className="mb-4">
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Waypoints</dt>
              <dd className="mt-1 flex flex-wrap gap-1">
                {route.waypoints.map((w, i) => (
                  <span
                    key={i}
                    className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  >
                    {w}
                  </span>
                ))}
              </dd>
            </div>
          )}
          {route.vehicleRequirements && route.vehicleRequirements.length > 0 && (
            <div className="mb-4">
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Vehicle Requirements</dt>
              <dd className="mt-1 flex flex-wrap gap-1">
                {route.vehicleRequirements.map((v, i) => (
                  <span
                    key={i}
                    className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  >
                    {v}
                  </span>
                ))}
              </dd>
            </div>
          )}
          {route.riderRequirements && route.riderRequirements.length > 0 && (
            <div>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Rider Requirements</dt>
              <dd className="mt-1 flex flex-wrap gap-1">
                {route.riderRequirements.map((r, i) => (
                  <span
                    key={i}
                    className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  >
                    {r}
                  </span>
                ))}
              </dd>
            </div>
          )}
        </Card>
      </div>

      {/* Edit modal */}
      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit Route"
        size="lg"
      >
        <EnhancedRouteForm
          initial={editInitial}
          onSuccess={() => {
            setShowEdit(false);
            refetch();
          }}
          onCancel={() => setShowEdit(false)}
        />
      </Modal>
    </div>
  );
}