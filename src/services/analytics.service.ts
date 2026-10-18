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
  businessId?: string;
}

export const analyticsService = {
  async getStats(params?: string | QueryParams, endDate?: string, businessId?: string): Promise<DashboardStats> {
    if (typeof params === 'string') {
      return reportsAdmin.getStats(params, endDate, businessId);
    }
    const p = params || {};
    return reportsAdmin.getStats(p.startDate, p.endDate, p.businessId);
  },
  async getUsersGrowth(params?: string | QueryParams, endDate?: string, businessId?: string): Promise<UsersGrowthSeries> {
    if (typeof params === 'string') {
      return reportsAdmin.getGrowth(params, endDate, businessId);
    }
    const p = params || {};
    return reportsAdmin.getGrowth(p.startDate, p.endDate, p.businessId);
  },
  async getOrdersByType(params?: string | QueryParams, endDate?: string, businessId?: string): Promise<DistributionSlice[]> {
    if (typeof params === 'string') {
      return reportsAdmin.getOrdersByType(params, endDate, businessId);
    }
    const p = params || {};
    return reportsAdmin.getOrdersByType(p.startDate, p.endDate, p.businessId);
  },
  async getSalesByType(params?: string | QueryParams, endDate?: string, businessId?: string): Promise<SalesByType> {
    if (typeof params === 'string') {
      return reportsAdmin.getSalesByType(params, endDate, businessId);
    }
    const p = params || {};
    return reportsAdmin.getSalesByType(p.startDate, p.endDate, p.businessId);
  },
  async getSalesOverTime(params?: string | QueryParams, endDate?: string, businessId?: string): Promise<SalesOverTimePoint[]> {
    if (typeof params === 'string') {
      return reportsAdmin.getSalesOverTime(params, endDate, businessId);
    }
    const p = params || {};
    return reportsAdmin.getSalesOverTime(p.startDate, p.endDate, p.businessId);
  },
  async getOrdersByStatus(params?: string | QueryParams, endDate?: string, businessId?: string): Promise<DistributionSlice[]> {
    if (typeof params === 'string') {
      return reportsAdmin.getOrdersByStatus(params, endDate, businessId);
    }
    const p = params || {};
    return reportsAdmin.getOrdersByStatus(p.startDate, p.endDate, p.businessId);
  },
  async getCategoryActivity(params?: string | QueryParams, endDate?: string, businessId?: string): Promise<CategoryActivity[]> {
    if (typeof params === 'string') {
      return reportsAdmin.getCategoryActivity(params, endDate, businessId);
    }
    const p = params || {};
    return reportsAdmin.getCategoryActivity(p.startDate, p.endDate, p.businessId);
  },
  async getProductStats(params?: string | QueryParams, endDate?: string, businessId?: string): Promise<ProductStats> {
    if (typeof params === 'string') {
      return reportsAdmin.getProductStats(params, endDate, businessId);
    }
    const p = params || {};
    return reportsAdmin.getProductStats(p.startDate, p.endDate, p.businessId);
  },
  async getDisputeStats(params?: string | QueryParams, endDate?: string, businessId?: string): Promise<DisputeStats> {
    if (typeof params === 'string') {
      return reportsAdmin.getDisputeStats(params, endDate, businessId);
    }
    const p = params || {};
    return reportsAdmin.getDisputeStats(p.startDate, p.endDate, p.businessId);
  },
  async getDeliveryStats(params?: string | QueryParams, endDate?: string, businessId?: string): Promise<DeliveryStatsData> {
    if (typeof params === 'string') {
      return reportsAdmin.getDeliveryStats(params, endDate, businessId);
    }
    const p = params || {};
    return reportsAdmin.getDeliveryStats(p.startDate, p.endDate, p.businessId);
  },
  async getRiderPerformance(params?: string | QueryParams, endDate?: string, businessId?: string): Promise<RiderPerformanceItem[]> {
    if (typeof params === 'string') {
      return reportsAdmin.getRiderPerformance(params, endDate, businessId);
    }
    const p = params || {};
    return reportsAdmin.getRiderPerformance(p.startDate, p.endDate, p.businessId);
  },
  async getShopStats(startDate?: string, endDate?: string, businessId?: string): Promise<ShopStats> {
    return reportsAdmin.getShopStats(startDate, endDate, businessId);
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
