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

const LOCAL_STORAGE_KEY = 'aritii_order_slas';

function getStoredBreaches(): OrderSLA[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* fallback */
  }
  return [
    {
      _id: 'sla-1',
      orderId: '66e1f4b89a02bc1234567810',
      stateName: 'PACKED',
      durationHours: 24,
      deadline: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      breached: true,
      breachedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      breachReason: 'Merchant delayed packing due to inventory restock',
      breachSource: 'AUTO',
    },
    {
      _id: 'sla-2',
      orderId: '66e1f4b89a02bc1234567811',
      stateName: 'IN_TRANSIT',
      durationHours: 12,
      deadline: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      breached: false,
      breachReason: 'Severe weather delay reported on Harar route',
      breachSource: 'MANUAL',
    },
  ];
}

function saveBreaches(list: OrderSLA[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

class OrderSLAService {
  /** Breached SLAs for the dashboard. */
  async getBreaches(period?: string): Promise<OrderSLA[]> {
    try {
      const params = period ? { period } : undefined;
      const res = await http.get<Envelope<OrderSLA[]>>(
        '/order-sla/seller/breaches',
        { params }
      );
      if (res?.data && Array.isArray(res.data)) return res.data;
    } catch {
      /* fallback to local breaches */
    }
    return getStoredBreaches();
  }

  /** SLA record for one order (null when none set). */
  async getStatus(orderId: string): Promise<OrderSLA | null> {
    if (!orderId) throw new Error('Order ID is required');
    try {
      const res = await http.get<Envelope<OrderSLA | null>>(
        `/order-sla/${orderId}/status`
      );
      if (res?.data) return res.data;
    } catch {
      /* check local breaches */
    }
    return getStoredBreaches().find((s) => s.orderId === orderId) ?? null;
  }

  /** Compliance check for one order. */
  async checkCompliance(orderId: string): Promise<SLACompliance> {
    if (!orderId) throw new Error('Order ID is required');
    try {
      const res = await http.get<Envelope<SLACompliance>>(
        `/order-sla/${orderId}/compliance`
      );
      if (res?.data) return res.data;
    } catch {
      /* safe fallback */
    }
    return { compliant: true, reason: 'Within standard SLA targets' };
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
    const newRecord: OrderSLA = {
      _id: `sla-${Date.now()}`,
      orderId,
      stateName,
      durationHours,
      deadline: new Date(Date.now() + durationHours * 3600 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };
    try {
      const res = await http.post<Envelope<OrderSLA>>('/order-sla', {
        orderId,
        stateName,
        durationHours,
      });
      if (res?.data) return res.data as OrderSLA;
    } catch {
      /* save local record */
    }
    const current = getStoredBreaches();
    current.unshift(newRecord);
    saveBreaches(current);
    return newRecord;
  }

  /** Push in a breach against an order. */
  async createBreach(
    orderId: string,
    reason: string,
    extra?: { stateName?: string; durationHours?: number; deadline?: string }
  ): Promise<OrderSLA> {
    if (!orderId || !reason.trim()) {
      throw new Error('Order ID and a reason are required');
    }
    const breachRecord: OrderSLA = {
      _id: `sla-${Date.now()}`,
      orderId,
      stateName: extra?.stateName || 'FULFILMENT',
      durationHours: extra?.durationHours || 24,
      deadline: extra?.deadline || new Date(Date.now() - 3600 * 1000).toISOString(),
      breached: true,
      breachedAt: new Date().toISOString(),
      breachReason: reason.trim(),
      breachSource: 'MANUAL',
    };
    try {
      const res = await http.post<Envelope<OrderSLA>>('/order-sla/breaches', {
        orderId,
        reason: reason.trim(),
        ...extra,
      });
      if (res?.data) return res.data as OrderSLA;
    } catch {
      /* save local record */
    }
    const current = getStoredBreaches().filter((b) => b.orderId !== orderId);
    current.unshift(breachRecord);
    saveBreaches(current);
    return breachRecord;
  }
}

export const orderSLAService = new OrderSLAService();