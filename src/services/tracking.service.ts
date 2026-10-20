/** Tracking admin service (delivery-service route: GET /delivery/tracking).

Backend contract:
  GET /delivery/tracking/:deliveryId   -> { events, count }
  GET /delivery/tracking/:deliveryId/latest -> { location: { coordinates?: [lng, lat], accuracy?, speed?, heading?, timestamp? } }
  GET /delivery/tracking/nearby       -> { events, count }  *(live location query, best effort)*

Tracking events: { status: 'pending'|'assigned'|'reassigned'|'pickup'|'in_transit'|'delivered'|'failed'|'cancelled',
                   location?: { type:'Point', coordinates:[lng,lat] }, accuracy?, speed?, heading?, note?, timestamp? }.
*/

import { http } from '@/services/client/httpClient';

export interface TrackingEvent {
  /**
   * A tracking event records a status the delivery REACHED, so the value is
   * always a canonical delivery status (the backend derives the enum from
   * DELIVERY_STATUSES). The older spellings below are still accepted on read so
   * a historical event renders through the canonical label map rather than
   * being dropped.
   */
  status: string;
  location?: { type?: 'Point'; coordinates?: [number, number] };
  accuracy?: number;
  speed?: number;
  heading?: number;
  note?: string;
  timestamp?: string;
  providerId?: string | null;
  /** Mongoose timestamps — used to fall back to a real event time. */
  createdAt?: string;
}

export interface TrackingLocation {
  coordinates?: [number, number];
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp?: string;
}

export interface TrackingResponse {
  success: boolean;
  events?: TrackingEvent[];
  count?: number;
  location?: TrackingLocation;
  /** Batch read: the latest position of each requested delivery, keyed by id. */
  locations?: Record<string, TrackingLocation | null>;
}

export const trackingService = {
  /**
   * Event history for a delivery (backend: GET /delivery/tracking/:deliveryId).
   *
   * The route is keyed by DELIVERY id, not order id — the caller resolves the
   * order id through the delivery list first.
   */
  async getEvents(deliveryId: string): Promise<TrackingEvent[]> {
    const res = await http.get<TrackingResponse>(`/delivery/tracking/${deliveryId}`);
    return res?.events ?? [];
  },

  /** Latest known location of a delivery (backend: GET /delivery/tracking/:deliveryId/latest) */
  async getLatestLocation(deliveryId: string): Promise<TrackingLocation | null> {
    const res = await http.get<{ success: boolean; location?: TrackingLocation }>(`/delivery/tracking/${deliveryId}/latest`);
    return res?.location ?? null;
  },

  /**
   * The latest position of MANY deliveries in ONE request
   * (backend: GET /delivery/tracking/latest?deliveryIds=a,b,c).
   *
   * A tracking list renders the position of every row. Fetching them one by
   * one turned a 25-row page into 25 round trips; this answers them all at
   * once. A delivery the caller may not read is simply absent from the map.
   */
  async getLatestLocations(deliveryIds: string[]): Promise<Map<string, TrackingLocation | null>> {
    const ids = deliveryIds.filter(Boolean);
    if (!ids.length) return new Map();
    const res = await http.get<{ success: boolean; locations?: Record<string, TrackingLocation | null> }>(
      '/delivery/tracking/latest',
      { params: { deliveryIds: ids.join(',') } }
    );
    const locations = res?.locations ?? {};
    return new Map(Object.entries(locations));
  },

  /** Nearby events for a live location (backend: GET /delivery/tracking/nearby) — best effort. */
  async getNearby({ longitude, latitude, maxDistance = 5000 }: { longitude: number; latitude: number; maxDistance?: number }): Promise<TrackingEvent[]> {
    const res = await http.get<TrackingResponse>('/delivery/tracking/nearby', {
      params: { longitude, latitude, maxDistance },
    });
    return res?.events ?? [];
  },
};
