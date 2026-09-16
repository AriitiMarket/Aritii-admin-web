/** Notifications service facade. */
import type { PaginatedResult, WebNotification } from '@/types';
import { http } from '@/services/client/httpClient';

export const notificationsService = {
  async list(page: number, limit: number): Promise<PaginatedResult<WebNotification>> {
    try {
      const response = await http.get<{
        success: boolean;
        notifications?: WebNotification[];
        total?: number;
        page?: number;
        limit?: number;
      }>('/admin/notifications', {
        params: { page, limit },
      });
      const notifications = response.notifications || [];
      const total = response.total || notifications.length;
      return {
        items: notifications,
        total,
        page: response.page || page,
        limit: response.limit || limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch {
      return { items: [], total: 0, page, limit, totalPages: 0 };
    }
  },
};
