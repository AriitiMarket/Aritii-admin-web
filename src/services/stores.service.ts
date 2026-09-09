/** Stores service facade — normalizes mock/real sources into a paged list. */
import { isMockMode } from '@/utils/env';
import type { PaginatedResult, Store, StoreDetail } from '@/types';
import {
  mockGetStore,
  mockListPendingStores,
  mockListStores,
  paginateStores,
} from './mock/stores';
import { realGetStore, realListPendingStores, realListStores } from './real/stores';

export interface StoreListFilter {
  page: number;
  limit: number;
  search?: string;
  status?: 'PENDING' | 'ACTIVE' | 'INACTIVE';
}

export const storesService = {
  async list(filter: StoreListFilter): Promise<PaginatedResult<Store>> {
    const stores = isMockMode()
      ? await mockListStores()
      : await realListStores();
    const term = (filter.search ?? '').toLowerCase();
    const filtered = stores.filter((store) => {
      if (term && !store.name.toLowerCase().includes(term)) return false;
      if (filter.status && store.status !== filter.status) return false;
      return true;
    });
    return paginateStores(filtered, filter.page, filter.limit);
  },
  pending(): Promise<Store[]> {
    return isMockMode() ? mockListPendingStores() : realListPendingStores();
  },
  get(id: string): Promise<StoreDetail> {
    return isMockMode() ? mockGetStore(id) : realGetStore(id);
  },
};