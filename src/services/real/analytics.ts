/**
 * Real analytics service — Ariiti API Gateway contract.
 * @boundary: these endpoints are the documented integration contracts and
 * are pending gateway/backend implementation.
 */
import { assertGatewayConfigured, http } from '@/services/client/httpClient';
import type {
  DashboardStats,
  DistributionSlice,
  SalesByType,
  UsersGrowthSeries,
} from '@/types';

export async function realGetStats(): Promise<DashboardStats> {
  assertGatewayConfigured();
  const response = await http.get<{ data: { stats: DashboardStats } }>(
    '/analytics/stats'
  );
  return response.data.stats;
}

export async function realGetUsersGrowth(): Promise<UsersGrowthSeries> {
  assertGatewayConfigured();
  const response = await http.get<{ data: { growth: UsersGrowthSeries } }>(
    '/analytics/growth'
  );
  return response.data.growth;
}

export async function realGetOrdersByType(): Promise<DistributionSlice[]> {
  assertGatewayConfigured();
  const response = await http.get<{ data: { slices: DistributionSlice[] } }>(
    '/analytics/orders-by-type'
  );
  return response.data.slices;
}

export async function realGetSalesByType(): Promise<SalesByType> {
  assertGatewayConfigured();
  const response = await http.get<{ data: { sales: SalesByType } }>(
    '/analytics/sales-by-type'
  );
  return response.data.sales;
}

export async function realGetDashboardUsers(): Promise<{
  users: number;
  sellers: number;
  stores: number;
  riders: number;
}> {
  assertGatewayConfigured();
  const response = await http.get<{ data: { counts: { users: number; sellers: number; stores: number; riders: number } } }>(
    '/analytics/dashboard-users'
  );
  return response.data.counts;
}