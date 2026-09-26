/** Customers service facade. */
import type { Customer, CustomerDetail, PaginatedResult, UsersFilter } from '@/types';
import { identityAdmin } from '@/api/admin';

/**
 * Customers are identity users with the `CUSTOMER` role — that is the only value
 * the users table stores (see identity `src/models/Role.js`) and `/admin/users`
 * matches it exactly. This facade used to send `'BUYER'`, which matched no row,
 * so the Customers list was always empty; the Users page's Customers tab reads
 * real data because of this fix.
 */
const CUSTOMER_ROLE = 'CUSTOMER';

export const customersService = {
  async list(filter: UsersFilter): Promise<PaginatedResult<Customer>> {
    const result = await identityAdmin.listUsers(
      filter.page,
      filter.limit,
      filter.search,
      CUSTOMER_ROLE
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
