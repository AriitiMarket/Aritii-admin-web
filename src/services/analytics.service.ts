/** Analytics service facade. */
import type {
  DashboardStats,
  DistributionSlice,
  SalesByType,
  UsersGrowthSeries,
  SalesOverTimePoint,
  CategoryActivity,
  ProductStats,
  DisputeStats,
  DeliveryStatsData,
  ShopStats,
  RiderPerformanceItem,
} from '@/types';
import { analyticsAdmin, reportsAdmin } from '@/api/admin';

export const analyticsService = {
  async getStats(startDate?: string, endDate?: string): Promise<DashboardStats> {
    return reportsAdmin.getStats(startDate, endDate);
  },
  async getUsersGrowth(startDate?: string, endDate?: string): Promise<UsersGrowthSeries> {
    return reportsAdmin.getGrowth(startDate, endDate);
  },
  async getOrdersByType(startDate?: string, endDate?: string): Promise<DistributionSlice[]> {
    return reportsAdmin.getOrdersByType(startDate, endDate);
  },
  async getSalesByType(startDate?: string, endDate?: string): Promise<SalesByType> {
    return reportsAdmin.getSalesByType(startDate, endDate);
  },
  async getSalesOverTime(startDate?: string, endDate?: string): Promise<SalesOverTimePoint[]> {
    return reportsAdmin.getSalesOverTime(startDate, endDate);
  },
  async getOrdersByStatus(startDate?: string, endDate?: string): Promise<DistributionSlice[]> {
    return reportsAdmin.getOrdersByStatus(startDate, endDate);
  },
  async getCategoryActivity(startDate?: string, endDate?: string): Promise<CategoryActivity[]> {
    return reportsAdmin.getCategoryActivity(startDate, endDate);
  },
  async getProductStats(startDate?: string, endDate?: string): Promise<ProductStats> {
    return reportsAdmin.getProductStats(startDate, endDate);
  },
  async getDisputeStats(startDate?: string, endDate?: string): Promise<DisputeStats> {
    return reportsAdmin.getDisputeStats(startDate, endDate);
  },
  async getDeliveryStats(startDate?: string, endDate?: string): Promise<DeliveryStatsData> {
    return reportsAdmin.getDeliveryStats(startDate, endDate);
  },
  async getRiderPerformance(startDate?: string, endDate?: string): Promise<RiderPerformanceItem[]> {
    return reportsAdmin.getRiderPerformance(startDate, endDate);
  },
  async getShopStats(startDate?: string, endDate?: string): Promise<ShopStats> {
    return reportsAdmin.getShopStats(startDate, endDate);
  },
  async getDashboardUsers(): Promise<{ users: number; sellers: number; stores: number; riders: number }> {
    return analyticsAdmin.getDashboardUsers();
  },
  async getPendingApprovals(): Promise<{ pendingStores: number; pendingRiders: number; pendingSellers: number; total: number }> {
    return analyticsAdmin.getPendingApprovals();
  },
  async getRecentActivity(): Promise<{ recentOrders: any[] }> {
    return analyticsAdmin.getRecentActivity();
  },
};
