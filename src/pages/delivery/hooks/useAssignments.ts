// Custom hook for fetching delivery assignments

import { useAsync } from '@/hooks/useAsync';
import { deliveryAdmin } from '@/api/admin';
import type { Delivery, PaginatedData } from '../types';

interface UseAssignmentsOptions {
  page: number;
  limit?: number;
  status?: string;
  search?: string;
  /** Destination sector filter — passed straight to GET /delivery/delivery. */
  sectorId?: string;
}

export function useAssignments(options: UseAssignmentsOptions) {
  const { page, limit = 15, status, search, sectorId } = options;

  const { data, loading, error, refetch } = useAsync(
    async () => {
      const extra: Record<string, string> = {};
      if (sectorId) extra.sectorId = sectorId;
      const result = await deliveryAdmin.listDeliveries(page, limit, status, search, extra);
      return {
        items: result.items as Delivery[],
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages || Math.ceil(result.total / Math.max(result.limit, 1)),
      } as PaginatedData<Delivery>;
    },
    [page, limit, status, search, sectorId]
  );

  return { data, loading, error, refetch };
}
