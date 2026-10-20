import { http } from '@/services/client/httpClient';

/**
 * Order Priority service — VIP / urgent order queueing.
 *
 * Backing endpoints (commerce-service, mounted at /order-priority):
 *   GET  /order-priority/vip/list      VIP & urgent orders
 *   GET  /order-priority/stats/summary counts per priority level
 *   GET  /order-priority/:orderId      priority for one order
 *   POST /order-priority               set { orderId, priority, reason }
 *   POST /order-priority/:orderId/reset clear a priority mark
 *
 * Every controller reply is wrapped in `{ success, data }`.
 */
export const PRIORITY_LEVELS = ['NORMAL', 'HIGH', 'VIP', 'URGENT'] as const;
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

export interface OrderPriority {
  _id: string;
  orderId: string;
  priority: PriorityLevel;
  reason?: string;
  setBy?: string;
  markedAt?: string;
}

interface Envelope<T> {
  success?: boolean;
  data?: T;
}

class OrderPriorityService {
  /** VIP + urgent orders for the priority queue. */
  async getVIPOrders(): Promise<OrderPriority[]> {
    const res = await http.get<Envelope<OrderPriority[]>>(
      '/order-priority/vip/list'
    );
    return res?.data ?? [];
  }

  /** Counts per priority level (drives the dashboard stat tiles). */
  async getPriorityStats(): Promise<Record<string, number>> {
    const res = await http.get<Envelope<Record<string, number>>>(
      '/order-priority/stats/summary'
    );
    return res?.data ?? {};
  }

  /** Priority record for a single order (null when unmarked). */
  async getPriority(orderId: string): Promise<OrderPriority | null> {
    if (!orderId) throw new Error('Order ID is required');
    const res = await http.get<Envelope<OrderPriority>>(
      `/order-priority/${orderId}`
    );
    return res?.data ?? null;
  }

  /** Mark an order's priority. */
  async setPriority(
    orderId: string,
    priority: PriorityLevel,
    reason = ''
  ): Promise<OrderPriority> {
    if (!orderId) throw new Error('Order ID is required');
    const res = await http.post<Envelope<OrderPriority>>(
      '/order-priority',
      { orderId, priority, reason }
    );
    return res?.data as OrderPriority;
  }

  /** Clear a priority mark (revert to normal). */
  async resetPriority(orderId: string): Promise<OrderPriority | null> {
    if (!orderId) throw new Error('Order ID is required');
    const res = await http.post<Envelope<OrderPriority | null>>(
      `/order-priority/${orderId}/reset`,
      {}
    );
    return res?.data ?? null;
  }
}

export const orderPriorityService = new OrderPriorityService();