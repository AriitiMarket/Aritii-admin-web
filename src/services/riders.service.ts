/** Riders service facade. */
import { isMockMode } from '@/utils/env';
import type { PaginatedResult, Rider, RiderDetail, UsersFilter } from '@/types';
import { mockGetRider, mockListRiders } from './mock/riders';
import { realGetRider, realListRiders } from './real/riders';

export const ridersService = {
  list(filter: UsersFilter): Promise<PaginatedResult<Rider>> {
    return isMockMode() ? mockListRiders(filter) : realListRiders(filter);
  },
  get(id: string): Promise<RiderDetail> {
    return isMockMode() ? mockGetRider(id) : realGetRider(id);
  },
};