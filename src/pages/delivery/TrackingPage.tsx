import { useState, useCallback } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { SearchInput } from '@/components/common/SearchInput';
import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { formatDate } from '@/utils/format';
import { trackingService, type TrackingEvent } from '@/services/tracking.service';
import { getDeliveryStatusColor } from './utils/statusHelpers';
import { useToast } from '@/hooks/useToast';
import { ApiError } from '@/types/api';

const STATUS_LABELS: Record<TrackingEvent['status'], string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  pickup: 'Picked Up',
  in_transit: 'In Transit',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  failed: 'Failed',
  cancelled: 'Cancelled',
  reassigned: 'Reassigned',
};

function StatusPill({ status }: { status: TrackingEvent['status'] }) {
  const label = STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${getDeliveryStatusColor(status)}`}>
      {label}
    </span>
  );
}

export function TrackingPage() {
  const [query, setQuery] = useState('');
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [nearby, setNearby] = useState<TrackingEvent[] | null>(null);
  const [latestLocation, setLatestLocation] = useState<{ coordinates?: [number, number]; accuracy?: number; speed?: number; heading?: number; timestamp?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ id: string; orderId: string } | null>(null);
  const { showToast } = useToast();

  /** One tracked delivery: history + latest location. Used by the Track button. */
  const loadEvents = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setNearby(null);
    try {
      const [eventRes, locationRes] = await Promise.all([
        trackingService.getEvents(id),
        trackingService.getLatestLocation(id),
      ]);
      setEvents(eventRes);
      setLatestLocation(locationRes);
      setSelected({ id, orderId: id });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load tracking events';
      setError(message);
      showToast({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const loadNearby = useCallback(async (longitude: number, latitude: number) => {
    try {
      const result = await trackingService.getNearby({ longitude, latitude });
      setNearby(result);
      if (result.length === 0) {
        showToast({ type: 'info', message: 'No events near this location' });
      }
    } catch (err) {
      showToast({
        type: 'error',
        message: err instanceof ApiError ? err.message : 'Failed to load nearby events',
      });
    }
  }, [showToast]);

  return (
    <div>
      <PageHeader
        title="Tracking"
        description="Track a delivery through its operational stages — event history and latest location."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-4 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Find a delivery</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Search by order ID or delivery ID.</p>
          <div className="flex flex-wrap gap-2">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Enter order ID or delivery ID"
              aria-label="Order or delivery ID"
            />
            <Button
              onClick={() => loadEvents(query.trim())}
              disabled={!query.trim() || loading}
            >
              Track
            </Button>
          </div>
        </Card>

        <div className="flex flex-col gap-4 lg:col-span-3">
          {error ? (
            <ErrorState message={error} onRetry={() => loadEvents(query.trim())} />
          ) : loading ? (
            <Card className="p-4 text-center">
              <p className="text-sm text-gray-500">Loading tracking events…</p>
            </Card>
          ) : selected ? (
            <>
              <Card className="p-4">
                <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">{selected.orderId || selected.id}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tracking events for delivery {selected.id}</p>
              </Card>

              <Card className="p-4">
                <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Event History</h4>
                {events.length === 0 ? (
                  <p className="text-sm text-gray-500">No tracking events yet.</p>
                ) : (
                  <div className="space-y-3">
                    {events.map((e, i) => (
                      <div key={i} className="flex gap-3 rounded-lg border border-gray-100 dark:border-dark-800 p-3">
                        <span className="w-28 shrink-0 text-xs text-gray-500">{formatDate(e.timestamp)}</span>
                        <StatusPill status={e.status} />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{e.note || '—'}</span>
                        {e.location?.coordinates && (
                          <span className="shrink-0 text-xs font-mono text-gray-500">
                            {e.location.coordinates[1].toFixed(4)}, {e.location.coordinates[0].toFixed(4)}
                          </span>
                        )}
                        {e.accuracy !== undefined && (
                          <span className="shrink-0 text-xs text-gray-500">±{e.accuracy} m</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-4">
                <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Latest Location</h4>
                {latestLocation?.coordinates ? (
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-gray-800 dark:text-gray-100">
                      {latestLocation.coordinates[1].toFixed(4)}, {latestLocation.coordinates[0].toFixed(4)}
                    </p>
                    {latestLocation.accuracy !== undefined && (
                      <p className="text-xs text-gray-500">±{latestLocation.accuracy} m accuracy</p>
                    )}
                    {latestLocation.speed !== undefined && (
                      <p className="text-xs text-gray-500">{latestLocation.speed.toFixed(1)} km/h</p>
                    )}
                    {latestLocation.timestamp && (
                      <p className="text-xs text-gray-500">{formatDate(latestLocation.timestamp)}</p>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => loadNearby(latestLocation.coordinates![0], latestLocation.coordinates![1])}
                      className="mt-2"
                    >
                      Nearby events
                    </Button>
                  </div>
                ) : latestLocation ? (
                  <p className="text-sm text-gray-500">No coordinates attached to the latest location.</p>
                ) : (
                  <p className="text-sm text-gray-500">No locations tracked yet.</p>
                )}

                {nearby && nearby.length > 0 && (
                  <div className="mt-3 border-t border-gray-100 pt-3 dark:border-dark-800">
                    <h5 className="mb-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                      Events within 5 km ({nearby.length})
                    </h5>
                    <ul className="space-y-2">
                      {nearby.slice(0, 10).map((e, i) => (
                        <li key={i} className="flex items-center gap-3 text-xs">
                          <span className="w-28 shrink-0 text-gray-500">{formatDate(e.timestamp)}</span>
                          <StatusPill status={e.status} />
                          <span className="text-gray-500">{e.note || '—'}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            </>
          ) : (
            <Card className="p-4 text-center text-sm text-gray-500">
              Enter an order or delivery ID above to see its event history and latest location.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
