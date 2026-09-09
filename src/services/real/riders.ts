/**
 * Real riders service — Ariiti API Gateway contract.
 * @boundary: these endpoints are the documented integration contracts and
 * are pending gateway/backend implementation.
 */
import { assertGatewayConfigured, http } from '@/services/client/httpClient';
import type {
  PaginatedResult,
  Rider,
  RiderDetail,
  UsersFilter,
} from '@/types';

interface RealPagedRiders {
  data: { riders: Rider[]; total: number; page: number; limit: number };
}

export async function realListRiders(
  filter: UsersFilter
): Promise<PaginatedResult<Rider>> {
  assertGatewayConfigured();
  const response = await http.get<RealPagedRiders>('/riders', {
    params: { page: filter.page, limit: filter.limit, search: filter.search },
  });
  const { riders, total, page, limit } = response.data;
  return {
    items: riders,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function realGetRider(id: string): Promise<RiderDetail> {
  assertGatewayConfigured();
  const response = await http.get<{ data: { rider: RiderDetail } }>(
    `/riders/${id}`
  );
  return response.data.rider;
}