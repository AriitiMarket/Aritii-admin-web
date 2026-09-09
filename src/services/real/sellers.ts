/**
 * Real sellers service — Ariiti API Gateway contract.
 * @boundary: these endpoints are the documented integration contracts and
 * are pending gateway/backend implementation.
 */
import { assertGatewayConfigured, http } from '@/services/client/httpClient';
import type {
  PaginatedResult,
  Seller,
  SellerDetail,
  UsersFilter,
} from '@/types';

interface RealPagedSellers {
  data: { sellers: Seller[]; total: number; page: number; limit: number };
}

export async function realListSellers(
  filter: UsersFilter
): Promise<PaginatedResult<Seller>> {
  assertGatewayConfigured();
  const response = await http.get<RealPagedSellers>('/sellers', {
    params: { page: filter.page, limit: filter.limit, search: filter.search },
  });
  const { sellers, total, page, limit } = response.data;
  return {
    items: sellers,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function realGetSeller(id: string): Promise<SellerDetail> {
  assertGatewayConfigured();
  const response = await http.get<{ data: { seller: SellerDetail } }>(
    `/sellers/${id}`
  );
  return response.data.seller;
}