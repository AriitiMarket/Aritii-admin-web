/**
 * Centralized Admin API module
 * All admin operations route through this module
 */

import { http } from '@/services/client/httpClient';
import type {
  AdminUser,
  Seller,
  SellerDetail,
  Customer,
  CustomerDetail,
  Category,
  Sector,
  Order,
  OrderDetail,
  Review,
  DashboardStats,
  UsersGrowthSeries,
  DistributionSlice,
  SalesByType,
} from '@/types';

// ── Identity Service Admin APIs ──

export const identityAdmin = {
  async listSellers(page = 1, limit = 10, search = '') {
    const res = await http.get<{ success: boolean; sellers: Seller[] }>(
      '/admin/sellers',
      { params: { page, limit, search } }
    );
    return res.sellers || [];
  },

  async getSeller(id: string) {
    const res = await http.get<{ success: boolean; seller: SellerDetail }>(
      `/admin/sellers/${id}`
    );
    return res.seller;
  },

  async listUsers(page = 1, limit = 10, search = '', role = '') {
    const res = await http.get<{
      success: boolean;
      users: (Customer | AdminUser)[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>('/admin/users', { params: { page, limit, search, role } });
    return {
      items: res.users || [],
      total: res.total || 0,
      page: res.page || page,
      limit: res.limit || limit,
      totalPages: res.totalPages || 1,
    };
  },

  async getUser(id: string) {
    const res = await http.get<{ success: boolean; user: CustomerDetail | AdminUser }>(
      `/admin/users/${id}`
    );
    return res.user;
  },

  async setUserStatus(id: string, status: string) {
    const res = await http.put<{ success: boolean; user: any }>(
      `/admin/users/${id}/status`,
      { status }
    );
    return res.user;
  },

  async setUserRole(id: string, role: string) {
    const res = await http.put<{ success: boolean; user: any }>(
      `/admin/users/${id}/role`,
      { role }
    );
    return res.user;
  },
};

// ── Commerce Service Admin APIs ──

export const commerceAdmin = {
  async listShops(page = 1, limit = 10, search = '') {
    const res = await http.get<{ success: boolean; shops: any[] }>(
      '/shop/admin/shops',
      { params: { page, limit, search } }
    );
    // Map MongoDB _id to id
    return (res.shops || []).map(shop => ({
      ...shop,
      id: shop._id || shop.id,
    }));
  },

  async listPendingShops(page = 1, limit = 10) {
    const res = await http.get<{ success: boolean; shops: any[] }>(
      '/shop/admin/shops/pending',
      { params: { page, limit } }
    );
    return (res.shops || []).map(shop => ({
      ...shop,
      id: shop._id || shop.id,
    }));
  },

  async getShop(id: string) {
    const res = await http.get<{ success: boolean; shop: any }>(
      `/shop/admin/shops/${id}`
    );
    return {
      ...res.shop,
      id: res.shop._id || res.shop.id,
    };
  },

  async approveShop(id: string) {
    const res = await http.post<{ success: boolean; shop: any }>(
      `/shop/admin/shops/${id}/approve`,
      {}
    );
    return {
      ...res.shop,
      id: res.shop._id || res.shop.id,
    };
  },

  async rejectShop(id: string, reason = '') {
    const res = await http.post<{ success: boolean; shop: any }>(
      `/shop/admin/shops/${id}/reject`,
      { reason }
    );
    return {
      ...res.shop,
      id: res.shop._id || res.shop.id,
    };
  },

  async listCategories() {
    const res = await http.get<{ success: boolean; categories: Category[] }>(
      '/category'
    );
    return res.categories || [];
  },

  async listSectors() {
    const res = await http.get<{ success: boolean; sectors: Sector[] }>(
      '/sector'
    );
    return res.sectors || [];
  },

  async listOrders(options: { page?: number; limit?: number; status?: string; startDate?: string; endDate?: string }) {
    const { page = 1, limit = 10, status, startDate, endDate } = options;
    const res = await http.get<{
      success: boolean;
      orders?: Order[];
      total?: number;
      page?: number;
      limit?: number;
    }>('/order/admin', {
      params: {
        page,
        limit,
        ...(status && { status }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      },
    });
    return {
      items: res.orders || [],
      total: res.total || 0,
      page: res.page || page,
      limit: res.limit || limit,
      totalPages: Math.ceil((res.total || 0) / limit),
    };
  },

  async getOrder(id: string) {
    const res = await http.get<{ success: boolean; order: OrderDetail }>(
      `/order/admin/${id}`
    );
    return res.order;
  },

  async listPendingReviews(page = 1, limit = 10) {
    const res = await http.get<{ success: boolean; reviews?: Review[] }>(
      '/order/admin/reviews/pending',
      { params: { page, limit } }
    );
    return res.reviews || [];
  },

  async approveReview(id: string) {
    const res = await http.post<{ success: boolean; review: Review }>(
      `/order/admin/reviews/${id}/approve`,
      {}
    );
    return res.review;
  },

  async rejectReview(id: string, reason = '') {
    const res = await http.post<{ success: boolean; review: Review }>(
      `/order/admin/reviews/${id}/reject`,
      { reason }
    );
    return res.review;
  },

  async listSellerApplications(page = 1, limit = 10, status = '', search = '') {
    const res = await http.get<{
      success: boolean;
      applications: any[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>('/seller-application', { params: { page, limit, status, search } });
    return {
      items: res.applications || [],
      total: res.total || 0,
      page: res.page || page,
      limit: res.limit || limit,
      totalPages: res.totalPages || 1,
    };
  },

  async getSellerApplication(id: string) {
    const res = await http.get<{ success: boolean; application: any }>(
      `/seller-application/${id}`
    );
    return res.application;
  },

  async approveSellerApplication(id: string) {
    const res = await http.post<{ success: boolean; application: any; shop: any }>(
      `/seller-application/${id}/approve`,
      {}
    );
    return res;
  },

  async rejectSellerApplication(id: string, reason: string) {
    const res = await http.post<{ success: boolean; application: any }>(
      `/seller-application/${id}/reject`,
      { reason }
    );
    return res;
  },

  async suspendSellerApplication(id: string, suspended: boolean) {
    const res = await http.post<{ success: boolean; application: any }>(
      `/seller-application/${id}/suspend`,
      { suspended }
    );
    return res;
  },
};

// ── Analytics APIs ──

export const analyticsAdmin = {
  async getStats() {
    const res = await http.get<{ success: boolean; stats: DashboardStats }>(
      '/analytics/stats'
    );
    return res.stats;
  },

  async getGrowth() {
    const res = await http.get<{ success: boolean; growth: UsersGrowthSeries }>(
      '/analytics/growth'
    );
    return res.growth;
  },

  async getOrdersByType() {
    const res = await http.get<{ success: boolean; slices?: DistributionSlice[] }>(
      '/analytics/orders-by-type'
    );
    return res.slices || [];
  },

  async getSalesByType() {
    const res = await http.get<{ success: boolean; sales: SalesByType }>(
      '/analytics/sales-by-type'
    );
    return res.sales;
  },

  async getDashboardUsers() {
    const res = await http.get<{
      success: boolean;
      counts: { users: number; sellers: number; stores: number; riders: number };
    }>('/analytics/dashboard-users');
    return res.counts;
  },

  async getPendingApprovals() {
    const res = await http.get<{
      success: boolean;
      data: { pendingStores: number; pendingRiders: number; pendingSellers: number; total: number };
    }>('/analytics/pending-approvals');
    return res.data || { pendingStores: 0, pendingRiders: 0, pendingSellers: 0, total: 0 };
  },

  async getRecentActivity() {
    const res = await http.get<{
      success: boolean;
      data: { recentOrders: any[] };
    }>('/analytics/recent-activity');
    return res.data || { recentOrders: [] };
  },
};

// ── Delivery Service Admin APIs ──

export const deliveryAdmin = {
  async listRiders(page = 1, limit = 10, search = '') {
    const res = await http.get<{ success: boolean; actors?: any[] }>(
      '/delivery/actor',
      { params: { page, limit, search } }
    );
    return (res.actors || []).map(actor => ({
      ...actor,
      id: actor._id || actor.id,
    }));
  },

  async getRider(id: string) {
    const res = await http.get<{ success: boolean; actor: any }>(
      `/delivery/actor/${id}`
    );
    return {
      ...res.actor,
      id: res.actor._id || res.actor.id,
    };
  },

  async approveRider(id: string) {
    const res = await http.post<{ success: boolean; actor: any }>(
      `/delivery/actor/${id}/approve`,
      {}
    );
    return {
      ...res.actor,
      id: res.actor._id || res.actor.id,
    };
  },

  async updateRiderStatus(id: string, status: string) {
    const res = await http.put<{ success: boolean; actor: any }>(
      `/delivery/actor/${id}/status`,
      { status }
    );
    return {
      ...res.actor,
      id: res.actor._id || res.actor.id,
    };
  },

  async listRidersWithFilters(page = 1, limit = 10, search = '', status = '') {
    const params: Record<string, string | number> = { page, limit };
    if (search) params.search = search;
    if (status) params.status = status;
    
    const res = await http.get<{ success: boolean; actors?: any[]; count?: number }>(
      '/delivery/actor',
      { params }
    );
    return {
      items: (res.actors || []).map(actor => ({
        ...actor,
        id: actor._id || actor.id,
      })),
      total: res.count || (res.actors || []).length,
      page,
      limit,
    };
  },

  async getDeliveryStats() {
    const res = await http.get<{ success: boolean; dashboard?: any }>(
      '/delivery/operation/dashboard'
    );
    return res.dashboard || {};
  },

  async getDeliveryOverviewStats() {
    const res = await http.get<{ success: boolean; stats?: any }>(
      '/delivery/operation/stats'
    );
    return res.stats || {};
  },

  async listDeliveries(page = 1, limit = 10, status = '', search = '') {
    const params: Record<string, string | number> = { page, limit };
    if (status) params.status = status;
    if (search) params.search = search;
    
    const res = await http.get<{ success: boolean; deliveries?: any[]; count?: number }>(
      '/delivery/delivery',
      { params }
    );
    return {
      items: (res.deliveries || []).map(delivery => ({
        ...delivery,
        id: delivery._id || delivery.id,
      })),
      total: res.count || (res.deliveries || []).length,
      page,
      limit,
    };
  },

  async listZones(page = 1, limit = 10, status = '', search = '') {
    const params: Record<string, string | number> = { page, limit };
    if (status) params.status = status;
    if (search) params.search = search;
    
    const res = await http.get<{ success: boolean; zones?: any[]; count?: number }>(
      '/delivery/zone',
      { params }
    );
    return {
      items: (res.zones || []).map(zone => ({
        ...zone,
        id: zone._id || zone.id,
      })),
      total: res.count || (res.zones || []).length,
      page,
      limit,
    };
  },

  async getZone(id: string) {
    const res = await http.get<{ success: boolean; zone: any }>(
      `/delivery/zone/${id}`
    );
    return {
      ...res.zone,
      id: res.zone._id || res.zone.id,
    };
  },

  async updateZone(id: string, data: any) {
    const res = await http.put<{ success: boolean; zone: any }>(
      `/delivery/zone/${id}`,
      data
    );
    return {
      ...res.zone,
      id: res.zone._id || res.zone.id,
    };
  },

  async activateZone(id: string) {
    const res = await http.put<{ success: boolean; zone: any }>(
      `/delivery/zone/${id}/activate`
    );
    return {
      ...res.zone,
      id: res.zone._id || res.zone.id,
    };
  },

  async deactivateZone(id: string) {
    const res = await http.put<{ success: boolean; zone: any }>(
      `/delivery/zone/${id}/deactivate`
    );
    return {
      ...res.zone,
      id: res.zone._id || res.zone.id,
    };
  },

  async assignDelivery(deliveryId: string, actorId: string) {
    const res = await http.put<{ success: boolean; delivery: any }>(
      `/delivery/delivery/${deliveryId}/assign`,
      { actorId }
    );
    return {
      ...res.delivery,
      id: res.delivery._id || res.delivery.id,
    };
  },

  async updateDeliveryStatus(deliveryId: string, status: string, note?: string) {
    const res = await http.put<{ success: boolean; delivery: any }>(
      `/delivery/delivery/${deliveryId}/status`,
      { status, note }
    );
    return {
      ...res.delivery,
      id: res.delivery._id || res.delivery.id,
    };
  },
};

// ── Disputes Admin APIs ──

export const disputesAdmin = {
  async listDisputes(page = 1, limit = 10, status = '', priority = '', type = '') {
    const params: Record<string, string | number> = { page, limit };
    if (status) params.status = status;
    if (priority) params.priority = priority;
    if (type) params.type = type;

    const res = await http.get<{ success: boolean; disputes?: any[]; total?: number }>(
      '/disputes',
      { params }
    );
    return {
      items: (res.disputes || []).map(dispute => ({
        ...dispute,
        id: dispute._id || dispute.id,
      })),
      total: res.total || (res.disputes || []).length,
      page,
      limit,
    };
  },

  async getDispute(id: string) {
    const res = await http.get<{ success: boolean; dispute: any }>(
      `/disputes/${id}`
    );
    return {
      ...res.dispute,
      id: res.dispute._id || res.dispute.id,
    };
  },

  async updateDisputeStatus(id: string, status: string) {
    const res = await http.patch<{ success: boolean; dispute: any }>(
      `/disputes/${id}/status`,
      { status }
    );
    return {
      ...res.dispute,
      id: res.dispute._id || res.dispute.id,
    };
  },

  async updateDisputePriority(id: string, priority: string) {
    const res = await http.patch<{ success: boolean; dispute: any }>(
      `/disputes/${id}/priority`,
      { priority }
    );
    return {
      ...res.dispute,
      id: res.dispute._id || res.dispute.id,
    };
  },

  async addNote(id: string, note: string) {
    const res = await http.post<{ success: boolean; dispute: any }>(
      `/disputes/${id}/notes`,
      { note }
    );
    return {
      ...res.dispute,
      id: res.dispute._id || res.dispute.id,
    };
  },

  async addEvidence(id: string, evidence: any) {
    const res = await http.post<{ success: boolean; dispute: any }>(
      `/disputes/${id}/evidence`,
      evidence
    );
    return {
      ...res.dispute,
      id: res.dispute._id || res.dispute.id,
    };
  },

  async resolveDispute(id: string, resolution: string, resolutionType: string, compensationAmount?: number) {
    const res = await http.post<{ success: boolean; dispute: any }>(
      `/disputes/${id}/resolve`,
      { resolution, resolutionType, compensationAmount: compensationAmount || 0 }
    );
    return {
      ...res.dispute,
      id: res.dispute._id || res.dispute.id,
    };
  },

  async rejectDispute(id: string, reason: string) {
    const res = await http.post<{ success: boolean; dispute: any }>(
      `/disputes/${id}/reject`,
      { reason }
    );
    return {
      ...res.dispute,
      id: res.dispute._id || res.dispute.id,
    };
  },

  async closeDispute(id: string) {
    const res = await http.post<{ success: boolean; dispute: any }>(
      `/disputes/${id}/close`,
      {}
    );
    return {
      ...res.dispute,
      id: res.dispute._id || res.dispute.id,
    };
  },

  async getStats() {
    const res = await http.get<{ success: boolean; stats?: any }>(
      '/disputes/admin/stats'
    );
    return res.stats || {};
  },

  async getRecentDisputes(limit = 10) {
    const res = await http.get<{ success: boolean; disputes?: any[] }>(
      `/disputes/admin/recent?limit=${limit}`
    );
    return (res.disputes || []).map(dispute => ({
      ...dispute,
      id: dispute._id || dispute.id,
    }));
  },
};

// ── Extended Analytics APIs ──

export const reportsAdmin = {
  async getStats(startDate?: string, endDate?: string) {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const res = await http.get<{ success: boolean; stats: any }>('/analytics/stats', { params });
    return res.stats;
  },

  async getGrowth(startDate?: string, endDate?: string) {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const res = await http.get<{ success: boolean; growth: any }>('/analytics/growth', { params });
    return res.growth;
  },

  async getSalesOverTime(startDate?: string, endDate?: string) {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const res = await http.get<{ success: boolean; data: any[] }>('/analytics/sales-over-time', { params });
    return res.data || [];
  },

  async getOrdersByStatus(startDate?: string, endDate?: string) {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const res = await http.get<{ success: boolean; data: any[] }>('/analytics/orders-by-status', { params });
    return res.data || [];
  },

  async getCategoryActivity(startDate?: string, endDate?: string) {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const res = await http.get<{ success: boolean; data: any[] }>('/analytics/category-activity', { params });
    return res.data || [];
  },

  async getProductStats(startDate?: string, endDate?: string) {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const res = await http.get<{ success: boolean; data: any }>('/analytics/product-stats', { params });
    return res.data;
  },

  async getDisputeStats(startDate?: string, endDate?: string) {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const res = await http.get<{ success: boolean; data: any }>('/analytics/dispute-stats', { params });
    return res.data;
  },

  async getDeliveryStats(startDate?: string, endDate?: string) {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const res = await http.get<{ success: boolean; data: any }>('/analytics/delivery-stats', { params });
    return res.data;
  },

  async getRiderPerformance(startDate?: string, endDate?: string) {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const res = await http.get<{ success: boolean; data: any[] }>('/analytics/rider-performance', { params });
    return res.data || [];
  },

  async getShopStats(startDate?: string, endDate?: string) {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const res = await http.get<{ success: boolean; data: any }>('/analytics/shop-stats', { params });
    return res.data;
  },

  async getOrdersByType(startDate?: string, endDate?: string) {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const res = await http.get<{ success: boolean; slices: any[] }>('/analytics/orders-by-type', { params });
    return res.slices || [];
  },

  async getSalesByType(startDate?: string, endDate?: string) {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const res = await http.get<{ success: boolean; sales: any }>('/analytics/sales-by-type', { params });
    return res.sales;
  },
};

// ── Audit Logs APIs ──

export const auditAdmin = {
  async listLogs(params: {
    page?: number;
    limit?: number;
    adminId?: string;
    action?: string;
    module?: string;
    targetEntity?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  } = {}) {
    const queryParams: Record<string, string | number> = {};
    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;
    if (params.adminId) queryParams.adminId = params.adminId;
    if (params.action) queryParams.action = params.action;
    if (params.module) queryParams.module = params.module;
    if (params.targetEntity) queryParams.targetEntity = params.targetEntity;
    if (params.search) queryParams.search = params.search;
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;

    const res = await http.get<{
      success: boolean;
      logs: any[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>('/admin/audit-logs', { params: queryParams });
    return {
      logs: res.logs || [],
      total: res.total || 0,
      page: res.page || params.page || 1,
      limit: res.limit || params.limit || 20,
      totalPages: res.totalPages || 1,
    };
  },

  async getLog(id: string) {
    const res = await http.get<{ success: boolean; log: any }>(`/admin/audit-logs/${id}`);
    return res.log;
  },

  async getFilters() {
    const res = await http.get<{
      success: boolean;
      admins: { admin_id: string; admin_name: string }[];
      actions: string[];
      modules: string[];
    }>('/admin/audit-logs/filters');
    return {
      admins: res.admins || [],
      actions: res.actions || [],
      modules: res.modules || [],
    };
  },

  async getStats() {
    const res = await http.get<{
      success: boolean;
      stats: {
        total: number;
        today: number;
        criticalLast7Days: number;
        byModule: { module: string; count: number }[];
      };
    }>('/admin/audit-logs/stats');
    return res.stats;
  },
};

// ── Admin Roles & Permissions APIs ──

export const adminRolesApi = {
  async listPermissions() {
    const res = await http.get<{ success: boolean; permissions: any[] }>('/admin/permissions');
    return res.permissions || [];
  },

  async listPermissionsByModule() {
    const res = await http.get<{ success: boolean; permissions: Record<string, any[]> }>('/admin/permissions/by-module');
    return res.permissions || {};
  },

  async listRoles() {
    const res = await http.get<{ success: boolean; roles: any[] }>('/admin/roles');
    return res.roles || [];
  },

  async getRole(id: string) {
    const res = await http.get<{ success: boolean; role: any }>(`/admin/roles/${id}`);
    return res.role;
  },

  async createRole(data: { name: string; displayName: string; description?: string; permissions?: string[] }) {
    const res = await http.post<{ success: boolean; role: any }>('/admin/roles', data);
    return res.role;
  },

  async updateRole(id: string, data: { displayName?: string; description?: string; permissions?: string[] }) {
    const res = await http.put<{ success: boolean; role: any }>(`/admin/roles/${id}`, data);
    return res.role;
  },

  async deleteRole(id: string) {
    await http.delete<{ success: boolean }>(`/admin/roles/${id}`);
    return true;
  },

  async getAllUserRoles() {
    const res = await http.get<{ success: boolean; assignments: any[] }>('/admin/user-roles');
    return res.assignments || [];
  },

  async getUserRoles(userId: string) {
    const res = await http.get<{ success: boolean; user: any; roles: any[]; permissions: string[] }>(`/admin/users/${userId}/roles`);
    return res;
  },

  async getUserPermissions(userId: string) {
    const res = await http.get<{ success: boolean; permissions: string[] }>(`/admin/users/${userId}/permissions`);
    return res.permissions || [];
  },

  async assignRole(userId: string, roleId: string) {
    await http.post<{ success: boolean }>(`/admin/users/${userId}/roles/${roleId}`);
    return true;
  },

  async removeRole(userId: string, roleId: string) {
    await http.delete<{ success: boolean }>(`/admin/users/${userId}/roles/${roleId}`);
    return true;
  },
};

// ── Platform Admin Control APIs ──

export const adminApi = {
  // Platform Statistics & Overview (Commerce-owned; gateway routes → commerce)
  async getPlatformStats() {
    const res = await http.get<{ success: boolean; stats: any }>('/admin/platform/stats');
    return res.stats || {};
  },

  async getPendingActions() {
    const res = await http.get<{ success: boolean; pending: any }>('/admin/platform/pending');
    return res.pending || {};
  },

  // Hierarchical Platform Navigation — canonical Commerce path.
  // (/admin/hierarchy never existed; the implementation is /admin/platform/hierarchy.)
  async getPlatformHierarchy(filters?: Record<string, unknown>) {
    const res = await http.get<{ success: boolean; hierarchy: any }>('/admin/platform/hierarchy', {
      params: filters as any,
    });
    return res.hierarchy || {};
  },

  async getLocationHierarchy() {
    // Delivery owns the raw geographic tree.
    const res = await http.get<{ success: boolean; hierarchy: any }>('/delivery/location/hierarchy');
    return res.hierarchy || [];
  },

  // Business Management
  async getBusinesses(filters?: Record<string, unknown>) {
    const res = await http.get<{ success: boolean; businesses: any[]; total?: number }>('/admin/businesses', {
      params: filters as any,
    });
    return res.businesses || [];
  },

  async getBusinessesPaged(filters?: Record<string, unknown>) {
    const res = await http.get<{
      success: boolean; businesses: any[]; total?: number;
      page?: number; limit?: number; totalPages?: number;
    }>('/admin/businesses', { params: filters as any });
    return {
      items: res.businesses || [],
      total: res.total || 0,
      page: res.page || 1,
      limit: res.limit || 50,
      totalPages: res.totalPages || 0,
    };
  },

  async getBusinessDetail(businessId: string) {
    const res = await http.get<{ success: boolean; business: any; shops: any[]; shopCount: number }>(
      `/admin/businesses/${businessId}`
    );
    return { business: res.business || {}, shops: res.shops || [], shopCount: res.shopCount || 0 };
  },

  async approveBusiness(applicationId: string, notes?: string) {
    const res = await http.post<{ success: boolean; business: any }>(
      `/admin/businesses/${applicationId}/approve`,
      { notes }
    );
    return res.business || {};
  },

  async rejectBusiness(applicationId: string, reason: string) {
    const res = await http.post<{ success: boolean; business: any }>(
      `/admin/businesses/${applicationId}/reject`,
      { reason }
    );
    return res.business || {};
  },

  // Shop Management
  async getShops(filters?: Record<string, unknown>) {
    const res = await http.get<{ success: boolean; shops: any[] }>('/admin/shops', {
      params: filters as any,
    });
    return res.shops || [];
  },

  async getShopsPaged(filters?: Record<string, unknown>) {
    const res = await http.get<{
      success: boolean; shops: any[]; total?: number; page?: number;
      limit?: number; totalPages?: number; statusCounts?: any;
    }>('/admin/shops', { params: filters as any });
    return {
      items: res.shops || [],
      total: res.total || 0,
      page: res.page || 1,
      limit: res.limit || 50,
      totalPages: res.totalPages || 0,
      statusCounts: res.statusCounts || {},
    };
  },

  // Orders & Delivery
  async getOrdersWithFilters(filters?: Record<string, unknown>) {
    const res = await http.get<{ success: boolean; orders: any[] }>('/admin/orders', {
      params: filters as any,
    });
    return res.orders || [];
  },

  async getOrdersPaged(filters?: Record<string, unknown>) {
    const res = await http.get<{
      success: boolean; orders: any[]; total?: number; page?: number;
      limit?: number; totalPages?: number; stageCounts?: Record<string, number>; stageDefinitions?: any[];
    }>('/admin/orders', { params: filters as any });
    return {
      items: res.orders || [],
      total: res.total || 0,
      page: res.page || 1,
      limit: res.limit || 50,
      totalPages: res.totalPages || 0,
      stageCounts: res.stageCounts || {},
      stageDefinitions: res.stageDefinitions || [],
    };
  },

  async getOrderPickupDeliveryLifecycle(orderId: string) {
    const res = await http.get<{ success: boolean; lifecycle: any }>(
      `/admin/orders/${orderId}/pickup-delivery`
    );
    return res.lifecycle || {};
  },

  // Live operations — orders grouped by real, mapped operational stage.
  async getOperations() {
    const res = await http.get<{ success: boolean; operations: any }>('/admin/operations');
    return res.operations || {};
  },

  async getOperationsByStage(stage: string, filters?: Record<string, unknown>) {
    const res = await http.get<{ success: boolean; operations: any }>(`/admin/operations/${stage}`, {
      params: filters as any,
    });
    return res.operations || {};
  },

  // Growth Analytics — explicit window + comparison period, null-safe deltas.
  async getGrowthAnalytics(filters?: Record<string, unknown>) {
    const res = await http.get<{ success: boolean; analytics: any }>('/admin/growth-analytics', {
      params: filters as any,
    });
    return res.analytics || {};
  },

  // Location × sector availability (Delivery owns the configuration).
  async getLocationSectorAvailability(locationId: string) {
    const res = await http.get<{ success: boolean; sectors: any[]; summary: any; location: any }>(
      `/delivery/sector-availability/location/${locationId}`
    );
    return { sectors: res.sectors || [], summary: res.summary || {}, location: res.location || {} };
  },

  async setLocationSectorAvailability(
    locationId: string,
    sectorId: string,
    payload: {
      isActive?: boolean;
      deliveryAvailable?: boolean;
      pickupAvailable?: boolean;
      sectorName?: string;
      notes?: string;
    }
  ) {
    const res = await http.put<{ success: boolean; availability: any }>(
      `/delivery/sector-availability/location/${locationId}/${sectorId}`,
      payload
    );
    return res.availability || {};
  },

  async removeLocationSectorAvailability(locationId: string, sectorId: string) {
    const res = await http.delete<{ success: boolean; removed: any }>(
      `/delivery/sector-availability/location/${locationId}/${sectorId}`
    );
    return res.removed || {};
  },

  // Location Management — Delivery owns locations; status changes go through
  // its activate/deactivate endpoints (the /admin/locations path never existed).
  async updateLocationStatus(locationId: string, active: boolean) {
    const res = active
      ? await http.put<{ success: boolean; location: any }>(
          `/delivery/location/${locationId}/activate`,
          {}
        )
      : await http.put<{ success: boolean; location: any }>(
          `/delivery/location/${locationId}/deactivate`,
          {}
        );
    return res.location || {};
  },

  // User Management — Identity owns account status
  // (PUT /admin/users/:id/status accepts active|inactive|suspended|banned).
  async listAdminUsers(filters?: any) {
    const res = await http.get<{ success: boolean; users: any[]; total?: number }>('/admin/users', {
      params: filters,
    });
    return res.users || [];
  },

  async suspendUser(userId: string) {
    const res = await http.put<{ success: boolean; user: any }>(
      `/admin/users/${userId}/status`,
      { status: 'suspended' }
    );
    return res.user || {};
  },

  async reactivateUser(userId: string) {
    const res = await http.put<{ success: boolean; user: any }>(
      `/admin/users/${userId}/status`,
      { status: 'active' }
    );
    return res.user || {};
  },

  async banUser(userId: string) {
    const res = await http.put<{ success: boolean; user: any }>(
      `/admin/users/${userId}/status`,
      { status: 'banned' }
    );
    return res.user || {};
  },

  // Audit Logs
  async getAuditLogs(filters?: any) {
    const res = await http.get<{ success: boolean; data: any[] }>('/admin/audit-logs', {
      params: filters,
    });
    return res.data || [];
  },

  // Export Functions
  generateGrowthAnalyticsCsv(data: any): string {
    if (!data || !data.metrics) return '';
    const headers = ['Period', 'Businesses', 'Shops', 'Orders', 'Revenue'];
    const rows = (data.metrics || []).map((m: any) =>
      [m.period, m.businesses, m.shops, m.orders, m.revenue].join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  },

  generateAuditLogsCsv(logs: any[]): string {
    const headers = ['Timestamp', 'Admin', 'Action', 'Target Type', 'Target', 'Details'];
    const rows = logs.map(log =>
      [
        log.timestamp,
        log.adminEmail,
        log.actionType,
        log.targetType,
        log.targetName,
        log.details || '',
      ]
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  },
};
