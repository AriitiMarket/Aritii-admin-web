/** Orders. */
export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'ASSIGNED'
  | 'PICKED'
  | 'ARRIVED'
  | 'DELIVERED'
  | 'CANCELLED';

export type OrderType = 'DELIVERY' | 'PICKUP';

export interface Order {
  id: string;
  orderId: string;
  orderAmount: number;
  payer: string;
  orderType: OrderType;
  orderStatus: OrderStatus;
  deliveryAddress?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt?: string;
  sector: string;
  items?: Array<{
    id?: string;
    title?: string;
    quantity?: number;
    price?: number;
  }>;
}

export interface OrderDetail extends Order {
  deliveryCharges?: number;
  tax?: number;
  store?: { id?: string; name?: string };
  rider?: { id?: string; name?: string };
  customer?: { id?: string; name?: string };
  notes?: string;
}