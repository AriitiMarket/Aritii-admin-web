/** Customers service facade. */
import type { Customer, CustomerDetail, PaginatedResult, UsersFilter } from '@/types';
import { identityAdmin } from '@/api/admin';

/**
 * Customers are identity users with the BUYER role — the canonical spelling of
 * the buy-side actor (the legacy `CUSTOMER` spelling is a read-time alias that
 * Identity folds into BUYER, and a `role=BUYER` filter matches both old and new
 * rows). Sending both values would be redundant, so this facade sends one.
 */
const BUYER_ROLE = 'BUYER';

export const customersService = {
  async list(filter: UsersFilter): Promise<PaginatedResult<Customer>> {
    const result = await identityAdmin.listUsers(
      filter.page,
      filter.limit,
      filter.search,
      BUYER_ROLE
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
