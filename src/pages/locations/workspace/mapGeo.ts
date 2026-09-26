/**
 * Pure GeoJSON -> Leaflet helpers for the network map.
 *
 * Deliberately free of React and Leaflet so this can be imported (and unit
 * tested) on its own — `NetworkMapView` only does the drawing.
 */
import type { GeoPoint } from '@/services/locations.service';

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * GeoJSON stores [longitude, latitude]; Leaflet wants [lat, lng].
 * Returns null for anything that is not a usable Point, so a malformed or
 * missing coordinate is simply not drawn rather than placed at a fake spot.
 */
export function toLatLng(coordinates?: GeoPoint | null): LatLng | null {
  if (!coordinates || coordinates.type !== 'Point') return null;
  const [lng, lat] = coordinates.coordinates;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return { lat, lng };
}

/** Locations that carry usable coordinates, keyed by id. */
export function indexMappable<T extends { _id: string; coordinates?: GeoPoint | null }>(
  locations: T[]
): Map<string, { loc: T; at: LatLng }> {
  const byId = new Map<string, { loc: T; at: LatLng }>();
  locations.forEach((loc) => {
    const at = toLatLng(loc.coordinates);
    if (at) byId.set(loc._id, { loc, at });
  });
  return byId;
}

/**
 * A route is only drawable when BOTH endpoints are mapped. Returns the two
 * points to connect, or null when the route cannot be drawn.
 *
 * The lookup map is typed on `{ at }` only, so a map built from Locations can
 * be passed to a lookup for Routes without the generics having to unify.
 */
export function routeEndpoints(
  route: { originLocationId: string; destinationLocationId: string },
  points: Map<string, { at: LatLng }>
): { from: LatLng; to: LatLng } | null {
  const from = points.get(route.originLocationId);
  const to = points.get(route.destinationLocationId);
  if (!from || !to) return null;
  return { from: from.at, to: to.at };
}

/** Zone circle radius in metres (Leaflet expects metres, the API stores km). */
export function zoneRadiusMetres(zone: { coverage?: { radiusKm?: number } }): number {
  return (zone.coverage?.radiusKm ?? 0) * 1000;
}
