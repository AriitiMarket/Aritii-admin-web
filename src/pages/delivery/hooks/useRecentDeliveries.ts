// Custom hook for fetching recent deliveries

import { useAsync } from '@/hooks/useAsync';
import { http } from '@/services/client/httpClient';
import type { RecentDelivery } from '../types';

interface UseRecentDeliveriesOptions {
  status?: string;
  limit?: number;
}

export function useRecentDeliveries(options: UseRecentDeliveriesOptions = {}) {
  const { status, limit = 10 } = options;

  const { data: recentDeliveries, loading, error, refetch } = useAsync(
    async () => {
      try {
        const params = new URLSearchParams();
        params.append('limit', limit.toString());
        if (status) params.append('status', status);
        const res = await http.get<{ success: boolean; deliveries: RecentDelivery[] }>(
          `/delivery/delivery?${params}`
        );
        return res.deliveries || [];
      } catch (err) {
        console.error('Failed to fetch recent deliveries:', err);
        return [];
      }
    },
    [status, limit]
  );

  return { recentDeliveries, loading, error, refetch };
}