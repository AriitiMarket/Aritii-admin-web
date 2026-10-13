// Custom hooks for Locations & Expansion module

import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import {
  locationsService,
  type LocationListParams,
} from '@/services/locations.service';
import type { LocationStats, LocationDetail } from '../types';

export function useLocations(params?: {
  type?: string;
  status?: string;
  serviceability?: string;
  port?: string;
  expansionStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const { type, status, serviceability, port, expansionStatus, search, page = 1, limit = 50 } = params || {};
  const debouncedSearch = useDebounce(search || '', 300);

  const { data, loading, error, refetch } = useAsync(
    async () => {
      try {
        const filter: LocationListParams = {};
        if (type) filter.type = type;
        // No explicit selection means "All Statuses" (active + inactive).
        filter.status = status || 'all';
        if (serviceability) {
          filter.serviceable = serviceability === 'serviceable' ? 'true' : 'false';
        }
        if (port) filter.port = port === 'port' ? 'true' : 'false';
        if (expansionStatus) filter.expansionStatus = expansionStatus;
        if (debouncedSearch) filter.q = debouncedSearch;
        filter.page = page;
        filter.limit = limit;

        const res = await locationsService.listWithMeta(filter);
        return {
          items: res.locations,
          total: res.total,
          page: res.page,
          limit: res.limit,
          totalPages: res.totalPages,
        };
      } catch (err) {
        console.error('Failed to fetch locations:', err);
        throw err;
      }
    },
    [type, status, serviceability, port, expansionStatus, debouncedSearch, page, limit]
  );

  return { data, loading, error, refetch };
}

export function useLocationStats() {
  const { data: stats, loading, error, refetch } = useAsync(
    async () => {
      try {
        return (await locationsService.getStats()) as LocationStats;
      } catch (err) {
        console.error('Failed to fetch location stats:', err);
        throw err;
      }
    },
    []
  );

  return { stats, loading, error, refetch };
}

export function useLocationDetail(id: string) {
  const { data: detail, loading, error, refetch } = useAsync(
    async () => {
      try {
        const location = await locationsService.get(id);
        const ancestors = await locationsService.getAncestors(id);
        const children = await locationsService.getChildren(id);

        return {
          location,
          ancestors,
          children,
          stats: {
            zones: 0,
            shops: 0,
            sellers: 0,
            orders: 0,
            riders: 0,
            ports: 0,
          },
        } as LocationDetail;
      } catch (err) {
        console.error('Failed to fetch location detail:', err);
        throw err;
      }
    },
    [id]
  );

  return { detail, loading, error, refetch };
}