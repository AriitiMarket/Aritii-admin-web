/** Analytics domain types. */
export interface DashboardStats {
  totalUsers: number;
  totalSellers: number;
  totalStores: number;
  totalRiders: number;
  totalOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
}

export interface UsersGrowthSeries {
  usersCount: number[];
  sellersCount: number[];
  storesCount: number[];
  ridersCount: number[];
}

export interface DistributionSlice {
  label: string;
  value: number;
}

export interface AnalyticsSummary {
  revenue: number;
  ordersCount: number;
  averageOrderValue: number;
  activeStores: number;
  activeRiders: number;
}

export interface SalesByType {
  delivery: number;
  pickup: number;
}