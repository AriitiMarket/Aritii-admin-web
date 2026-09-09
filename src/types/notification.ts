/** Web/notification records. */
export interface WebNotification {
  id: string;
  title: string;
  body?: string;
  isRead: boolean;
  createdAt: string | number;
  redirectUrl?: string;
}