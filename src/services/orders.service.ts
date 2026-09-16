/** Orders service facade. */
import type { Order, OrderDetail, OrderStatus, PaginatedResult } from '@/types';
import { commerceAdmin } from '@/api/admin';

export interface ListOrdersOptions {
  page: number;
  limit: number;
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
}

export const ordersService = {
  async list(options: ListOrdersOptions): Promise<PaginatedResult<Order>> {
    return commerceAdmin.listOrders(options);
  },
  async get(id: string): Promise<OrderDetail> {
    return commerceAdmin.getOrder(id);
  },
};
