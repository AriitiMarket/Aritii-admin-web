/**
 * Tracking-specific presentation helpers.
 *
 * IMPORTANT: nothing here defines a delivery status. Tracking is LOCATION and
 * HISTORY information; the delivery's canonical status always comes from the
 * delivery record via `DeliveryStatusPill` / `getDeliveryStatusLabel`.
 *
 * The "freshness" scale below deliberately describes the age of a *coordinate*,
 * not the state of a delivery. A stale ping says "we last heard from this driver
 * 3 hours ago" — it says nothing about whether the delivery is in transit,
 * delivered or failed, and it never changes the canonical status.
 */
import type { DeliveryStatus } from '../types';

/** How recently a location ping was received, in minutes. */
export type LocationFreshness = 'live' | 'recent' | 'stale' | 'expired' | 'none';

export const LOCATION_FRESHNESS: Record<
  Exclude<LocationFreshness, 'none'>,
  { label: string; hint: string; variant: 'success' | 'info' | 'warning' | 'danger' }
> = {
  live: { label: 'Live', hint: 'Pinged in the last 15 minutes', variant: 'success' },
  recent: { label: 'Recent', hint: 'Pinged in the last hour', variant: 'info' },
  stale: { label: 'Stale', hint: 'No ping for over an hour — position may have moved', variant: 'warning' },
  expired: { label: 'Very stale', hint: 'No ping for over 6 hours — treat the position as historical', variant: 'danger' },
};

const MINUTE = 60_000;

/**
 * Age bucket for a location timestamp. `null` when there is no coordinate at
 * all, which is reported separately so the UI can say "no location" rather than
 * implying a stale one.
 */
export function getLocationFreshness(timestamp?: string | null, now = Date.now()): LocationFreshness {
  if (!timestamp) return 'none';
  const t = new Date(timestamp).getTime();
  if (Number.isNaN(t)) return 'none';
  const minutes = (now - t) / MINUTE;
  if (minutes < 15) return 'live';
  if (minutes < 60) return 'recent';
  if (minutes < 360) return 'stale';
  return 'expired';
}

export function describeFreshness(freshness: LocationFreshness): string | null {
  if (freshness === 'none') return null;
  return LOCATION_FRESHNESS[freshness].label;
}

/** Compact "how long ago" for the location column, e.g. "12m ago", "3h ago". */
export function relativeAge(timestamp?: string | null, now = Date.now()): string {
  if (!timestamp) return '—';
  const t = new Date(timestamp).getTime();
  if (Number.isNaN(t)) return '—';
  const minutes = Math.max(0, Math.round((now - t) / MINUTE));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** [lng, lat] -> "lat, lng" for display. Returns null when absent/invalid. */
export function formatCoordinates(coords?: [number, number] | null): string | null {
  if (!coords || coords.length < 2) return null;
  const [lng, lat] = coords;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

/**
 * A one-line explanation of what a tracking event MEANT operationally.
 * Keyed by the canonical status the event carries, so the wording tracks the
 * lifecycle rather than inventing a parallel "event type" vocabulary.
 *
 * `Record<DeliveryStatus, string>` on purpose: adding a status to the lifecycle
 * without explaining it here is a compile error, not a silent fallback.
 */
const EVENT_EXPLANATION: Record<DeliveryStatus, string> = {
  pending: 'Delivery requested — waiting for a provider to be assigned.',
  assigned: 'A provider took responsibility for this delivery.',
  reassigned: 'Responsibility for this delivery moved to another provider.',
  pickup: 'Rider collected the parcel from the pickup point.',
  in_transit: 'Parcel moving towards the destination.',
  delivered: 'Parcel handed over and delivery completed.',
  failed: 'Delivery attempt did not succeed.',
  cancelled: 'Delivery was cancelled before completion.',
};

export function explainEvent(status: string | undefined, note?: string | null): string {
  // A stored event may carry a status this console no longer knows (an old
  // record, or a service ahead of the build), so the lookup is widened rather
  // than cast: the `in` guard keeps the explanation total.
  const base = status && status in EVENT_EXPLANATION
    ? EVENT_EXPLANATION[status as DeliveryStatus]
    : undefined;
  if (base && note) return `${base} ${note}`;
  if (base) return base;
  if (note) return note;
  return 'Recorded movement.';
}
