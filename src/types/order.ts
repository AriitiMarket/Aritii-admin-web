/** Orders. */

/**
 * Canonical Commerce order statuses — mirrors
 * services/commerce-service/src/orders/constants/orderStatuses.js.
 *
 * These are the values the platform actually stores. The console previously
 * declared a different set (PENDING/ACCEPTED/PICKED/ARRIVED) that no service ever
 * writes, so status filters and the detail timeline could never match a row.
 */
export type OrderStatus =
  | 'Processing'
  | 'Confirmed'
  | 'Shipped'
  | 'In Transit'
  | 'Delivered'
  | 'Cancelled'
  | 'Refund Requested'
  | 'Refund Approved'
  | 'Refund Success'
  | 'Refund Rejected';

/**
 * Payment status as stored on the order document — mirrors the order model's
 * enum. `SETTLING` is written while a COD collection is being confirmed; it was
 * missing here, which made those orders impossible to filter for and fall
 * through to the neutral badge styling, so they looked like ordinary pending
 * orders.
 */
export type PaymentStatus =
  | 'PENDING'
  | 'SETTLING'
  | 'CONFIRMED'
  | 'FAILED'
  | 'REFUNDED';

export type OrderType = 'DELIVERY' | 'PICKUP';

export interface Order {
  id: string;
  orderId: string;
  orderAmount: number;
  payer: string;
  /** Derived: every Commerce order ships to the customer. */
  orderType?: OrderType;
  orderStatus: OrderStatus;
  paymentStatus?: PaymentStatus;
  deliveryAddress?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt?: string;
  sector?: string;
  /** Operational stage derived by the backend lifecycle mapper. */
  stage?: string;
  stageLabel?: string;
  deliveryStatus?: string | null;
  items?: Array<{
    id?: string;
    title?: string;
    quantity?: number;
    price?: number;
  }>;
}

/** One entry of the backend-recorded pickup/delivery timeline. */
export interface OrderTimelineEntry {
  stage: string;
  label: string;
  timestamp: string | null;
  source: string;
}

export interface OrderDetail extends Order {
  deliveryCharges?: number;
  tax?: number;
  store?: { id?: string; name?: string };
  rider?: { id?: string; name?: string };
  customer?: { id?: string; name?: string };
  notes?: string;
  /** Platform-wide operational labels for this order. */
  stageReason?: string;
  timeline?: OrderTimelineEntry[];
  pickup?: {
    sellerId?: string | null;
    locationId?: string | null;
    address?: unknown;
    status?: string | null;
    actorId?: string | null;
    readyAt?: string | null;
    pickedUpAt?: string | null;
  };
  dropOff?: {
    destinationLocationId?: string | null;
    address?: unknown;
    deliveredAt?: string | null;
    failureReason?: string | null;
    cancelledAt?: string | null;
    cancellationReason?: string | null;
  };
  /** True when the Delivery service could not be reached for this order. */
  deliveryUnavailable?: boolean;
}