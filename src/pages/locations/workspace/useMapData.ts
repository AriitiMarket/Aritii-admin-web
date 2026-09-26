import { useAsync } from '@/hooks/useAsync';
import {
  locationsService,
  zonesService,
  routesService,
  type Location,
  type Zone,
  type DeliveryRoute,
} from '@/services/locations.service';

/** Backend caps every list endpoint at 200 rows. */
const MAP_LIMIT = 200;

export interface MapData {
  locations: Location[];
  zones: Zone[];
  routes: DeliveryRoute[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Full network dataset for the map.
 *
 * The tab tables are paginated, but a map must show the WHOLE network — so the
 * map loads its own copy of locations/zones/routes rather than reusing the
 * current page of rows (which would otherwise draw a partial, misleading map).
 */
export function useMapData(enabled = true): MapData {
  const { data, loading, error, refetch } = useAsync(
    async () => {
      if (!enabled) return { locations: [], zones: [], routes: [] };
      const [locations, zones, routes] = await Promise.all([
        locationsService.list({ limit: MAP_LIMIT }),
        zonesService.list({ page: 1, limit: MAP_LIMIT }),
        routesService.list({ page: 1, limit: MAP_LIMIT }),
      ]);
      return {
        locations,
        zones: zones.zones,
        routes: routes.routes,
      };
    },
    [enabled]
  );

  return {
    locations: data?.locations ?? [],
    zones: data?.zones ?? [],
    routes: data?.routes ?? [],
    loading,
    error,
    refetch,
  };
}
