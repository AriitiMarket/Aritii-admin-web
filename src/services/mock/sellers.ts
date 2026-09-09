/** Mock-mode sellers (vendors) implementation. */
import { http } from '@/services/client/httpClient';
import type {
  PaginatedResult,
  Seller,
  SellerDetail,
  UsersFilter,
} from '@/types';
import type { MockVendor } from './types';

export interface MockVendorsResponse {
  vendors: MockVendor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const toSeller = (raw: MockVendor): Seller => ({
  id: raw._id,
  name: raw.name,
  email: raw.email,
  phone: raw.phoneNumber,
  status: raw.isActive === false ? 'PENDING' : 'ACTIVE',
  isActive: raw.isActive ?? true,
  storesCount: raw.totalRestaurants ?? raw.restaurants?.length ?? 0,
  sector: '',
  createdAt: raw.createdAt,
});

export async function mockListSellers(
  filter: UsersFilter
): Promise<PaginatedResult<Seller>> {
  const response = await http.get<MockVendorsResponse>('/admin/vendors', {
    params: { page: filter.page, limit: filter.limit, search: filter.search },
  });
  const { vendors, total, page, limit, totalPages } = response;
  return {
    items: vendors.map(toSeller),
    total,
    page,
    limit,
    totalPages: totalPages || Math.ceil(total / limit),
  };
}

export async function mockGetSeller(id: string): Promise<SellerDetail> {
  const response = await http.get<{ vendor: MockVendor }>(`/admin/vendor/${id}`);
  const seller = toSeller(response.vendor);
  return {
    ...seller,
    stores: (response.vendor.restaurants ?? []).map((r) => r._id),
    address: response.vendor.address,
  };
}