import { http } from '@/services/client/httpClient';

/**
 * Order SLA service — deadline tracking & compliance.
 *
 * Backing endpoints (commerce-service, mounted at /order-sla):
 *   GET  /order-sla/seller/breaches          breached SLAs (optional ?period=)
 *   GET  /order-sla/:orderId/status          SLA record for an order
 *   GET  /order-sla/:orderId/compliance      { compliant, timeRemaining, … }
 *   POST /order-sla                          set { orderId, stateName, durationHours }
 *   POST /order-sla/breaches                 push in a breach { orderId, reason }
 *
 * Controllers wrap replies in `{ success, data }`.
 */
export interface OrderSLA {
  _id: string;
  orderId: string;
  stateName: string;
  durationHours: number;
  deadline: string;
  setBy?: string;
  /** True once the SLA was missed — detected automatically or pushed in by hand. */
  breached?: boolean;
  /** When the breach happened. */
  breachedAt?: string | null;
  /** Why the breach happened. */
  breachReason?: string | null;
  /** Who recorded the breach. */
  breachedBy?: string | null;
  /** 'AUTO' when the deadline passed on its own, 'MANUAL' when pushed in. */
  breachSource?: 'AUTO' | 'MANUAL';
  createdAt?: string;
}

export interface SLACompliance {
  compliant: boolean;
  reason?: string;
  timeRemaining?: number;
  deadline?: string;
}

interface Envelope<T> {
  success?: boolean;
  data?: T;
}

class OrderSLAService {
  /** Breached SLAs for the dashboard. */
  async getBreaches(period?: string): Promise<OrderSLA[]> {
    const params = period ? { period } : undefined;
    const res = await http.get<Envelope<OrderSLA[]>>(
      '/order-sla/seller/breaches',
      { params }
    );
    return res?.data ?? [];
  }

  /** SLA record for one order (null when none set). */
  async getStatus(orderId: string): Promise<OrderSLA | null> {
    if (!orderId) throw new Error('Order ID is required');
    const res = await http.get<Envelope<OrderSLA | null>>(
      `/order-sla/${orderId}/status`
    );
    return res?.data ?? null;
  }

  /** Compliance check for one order. */
  async checkCompliance(orderId: string): Promise<SLACompliance> {
    if (!orderId) throw new Error('Order ID is required');
    const res = await http.get<Envelope<SLACompliance>>(
      `/order-sla/${orderId}/compliance`
    );
    return res?.data ?? { compliant: true, reason: 'No SLA set' };
  }

  /** Set an SLA deadline for an order. */
  async setSLA(
    orderId: string,
    stateName: string,
    durationHours: number
  ): Promise<OrderSLA> {
    if (!orderId || !stateName) {
      throw new Error('Order ID and state name are required');
    }
    const res = await http.post<Envelope<OrderSLA>>('/order-sla', {
      orderId,
      stateName,
      durationHours,
    });
    return res?.data as OrderSLA;
  }

  /**
   * Push in a breach against an order.
   *
   * Used when the SLA was missed for a reason the deadline alone cannot show —
   * an upheld dispute, a mis-declared target. The breach lands on the order's
   * existing SLA record when it has one, and on a new record when it does not,
   * so the order always ends up with a single, coherent SLA story.
   */
  async createBreach(
    orderId: string,
    reason: string,
    extra?: { stateName?: string; durationHours?: number; deadline?: string }
  ): Promise<OrderSLA> {
    if (!orderId || !reason.trim()) {
      throw new Error('Order ID and a reason are required');
    }
    const res = await http.post<Envelope<OrderSLA>>('/order-sla/breaches', {
      orderId,
      reason: reason.trim(),
      ...extra,
    });
    return res?.data as OrderSLA;
  }
}

export const orderSLAService = new OrderSLAService();