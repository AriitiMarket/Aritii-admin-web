/** Mock-mode stores implementation. */
import { http } from '@/services/client/httpClient';
import type { PaginatedResult, Store, StoreDetail, UsersFilter } from '@/types';
import type { MockRestaurant } from './types';

interface MockRestaurantsResponse {
  restaurants: MockRestaurant[];
}

interface MockRestaurantResponse {
  restaurant: MockRestaurant;
}

export const toStore = (raw: MockRestaurant): Store => {
  const active = raw.isActive !== false;
  const pending = !active || raw.isAvailable === false || raw.stripeDetailsSubmitted === false;
  return {
    id: raw._id,
    name: raw.name,
    image: raw.image,
    phone: raw.phone,
    address: raw.address,
    status: pending ? 'PENDING' : active ? 'ACTIVE' : 'INACTIVE',
    isActive: active,
    orderId: raw.orderId,
    orderPrefix: raw.orderPrefix,
    commissionRate: raw.commissionRate,
    tax: raw.tax,
    sector: raw.shopType ?? '',
    cuisines: raw.cuisines ?? [],
    rating: raw.rating,
    createdAt: raw.createdAt,
  };
};

export async function mockListStores(): Promise<Store[]> {
  const response = await http.get<MockRestaurantsResponse>('/admin/restaurants');
  return response.restaurants.map(toStore);
}

export async function mockListPendingStores(): Promise<Store[]> {
  const stores = await mockListStores();
  return stores.filter((store) => store.status === 'PENDING');
}

export async function mockGetStore(id: string): Promise<StoreDetail> {
  const response = await http.get<MockRestaurantResponse>(
    `/admin/restaurant/profile?id=${encodeURIComponent(id)}`
  );
  const raw = response.restaurant;
  const store = toStore(raw);
  return {
    ...store,
    owner: raw.owner,
    deliveryInfo: raw.deliveryInfo,
    location: raw.location,
  };
}

export const paginateStores = (
  stores: Store[],
  page: number,
  limit: number
): PaginatedResult<Store> => {
  const start = (page - 1) * limit;
  return {
    items: stores.slice(start, start + limit),
    total: stores.length,
    page,
    limit,
    totalPages: Math.ceil(stores.length / limit),
  };
};

export function toMockFilter(
  page: number,
  limit: number,
  search?: string
): UsersFilter {
  return { page, limit, search };
}