/**
 * Tracking detail for ONE delivery: delivery information, current location, last
 * known update, the movement history and the delivery events.
 *
 * It is ONE simple scrollable panel (summary + stacked sections) instead of a
 * nested tab set — the operator opens it from the Tracking table's "Track"
 * button and reads everything top to bottom without hunting for the right tab.
 *
 * Read-only by design. The canonical delivery status is displayed from the
 * DELIVERY RECORD and is never derived from the event feed, and there is no
 * control anywhere here that writes a status or a coordinate — both belong to
 * the Deliveries page and the provider app respectively.
 */
import { RecordDrawer } from '@/components/workspace/RecordDrawer';
import { Facts } from '@/components/workspace/DetailList';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { formatDateTime, truncate } from '@/utils/format';
import type { TrackingEvent, TrackingLocation } from '@/services/tracking.service';
import type { Delivery } from '../types';
import { DeliveryStatusPill } from '../components/DeliveryStatusPill';
import { getDeliveryStatusLabel } from '../utils/statusHelpers';
import { TrackingMap } from './TrackingMap';
import {
  LOCATION_FRESHNESS,
  getLocationFreshness,
  relativeAge,
  formatCoordinates,
  explainEvent,
  type LocationFreshness,
} from './trackingHelpers';

const destOf = (d?: Delivery) => {
  const a = d?.destinationAddress ?? d?.deliveryAddress;
  return [a?.cityName, a?.regionName].filter(Boolean).join(', ');
};

function LocationPanel({ location }: { location: TrackingLocation | null }) {
  const coords = location?.coordinates;
  const freshness: LocationFreshness = getLocationFreshness(location?.timestamp);
  const meta = freshness === 'none' ? null : LOCATION_FRESHNESS[freshness];
  const shown = formatCoordinates(coords);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {meta ? (
          <StatusBadge label={meta.label} variant={meta.variant} />
        ) : (
          <StatusBadge label="No location" variant="neutral" />
        )}
        {location?.timestamp && (
          <span className="text-xs text-gray-500">
            Last ping {relativeAge(location.timestamp)} · {formatDateTime(location.timestamp)}
          </span>
        )}
      </div>

      {meta && <p className="text-xs text-gray-500">{meta.hint}</p>}

      {shown ? (
        <Facts
          items={[
            ['Coordinates', shown],
            ['Accuracy', location?.accuracy != null ? `±${Math.round(location.accuracy)} m` : '—'],
            ['Speed', location?.speed != null ? `${location.speed.toFixed(1)} km/h` : '—'],
            ['Heading', location?.heading != null ? `${Math.round(location.heading)}°` : '—'],
          ]}
        />
      ) : (
        <p className="text-sm text-gray-500">
          The provider has not reported a position for this delivery. This is a gap in location
          reporting, not a delivery status.
        </p>
      )}
    </div>
  );
}

function TimelineTab({ events }: { events: TrackingEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-gray-500">No tracking events recorded yet.</p>;
  }
  const ordered = [...events].sort(
    (a, b) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime()
  );

  return (
    <ol>
      {ordered.map((e, i) => {
        const at = e.timestamp || e.createdAt;
        const coords = formatCoordinates(e.location?.coordinates);
        return (
          <li key={`${at}-${i}`} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-dark" />
              {i < ordered.length - 1 && <span className="w-px flex-1 bg-gray-200 dark:bg-dark-600" />}
            </div>
            <div className="pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <DeliveryStatusPill status={e.status} />
                <span className="text-xs text-gray-500">{formatDateTime(at)}</span>
                <span className="text-xs text-gray-400">({relativeAge(at)})</span>
              </div>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{explainEvent(e.status, e.note)}</p>
              {(coords || e.accuracy != null || e.speed != null) && (
                <p className="mt-1 text-xs text-gray-500">
                  {coords}
                  {e.accuracy != null ? ` · ±${Math.round(e.accuracy)} m` : ''}
                  {e.speed != null ? ` · ${e.speed.toFixed(1)} km/h` : ''}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Small uppercase section heading for the stacked panel sections. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 last:mb-0">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {title}
      </h3>
      {children}
    </section>
  );
}

export interface TrackingDetailDrawerProps {
  delivery: Delivery | null;
  events: TrackingEvent[];
  location: TrackingLocation | null;
  open: boolean;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
  onOpenDelivery: () => void;
}

export function TrackingDetailDrawer({
  delivery,
  events,
  location,
  open,
  loading,
  error,
  onClose,
  onRetry,
  onOpenDelivery,
}: TrackingDetailDrawerProps) {
  const freshness = getLocationFreshness(location?.timestamp);

  // ONE scrollable panel: delivery facts, then current location, then history.
  const body = (
    <div>
      <Section title="Delivery information">
        {delivery ? (
          <Facts
            items={[
              ['Delivery ID', delivery.id],
              ['Order ID', delivery.orderId],
              ['Status', getDeliveryStatusLabel(delivery.status)],
              ['Provider', delivery.providerName || delivery.partnerName || 'Unassigned'],
              ['Seller / shop', delivery.shopName || delivery.sellerName || '—'],
              ['Destination', destOf(delivery) || '—'],
              ['Created', formatDateTime(delivery.createdAt)],
              ['Last update', formatDateTime(delivery.updatedAt)],
              ['Picked up', formatDateTime(delivery.pickedUpAt)],
              ['Delivered', formatDateTime(delivery.deliveredAt)],
            ]}
          />
        ) : (
          <p className="text-sm text-gray-500">Delivery record unavailable.</p>
        )}
      </Section>

      <Section title="Current location">
        <div className="space-y-4">
          <LocationPanel location={location} />
          <TrackingMap events={events} />
          {events.some((e) => e.location?.coordinates) && (
            <p className="text-xs text-gray-400">
              Map shows recorded pings only. Positions are reported by the provider; the console
              cannot add or correct them.
            </p>
          )}
        </div>
      </Section>

      <Section title="Timeline & events">
        <TimelineTab events={events} />
      </Section>
    </div>
  );

  return (
    <RecordDrawer
      open={open}
      onClose={onClose}
      title={delivery ? `Delivery ${truncate(delivery.id, 18)}` : 'Tracking'}
      subtitle="Location and movement history"
      statusLabel={delivery ? getDeliveryStatusLabel(delivery.status) : undefined}
      statusVariant={undefined}
      actions={
        <>
          {delivery && (
            <Button size="sm" variant="outline" onClick={onOpenDelivery}>
              Open delivery record
            </Button>
          )}
          {location?.coordinates && (
            <span className="text-xs text-gray-500">
              {freshness === 'none' ? 'No location' : LOCATION_FRESHNESS[freshness].label} ·{' '}
              {relativeAge(location.timestamp)}
            </span>
          )}
        </>
      }
      summary={
        delivery
          ? [
              { label: 'Order', value: delivery.orderId },
              { label: 'Provider', value: delivery.providerName || delivery.partnerName || 'Unassigned' },
              { label: 'Destination', value: destOf(delivery) || '—' },
              { label: 'Events', value: String(events.length) },
            ]
          : []
      }
      body={body}
      loading={loading}
      error={error}
      onRetry={onRetry}
    />
  );
}
