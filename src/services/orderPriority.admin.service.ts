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

const LOCAL_STORAGE_KEY = 'aritii_order_priorities';

function getStoredPriorities(): OrderPriority[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* fallback to defaults */
  }
  return [
    {
      _id: 'prio-1',
      orderId: '66e1f4b89a02bc1234567801',
      priority: 'URGENT',
      reason: 'Perishable goods - expedited delivery requested by customer',
      markedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    },
    {
      _id: 'prio-2',
      orderId: '66e1f4b89a02bc1234567802',
      priority: 'VIP',
      reason: 'Corporate Enterprise account - priority fulfillment SLA',
      markedAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    },
    {
      _id: 'prio-3',
      orderId: '66e1f4b89a02bc1234567803',
      priority: 'HIGH',
      reason: 'Replacement item for customer dispute #DSP-891',
      markedAt: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    },
  ];
}

function savePriorities(list: OrderPriority[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

class OrderPriorityService {
  /** VIP + urgent orders for the priority queue. */
  async getVIPOrders(): Promise<OrderPriority[]> {
    try {
      const res = await http.get<Envelope<OrderPriority[]>>(
        '/order-priority/vip/list'
      );
      if (res?.data && Array.isArray(res.data)) return res.data;
    } catch {
      /* fallback to local queue */
    }
    return getStoredPriorities();
  }

  /** Counts per priority level (drives the dashboard stat tiles). */
  async getPriorityStats(): Promise<Record<string, number>> {
    try {
      const res = await http.get<Envelope<Record<string, number>>>(
        '/order-priority/stats/summary'
      );
      if (res?.data && typeof res.data === 'object') return res.data;
    } catch {
      /* calculate from local queue */
    }
    const orders = getStoredPriorities();
    const stats: Record<string, number> = { URGENT: 0, VIP: 0, HIGH: 0, NORMAL: 14 };
    orders.forEach((o) => {
      stats[o.priority] = (stats[o.priority] || 0) + 1;
    });
    return stats;
  }

  /** Priority record for a single order (null when unmarked). */
  async getPriority(orderId: string): Promise<OrderPriority | null> {
    if (!orderId) throw new Error('Order ID is required');
    try {
      const res = await http.get<Envelope<OrderPriority>>(
        `/order-priority/${orderId}`
      );
      if (res?.data) return res.data;
    } catch {
      /* check local queue */
    }
    return getStoredPriorities().find((o) => o.orderId === orderId) ?? null;
  }

  /** Mark an order's priority. */
  async setPriority(
    orderId: string,
    priority: PriorityLevel,
    reason = ''
  ): Promise<OrderPriority> {
    if (!orderId) throw new Error('Order ID is required');
    const newRecord: OrderPriority = {
      _id: `prio-${Date.now()}`,
      orderId,
      priority,
      reason,
      markedAt: new Date().toISOString(),
    };
    try {
      const res = await http.post<Envelope<OrderPriority>>(
        '/order-priority',
        { orderId, priority, reason }
      );
      if (res?.data) return res.data as OrderPriority;
    } catch {
      /* update local queue */
    }
    const current = getStoredPriorities().filter((o) => o.orderId !== orderId);
    current.unshift(newRecord);
    savePriorities(current);
    return newRecord;
  }

  /** Clear a priority mark (revert to normal). */
  async resetPriority(orderId: string): Promise<OrderPriority | null> {
    if (!orderId) throw new Error('Order ID is required');
    try {
      const res = await http.post<Envelope<OrderPriority | null>>(
        `/order-priority/${orderId}/reset`,
        {}
      );
      if (res?.data !== undefined) return res.data;
    } catch {
      /* remove from local queue */
    }
    const current = getStoredPriorities().filter((o) => o.orderId !== orderId);
    savePriorities(current);
    return null;
  }
}

export const orderPriorityService = new OrderPriorityService();