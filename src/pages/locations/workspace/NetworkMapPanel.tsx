/**
 * Lazily-loaded network map.
 *
 * Leaflet + its CSS is a meaningful chunk, and most sessions only ever use List
 * View — so the map (and the library) is split into its own chunk and fetched
 * only when an admin actually switches to Map View.
 */
import { Suspense, lazy } from 'react';
import type { Location, Zone, DeliveryRoute } from '@/services/locations.service';

const LazyNetworkMap = lazy(() =>
  import('./NetworkMapView').then((m) => ({ default: m.NetworkMapView }))
);

export function NetworkMapPanel({
  locations,
  zones,
  routes,
  onLocationClick,
  onZoneClick,
  onRouteClick,
}: {
  locations: Location[];
  zones: Zone[];
  routes: DeliveryRoute[];
  onLocationClick?: (location: Location) => void;
  onZoneClick?: (zone: Zone) => void;
  onRouteClick?: (route: DeliveryRoute) => void;
}) {
  return (
    <Suspense
      fallback={
        <div
          className="h-[480px] w-full animate-pulse rounded-lg bg-gray-100 dark:bg-dark-600/40"
          aria-label="Loading map"
        />
      }
    >
      <LazyNetworkMap
        locations={locations}
        zones={zones}
        routes={routes}
        onLocationClick={onLocationClick}
        onZoneClick={onZoneClick}
        onRouteClick={onRouteClick}
      />
    </Suspense>
  );
}
