/** Orders service facade. */
import { isMockMode } from '@/utils/env';
import type { Order, OrderDetail, OrderStatus, PaginatedResult } from '@/types';
import { mockGetOrder, mockListOrders } from './mock/orders';
import { realGetOrder, realListOrders } from './real/orders';

export const ordersService = {
  list(
    page: number,
    limit: number,
    status?: OrderStatus
  ): Promise<PaginatedResult<Order>> {
    return isMockMode()
      ? mockListOrders(page, limit, status)
      : realListOrders(page, limit, status);
  },
  get(id: string): Promise<OrderDetail> {
    return isMockMode() ? mockGetOrder(id) : realGetOrder(id);
  },
};