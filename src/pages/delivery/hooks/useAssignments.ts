// Custom hook for fetching delivery assignments

import { useAsync } from '@/hooks/useAsync';
import { deliveryAdmin } from '@/api/admin';
import type { Delivery, PaginatedData } from '../types';

interface UseAssignmentsOptions {
  page: number;
  limit?: number;
  status?: string;
  search?: string;
}

export function useAssignments(options: UseAssignmentsOptions) {
  const { page, limit = 15, status, search } = options;

  const { data, loading, error, refetch } = useAsync(
    async () => {
      try {
        const result = await deliveryAdmin.listDeliveries(page, limit, status, search);
        return {
          items: result.items as Delivery[],
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages || Math.ceil(result.total / Math.max(result.limit, 1)),
        } as PaginatedData<Delivery>;
      } catch (err) {
        console.error('Failed to fetch deliveries:', err);
        throw err;
      }
    },
    [page, limit, status, search]
  );

  return { data, loading, error, refetch };
}