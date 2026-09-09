/** Notifications service facade. */
import { isMockMode } from '@/utils/env';
import type { PaginatedResult, WebNotification } from '@/types';
import { mockListNotifications } from './mock/notifications';
import { realListNotifications } from './real/notifications';

export const notificationsService = {
  list(page: number, limit: number): Promise<PaginatedResult<WebNotification>> {
    return isMockMode()
      ? mockListNotifications(page, limit)
      : realListNotifications(page, limit);
  },
};