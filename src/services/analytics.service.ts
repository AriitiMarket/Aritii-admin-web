/** Analytics service facade. */
import { isMockMode } from '@/utils/env';
import type {
  DashboardStats,
  DistributionSlice,
  SalesByType,
  UsersGrowthSeries,
} from '@/types';
import {
  mockGetDashboardUsers,
  mockGetOrdersByType,
  mockGetSalesByType,
  mockGetStats,
  mockGetUsersGrowth,
} from './mock/analytics';
import {
  realGetDashboardUsers,
  realGetOrdersByType,
  realGetSalesByType,
  realGetStats,
  realGetUsersGrowth,
} from './real/analytics';

export const analyticsService = {
  getStats(): Promise<DashboardStats> {
    return isMockMode() ? mockGetStats() : realGetStats();
  },
  getUsersGrowth(): Promise<UsersGrowthSeries> {
    return isMockMode() ? mockGetUsersGrowth() : realGetUsersGrowth();
  },
  getOrdersByType(): Promise<DistributionSlice[]> {
    return isMockMode() ? mockGetOrdersByType() : realGetOrdersByType();
  },
  getSalesByType(): Promise<SalesByType> {
    return isMockMode() ? mockGetSalesByType() : realGetSalesByType();
  },
  getDashboardUsers(): Promise<{ users: number; sellers: number; stores: number; riders: number }> {
    return isMockMode() ? mockGetDashboardUsers() : realGetDashboardUsers();
  },
};