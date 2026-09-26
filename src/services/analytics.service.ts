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

/**
 * One row of the dashboard's "recent activity" feed. The API returns order
 * summaries; only these fields are read by the dashboard.
 */
export interface RecentOrderSummary {
  id?: string;
  orderId?: string;
  totalPrice?: number;
  status?: string;
  createdAt?: string;
}

interface QueryParams {
  startDate?: string;
  endDate?: string;
}

export const analyticsService = {
  async getStats(params?: string | QueryParams, endDate?: string): Promise<DashboardStats> {
    // Handle both old (startDate, endDate) and new (params object) signatures
    if (typeof params === 'string') {
      return reportsAdmin.getStats(params, endDate);
    }
    const p = params || {};
    return reportsAdmin.getStats(p.startDate, p.endDate);
  },
  async getUsersGrowth(params?: string | QueryParams, endDate?: string): Promise<UsersGrowthSeries> {
    if (typeof params === 'string') {
      return reportsAdmin.getGrowth(params, endDate);
    }
    const p = params || {};
    return reportsAdmin.getGrowth(p.startDate, p.endDate);
  },
  async getOrdersByType(params?: string | QueryParams, endDate?: string): Promise<DistributionSlice[]> {
    if (typeof params === 'string') {
      return reportsAdmin.getOrdersByType(params, endDate);
    }
    const p = params || {};
    return reportsAdmin.getOrdersByType(p.startDate, p.endDate);
  },
  async getSalesByType(params?: string | QueryParams, endDate?: string): Promise<SalesByType> {
    if (typeof params === 'string') {
      return reportsAdmin.getSalesByType(params, endDate);
    }
    const p = params || {};
    return reportsAdmin.getSalesByType(p.startDate, p.endDate);
  },
  async getSalesOverTime(params?: string | QueryParams, endDate?: string): Promise<SalesOverTimePoint[]> {
    if (typeof params === 'string') {
      return reportsAdmin.getSalesOverTime(params, endDate);
    }
    const p = params || {};
    return reportsAdmin.getSalesOverTime(p.startDate, p.endDate);
  },
  async getOrdersByStatus(params?: string | QueryParams, endDate?: string): Promise<DistributionSlice[]> {
    if (typeof params === 'string') {
      return reportsAdmin.getOrdersByStatus(params, endDate);
    }
    const p = params || {};
    return reportsAdmin.getOrdersByStatus(p.startDate, p.endDate);
  },
  async getCategoryActivity(params?: string | QueryParams, endDate?: string): Promise<CategoryActivity[]> {
    if (typeof params === 'string') {
      return reportsAdmin.getCategoryActivity(params, endDate);
    }
    const p = params || {};
    return reportsAdmin.getCategoryActivity(p.startDate, p.endDate);
  },
  async getProductStats(params?: string | QueryParams, endDate?: string): Promise<ProductStats> {
    if (typeof params === 'string') {
      return reportsAdmin.getProductStats(params, endDate);
    }
    const p = params || {};
    return reportsAdmin.getProductStats(p.startDate, p.endDate);
  },
  async getDisputeStats(params?: string | QueryParams, endDate?: string): Promise<DisputeStats> {
    if (typeof params === 'string') {
      return reportsAdmin.getDisputeStats(params, endDate);
    }
    const p = params || {};
    return reportsAdmin.getDisputeStats(p.startDate, p.endDate);
  },
  async getDeliveryStats(params?: string | QueryParams, endDate?: string): Promise<DeliveryStatsData> {
    if (typeof params === 'string') {
      return reportsAdmin.getDeliveryStats(params, endDate);
    }
    const p = params || {};
    return reportsAdmin.getDeliveryStats(p.startDate, p.endDate);
  },
  async getRiderPerformance(params?: string | QueryParams, endDate?: string): Promise<RiderPerformanceItem[]> {
    if (typeof params === 'string') {
      return reportsAdmin.getRiderPerformance(params, endDate);
    }
    const p = params || {};
    return reportsAdmin.getRiderPerformance(p.startDate, p.endDate);
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
  async getRecentActivity(): Promise<{ recentOrders: RecentOrderSummary[] }> {
    return analyticsAdmin.getRecentActivity();
  },
};
