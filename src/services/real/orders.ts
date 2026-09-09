/**
 * Real orders service — Ariiti API Gateway contract.
 * @boundary: these endpoints are the documented integration contracts and
 * are pending gateway/backend implementation.
 */
import { assertGatewayConfigured, http } from '@/services/client/httpClient';
import type { Order, OrderDetail, OrderStatus, PaginatedResult } from '@/types';

interface RealPagedOrders {
  data: {
    orders: Order[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function realListOrders(
  page: number,
  limit: number,
  status?: OrderStatus
): Promise<PaginatedResult<Order>> {
  assertGatewayConfigured();
  const response = await http.get<RealPagedOrders>('/orders', {
    params: { page, limit, status },
  });
  return {
    items: response.data.orders,
    total: response.data.total,
    page: response.data.page,
    limit: response.data.limit,
    totalPages: response.data.totalPages,
  };
}

export async function realGetOrder(id: string): Promise<OrderDetail> {
  assertGatewayConfigured();
  const response = await http.get<{ data: { order: OrderDetail } }>(
    `/orders/${id}`
  );
  return response.data.order;
}