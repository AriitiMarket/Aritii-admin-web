/** Sellers service facade. */
import type { PaginatedResult, Seller, SellerDetail, UsersFilter } from '@/types';
import { identityAdmin } from '@/api/admin';

export const sellersService = {
  async list(filter: UsersFilter): Promise<PaginatedResult<Seller>> {
    const result = await identityAdmin.listSellers(filter.page, filter.limit, filter.search);
    return {
      items: result.sellers,
      total: result.total,
      page: result.page || filter.page || 1,
      limit: result.limit || filter.limit || 10,
      totalPages: Math.ceil(result.total / (result.limit || filter.limit || 10)) || 1,
    };
  },
  async get(id: string): Promise<SellerDetail> {
    return identityAdmin.getSeller(id);
  },
};
