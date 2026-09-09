/**
 * Real notifications service — Ariiti API Gateway contract.
 * @boundary: these endpoints are the documented integration contracts and
 * are pending gateway/backend implementation.
 */
import { assertGatewayConfigured, http } from '@/services/client/httpClient';
import type { PaginatedResult, WebNotification } from '@/types';

interface RealPagedNotifications {
  data: {
    notifications: WebNotification[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function realListNotifications(
  page: number,
  limit: number
): Promise<PaginatedResult<WebNotification>> {
  assertGatewayConfigured();
  const response = await http.get<RealPagedNotifications>('/notifications', {
    params: { page, limit },
  });
  return {
    items: response.data.notifications,
    total: response.data.total,
    page: response.data.page,
    limit: response.data.limit,
    totalPages: response.data.totalPages,
  };
}