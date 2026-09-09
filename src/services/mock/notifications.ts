/** Mock-mode notifications implementation. */
import { http } from '@/services/client/httpClient';
import type { PaginatedResult, WebNotification } from '@/types';

interface MockNotification {
  _id: string;
  title: string;
  body?: string;
  createdAt?: string | number;
  isRead?: boolean;
  redirectUrl?: string;
}

interface MockNotificationsResponse {
  notifications: MockNotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const toWebNotification = (raw: MockNotification): WebNotification => ({
  id: raw._id,
  title: raw.title,
  body: raw.body,
  isRead: raw.isRead ?? false,
  createdAt: raw.createdAt ?? Date.now(),
  redirectUrl: raw.redirectUrl,
});

export async function mockListNotifications(
  page: number,
  limit: number
): Promise<PaginatedResult<WebNotification>> {
  const response = await http.get<MockNotificationsResponse>('/admin/notifications', {
    params: { page, limit },
  });
  const { notifications, total, page: current, limit: currentLimit, totalPages } =
    response;
  return {
    items: notifications.map(toWebNotification),
    total,
    page: current,
    limit: currentLimit,
    totalPages: totalPages || Math.ceil(total / limit),
  };
}