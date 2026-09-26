// Custom hook for fetching delivery statistics

import { useAsync } from '@/hooks/useAsync';
import { http } from '@/services/client/httpClient';
import type { DeliveryStats, ActorStats } from '../types';

export function useDeliveryStats() {
  const { data: stats, loading, error, refetch } = useAsync(
    async () => {
      try {
        const res = await http.get<{ success: boolean; dashboard: DeliveryStats }>(
          '/delivery/operation/dashboard'
        );
        return res.dashboard || {};
      } catch (err) {
        console.error('Failed to fetch delivery stats:', err);
        throw err;
      }
    },
    []
  );

  return { stats, loading, error, refetch };
}

export function useActorStats() {
  const { data: actorStats, loading } = useAsync(
    async () => {
      try {
        // The backend clamps `limit` to 200, so read the exact `total`
        // returned for each filter instead of counting page items.
        const pending = await http.get<{ success: boolean; actors?: unknown[]; total?: number }>(
          '/delivery/partner?limit=1&status=pending'
        );
        const suspended = await http.get<{ success: boolean; actors?: unknown[]; total?: number }>(
          '/delivery/partner?limit=1&status=suspended'
        );
        const all = await http.get<{ success: boolean; actors?: unknown[]; total?: number }>(
          '/delivery/partner?limit=1'
        );
        return {
          pending: pending.total ?? pending.actors?.length ?? 0,
          suspended: suspended.total ?? suspended.actors?.length ?? 0,
          total: all.total ?? all.actors?.length ?? 0,
        } as ActorStats;
      } catch {
        return { pending: 0, suspended: 0, total: 0 } as ActorStats;
      }
    },
    []
  );

  return { actorStats, loading };
}