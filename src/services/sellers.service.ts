/** Sellers service facade. */
import type { PaginatedResult, Seller, SellerDetail, UsersFilter } from '@/types';
import { identityAdmin } from '@/api/admin';

export const sellersService = {
  async list(filter: UsersFilter): Promise<PaginatedResult<Seller>> {
    const sellers = await identityAdmin.listSellers(filter.page, filter.limit, filter.search);
    return {
      items: sellers,
      total: sellers.length,
      page: filter.page || 1,
      limit: filter.limit || 10,
      totalPages: 1,
    };
  },
  async get(id: string): Promise<SellerDetail> {
    return identityAdmin.getSeller(id);
  },
};
