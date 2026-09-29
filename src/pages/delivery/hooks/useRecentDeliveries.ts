// Custom hook for fetching recent deliveries

import { useAsync } from '@/hooks/useAsync';
import { http } from '@/services/client/httpClient';
import type { RecentDelivery } from '../types';

interface UseRecentDeliveriesOptions {
  status?: string;
  sectorId?: string;
  dateFrom?: string;
  dateTo?: string;
  orderId?: string;
  limit?: number;
  /** Bumped by the page's Refresh to re-pull. */
  refreshKey?: number;
}

export function useRecentDeliveries(options: UseRecentDeliveriesOptions = {}) {
  const { status, sectorId, dateFrom, dateTo, orderId, limit = 10, refreshKey = 0 } = options;

  const { data: recentDeliveries, loading, error, refetch } = useAsync(
    async () => {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      if (status) params.set('status', status);
      if (sectorId) params.set('sectorId', sectorId);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (orderId) params.set('orderId', orderId);
      const res = await http.get<{ success: boolean; deliveries: RecentDelivery[] }>(
        `/delivery/delivery?${params}`
      );
      return res.deliveries || [];
    },
    // Errors are surfaced by useAsync — an empty table must never hide a
    // failed request.
    [status, sectorId, dateFrom, dateTo, orderId, limit, refreshKey]
  );

  return { recentDeliveries, loading, error, refetch };
}
