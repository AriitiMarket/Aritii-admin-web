import { http } from '@/services/client/httpClient';

/**
 * Order SLA service — deadline tracking & compliance.
 *
 * Backing endpoints (commerce-service, mounted at /order-sla):
 *   GET  /order-sla/seller/breaches          breached SLAs (optional ?period=)
 *   GET  /order-sla/:orderId/status          SLA record for an order
 *   GET  /order-sla/:orderId/compliance      { compliant, timeRemaining, … }
 *   POST /order-sla                          set { orderId, stateName, durationHours }
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
}

export const orderSLAService = new OrderSLAService();