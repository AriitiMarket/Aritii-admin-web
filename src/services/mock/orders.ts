/** Mock-mode orders implementation. */
import { http } from '@/services/client/httpClient';
import type { Order, OrderDetail, OrderStatus, PaginatedResult } from '@/types';
import type { MockOrder } from './types';

interface MockOrdersResponse {
  orders: MockOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const toOrder = (raw: MockOrder): Order => ({
  id: raw._id,
  orderId: raw.orderId,
  orderAmount: raw.orderAmount,
  payer: raw.user?.name ?? '—',
  orderType: raw.orderType,
  orderStatus: raw.orderStatus,
  deliveryAddress: raw.deliveryAddress?.deliveryAddress,
  paymentMethod: raw.paymentMethod,
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
  sector: raw.restaurant?.name ?? '',
  items: (raw.items ?? []).map((item) => ({
    id: item._id,
    title: item.title,
    quantity: item.quantity,
    price: item.variation?.price,
  })),
});

export async function mockListOrders(
  page: number,
  limit: number,
  status?: OrderStatus
): Promise<PaginatedResult<Order>> {
  const response = await http.get<MockOrdersResponse>('/admin/orders', {
    params: { page, limit, status },
  });
  const { orders, total, page: current, limit: currentLimit, totalPages } = response;
  return {
    items: orders.map(toOrder),
    total,
    page: current,
    limit: currentLimit,
    totalPages: totalPages || Math.ceil(total / limit),
  };
}

export async function mockGetOrder(id: string): Promise<OrderDetail> {
  const response = await http.get<{ order: MockOrder }>(`/admin/order/${id}`);
  const raw = response.order;
  return {
    ...toOrder(raw),
    deliveryCharges: raw.deliveryCharges,
    tax: raw.taxationAmount,
    store: raw.restaurant
      ? { id: raw.restaurant._id, name: raw.restaurant.name }
      : undefined,
    rider: raw.rider ? { id: raw.rider._id, name: raw.rider.name } : undefined,
    customer: raw.user
      ? { id: raw.user._id, name: raw.user.name }
      : undefined,
  };
}