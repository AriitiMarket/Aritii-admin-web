/** Mock-mode riders implementation. */
import { http } from '@/services/client/httpClient';
import type { PaginatedResult, Rider, RiderDetail, UsersFilter } from '@/types';
import type { MockRider } from './types';

export interface MockRidersResponse {
  riders: MockRider[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const toRider = (raw: MockRider): Rider => ({
  id: raw._id,
  name: raw.name,
  username: raw.username,
  email: raw.email,
  phone: raw.phone,
  status: raw.isActive === false ? 'PENDING' : raw.available === false ? 'ACTIVE' : 'ACTIVE',
  isActive: raw.isActive ?? true,
  vehicleType: raw.vehicleType,
  sector: raw.zone?.title ?? '',
  createdAt: raw.createdAt,
});

export async function mockListRiders(
  filter: UsersFilter
): Promise<PaginatedResult<Rider>> {
  const response = await http.get<MockRidersResponse>('/admin/riders', {
    params: { page: filter.page, limit: filter.limit, search: filter.search },
  });
  const { riders, total, page, limit, totalPages } = response;
  return {
    items: riders.map(toRider),
    total,
    page,
    limit,
    totalPages: totalPages || Math.ceil(total / limit),
  };
}

export async function mockGetRider(id: string): Promise<RiderDetail> {
  const response = await http.get<{ rider: MockRider }>(`/admin/rider/${id}`);
  const rider = toRider(response.rider);
  return {
    ...rider,
    zone: response.rider.zone
      ? { id: response.rider.zone._id, name: response.rider.zone.title }
      : undefined,
  };
}