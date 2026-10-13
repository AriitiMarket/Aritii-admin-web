// Custom hook for fetching delivery statistics

import { useAsync } from '@/hooks/useAsync';
import { http } from '@/services/client/httpClient';
import type { DeliveryStats } from '../types';

/** The filters the Overview page wires into GET /delivery/operation/dashboard. */
export interface DashboardFilters {
  status?: string;
  zoneId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useDeliveryStats(filters: DashboardFilters = {}, refreshKey = 0) {
  const { status, zoneId, dateFrom, dateTo } = filters;

  const { data: stats, loading, error, refetch } = useAsync(
    async () => {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (zoneId) params.set('zoneId', zoneId);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      const qs = params.toString();
      const res = await http.get<{ success: boolean; dashboard: DeliveryStats }>(
        `/delivery/operation/dashboard${qs ? `?${qs}` : ''}`
      );
      return res.dashboard || ({} as DeliveryStats);
    },
    [status, zoneId, dateFrom, dateTo, refreshKey]
  );

  return { stats, loading, error, refetch };
}
