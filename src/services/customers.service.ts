/** Customers service facade. */
import type { Customer, CustomerDetail, PaginatedResult, UsersFilter } from '@/types';
import { identityAdmin } from '@/api/admin';

export const customersService = {
  async list(filter: UsersFilter): Promise<PaginatedResult<Customer>> {
    const result = await identityAdmin.listUsers(
      filter.page,
      filter.limit,
      filter.search,
      'BUYER'
    );
    return {
      items: result.items as Customer[],
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  },
  async get(id: string): Promise<CustomerDetail> {
    return identityAdmin.getUser(id) as Promise<CustomerDetail>;
  },
};
