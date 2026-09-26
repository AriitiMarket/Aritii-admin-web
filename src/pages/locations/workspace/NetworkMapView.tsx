/**
 * Real network map for the Locations & Expansion workspace.
 *
 * Everything drawn here comes from actual stored data — no mock pins:
 *   - Locations -> their GeoJSON `coordinates` Point
 *   - Zones     -> `coverage.center` Point + `coverage.radiusKm`
 *   - Routes    -> a line between the origin and destination locations' points
 *
 * Records without coordinates are NOT faked onto the map: the component reports
 * how many are missing so the admin knows to fill them in.
 *
 * Leaflet is used directly (no wrapper) so the map lifecycle is explicit, and
 * markers are `divIcon`s so pin colours match the legend instead of depending
 * on bundler-resolved default icon assets.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '@/components/common/Card';
import type { Location, Zone, DeliveryRoute } from '@/services/locations.service';
import { toLatLng, indexMappable, routeEndpoints, zoneRadiusMetres } from './mapGeo';

export const MAP_LAYERS = {
  locations: { label: 'Locations', color: '#3B82F6' },
  zones: { label: 'Delivery Zones', color: '#10B981' },
  routes: { label: 'Routes', color: '#F59E0B' },
} as const;

export type MapLayerId = keyof typeof MAP_LAYERS;

function dot(color: string, ring = false) {
  const size = ring ? 12 : 14;
  return L.divIcon({
    className: '',
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;background:${
      ring ? 'transparent' : color
    };border:${ring ? 3 : 2}px solid ${color};"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function NetworkMapView({
  locations,
  zones,
  routes,
  onLocationClick,
  onZoneClick,
  onRouteClick,
  height = 'h-[480px]',
}: {
  locations: Location[];
  zones: Zone[];
  routes: DeliveryRoute[];
  onLocationClick?: (location: Location) => void;
  onZoneClick?: (zone: Zone) => void;
  onRouteClick?: (route: DeliveryRoute) => void;
  height?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [enabled, setEnabled] = useState<Record<MapLayerId, boolean>>({
    locations: true, zones: true, routes: true,
  });

  /** Locations that actually have coordinates — the only ones we can draw. */
  const points = useMemo(() => indexMappable(locations), [locations]);

  const toggle = (id: MapLayerId) =>
    setEnabled((prev) => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView([9.03, 42.2], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Redraw the drawable layers whenever the data or the toggles change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const drawnLayer = L.layerGroup().addTo(map);

    if (enabled.locations) {
      points.forEach(({ loc, at }) => {
        L.marker([at.lat, at.lng], { icon: dot(MAP_LAYERS.locations.color) })
          .bindPopup(`<strong>${loc.name}</strong><br/>${loc.type}`)
          .on('click', () => onLocationClick?.(loc))
          .addTo(drawnLayer);
      });
    }

    if (enabled.zones) {
      zones.forEach((zone) => {
        const center = toLatLng(zone.coverage?.center);
        if (!center) return;
        const radiusM = zoneRadiusMetres(zone);
        const shape = radiusM > 0
          ? L.circle([center.lat, center.lng], {
            radius: radiusM,
            color: MAP_LAYERS.zones.color,
            fillColor: MAP_LAYERS.zones.color,
            fillOpacity: 0.12,
          })
          : L.marker([center.lat, center.lng], { icon: dot(MAP_LAYERS.zones.color, true) });
        shape.bindPopup(`<strong>${zone.name}</strong>`)
          .on('click', () => onZoneClick?.(zone))
          .addTo(drawnLayer);
      });
    }

    if (enabled.routes) {
      routes.forEach((route) => {
        const ends = routeEndpoints(route, points);
        // Only draw a route when BOTH ends are actually mapped.
        if (!ends) return;
        L.polyline([[ends.from.lat, ends.from.lng], [ends.to.lat, ends.to.lng]], {
          color: MAP_LAYERS.routes.color, weight: 2, opacity: 0.8,
        })
          .bindPopup(`<strong>${route.name}</strong>`)
          .on('click', () => onRouteClick?.(route))
          .addTo(drawnLayer);
      });
    }

    // Fit the viewport to whatever is actually drawable.
    const drawn: L.LatLng[] = [];
    if (enabled.locations) points.forEach(({ at }) => drawn.push(L.latLng(at.lat, at.lng)));
    if (enabled.zones) {
      zones.forEach((z) => {
        const c = toLatLng(z.coverage?.center);
        if (c) drawn.push(L.latLng(c.lat, c.lng));
      });
    }
    if (enabled.routes) {
      routes.forEach((r) => {
        const ends = routeEndpoints(r, points);
        if (ends) {
          drawn.push(L.latLng(ends.from.lat, ends.from.lng));
          drawn.push(L.latLng(ends.to.lat, ends.to.lng));
        }
      });
    }
    if (drawn.length > 0) map.fitBounds(L.latLngBounds(drawn).pad(0.15));

    return () => {
      map.removeLayer(drawnLayer);
    };
  }, [points, zones, routes, enabled, onLocationClick, onZoneClick, onRouteClick]);

  const mappable = points.size;
  const missing = locations.length - mappable;

  return (
    <div className="space-y-3">
      <Card className="flex flex-wrap items-center gap-2 p-3">
        {(Object.keys(MAP_LAYERS) as MapLayerId[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => toggle(id)}
            aria-pressed={enabled[id]}
            className={
              enabled[id]
                ? 'flex items-center gap-2 rounded-full bg-primary-dark px-3 py-1.5 text-xs font-medium text-white'
                : 'flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
            }
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: MAP_LAYERS[id].color }} />
            {MAP_LAYERS[id].label}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
          {mappable} mapped{missing > 0 ? ` · ${missing} without coordinates` : ''}
        </span>
      </Card>

      {mappable === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">No coordinates to map yet</p>
          <p className="mx-auto mt-1 max-w-md px-4 text-xs text-gray-500 dark:text-gray-400">
            Add a latitude and longitude to a location and it will appear here. The map only
            plots real stored coordinates.
          </p>
        </Card>
      ) : (
        <div ref={containerRef} className={`w-full rounded-lg border border-gray-200 dark:border-dark-600 ${height}`} />
      )}
    </div>
  );
}
