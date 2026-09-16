/** Analytics domain types. */
export interface DashboardStats {
  totalUsers: number;
  totalSellers: number;
  totalStores: number;
  totalRiders: number;
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  totalProducts: number;
  avgOrderValue: number;
  deliveryRate: number;
}

export interface UsersGrowthSeries {
  labels: string[];
  usersCount: number[];
  sellersCount: number[];
  storesCount: number[];
  ridersCount: number[];
  ordersCount: number[];
  revenueCount: number[];
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

export interface SalesOverTimePoint {
  date: string;
  revenue: number;
  count: number;
}

export interface CategoryActivity {
  category: string;
  count: number;
}

export interface ProductStats {
  totalProducts: number;
  newProducts: number;
  lowStock: number;
  outOfStock: number;
  totalStock: number;
  avgPrice: number;
}

export interface DisputeStats {
  total: number;
  newDisputes: number;
  open: number;
  inProgress: number;
  resolved: number;
  rejected: number;
  closed: number;
  byType: { type: string; count: number }[];
  byPriority: { priority: string; count: number }[];
}

export interface DeliveryStatsData {
  totalRiders: number;
  activeRiders: number;
  totalDeliveries: number;
  completedDeliveries: number;
  failedDeliveries: number;
  avgDeliveryTime: number;
  completionRate: number;
}

export interface ShopStats {
  total: number;
  newShops: number;
  approved: number;
  pending: number;
  suspended: number;
  inactive: number;
}

export interface RiderPerformanceItem {
  id: string;
  name: string;
  status: string;
  completedDeliveries: number;
  activeDeliveries: number;
  rating: number;
  vehicleType: string;
}
