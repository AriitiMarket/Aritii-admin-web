/** Mock-mode analytics implementation. */
import { http } from '@/services/client/httpClient';
import type {
  DashboardStats,
  DistributionSlice,
  SalesByType,
  UsersGrowthSeries,
} from '@/types';
import type { MockStats } from './types';

interface MockStatsResponse {
  stats: MockStats;
}

interface MockDashboardUsersResponse {
  getDashboardUsers: {
    usersCount: number;
    vendorsCount: number;
    restaurantsCount: number;
    ridersCount: number;
  };
}

interface MockUsersByYearResponse {
  getDashboardUsersByYear: {
    usersCount: number[];
    vendorsCount: number[];
    restaurantsCount: number[];
    ridersCount: number[];
  };
}

interface MockDistributionResponse {
  getDashboardOrdersByType?: DistributionSlice[];
  getDashboardSalesByType?: DistributionSlice[];
}

export async function mockGetStats(): Promise<DashboardStats> {
  const response = await http.get<MockStatsResponse>('/admin/stats');
  const s = response.stats;
  return {
    totalUsers: s.totalUsers,
    totalSellers: s.totalVendors,
    totalStores: s.totalRestaurants,
    totalRiders: s.totalRiders,
    totalOrders: s.totalOrders,
    deliveredOrders: s.deliveredOrders,
    totalRevenue: s.totalRevenue,
  };
}

export async function mockGetUsersGrowth(): Promise<UsersGrowthSeries> {
  const response = await http.get<MockUsersByYearResponse>(
    '/admin/dashboard/users-by-year',
    { params: { year: new Date().getFullYear() } }
  );
  return {
    usersCount: response.getDashboardUsersByYear.usersCount,
    sellersCount: response.getDashboardUsersByYear.vendorsCount,
    storesCount: response.getDashboardUsersByYear.restaurantsCount,
    ridersCount: response.getDashboardUsersByYear.ridersCount,
  };
}

export async function mockGetOrdersByType(): Promise<DistributionSlice[]> {
  const response = await http.get<MockDistributionResponse>(
    '/admin/dashboard/orders-by-type'
  );
  return response.getDashboardOrdersByType ?? [];
}

export async function mockGetSalesByType(): Promise<SalesByType> {
  const response = await http.get<MockDistributionResponse>(
    '/admin/dashboard/sales-by-type'
  );
  const slices = response.getDashboardSalesByType ?? [];
  return {
    delivery: slices.find((s) => s.label === 'DELIVERY')?.value ?? 0,
    pickup: slices.find((s) => s.label === 'PICKUP')?.value ?? 0,
  };
}

export async function mockGetDashboardUsers(): Promise<{
  users: number;
  sellers: number;
  stores: number;
  riders: number;
}> {
  const response = await http.get<MockDashboardUsersResponse>(
    '/admin/dashboard/users'
  );
  return {
    users: response.getDashboardUsers.usersCount,
    sellers: response.getDashboardUsers.vendorsCount,
    stores: response.getDashboardUsers.restaurantsCount,
    riders: response.getDashboardUsers.ridersCount,
  };
}