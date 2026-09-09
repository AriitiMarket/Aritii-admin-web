/** Sellers service facade. */
import { isMockMode } from '@/utils/env';
import type { PaginatedResult, Seller, SellerDetail, UsersFilter } from '@/types';
import { mockGetSeller, mockListSellers } from './mock/sellers';
import { realGetSeller, realListSellers } from './real/sellers';

export const sellersService = {
  list(filter: UsersFilter): Promise<PaginatedResult<Seller>> {
    return isMockMode() ? mockListSellers(filter) : realListSellers(filter);
  },
  get(id: string): Promise<SellerDetail> {
    return isMockMode() ? mockGetSeller(id) : realGetSeller(id);
  },
};