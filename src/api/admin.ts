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
  OrderStatus,
  OrderTimelineEntry,
  PaymentStatus,
  Review,
  DashboardStats,
  UsersGrowthSeries,
  DistributionSlice,
  SalesByType,
} from '@/types';

function toReviewerName(user: { name?: string; email?: string } | string | null | undefined): string | undefined {
  if (!user) return undefined;
  if (typeof user === 'string') return user;
  return user.name || user.email || undefined;
}

/** Raw review shape returned by the Commerce review-moderation endpoints. */
interface ReviewDto {
  reviewId?: string;
  productId?: string;
  productName?: string | null;
  rating?: number;
  comment?: string;
  user?: { name?: string; email?: string } | string | null;
  status?: string;
  createdAt?: string | null;
}

/**
 * Maps the backend review DTO onto the flat UI `Review` model.
 *
 * `id` MUST be the review id: the page uses it as the row key and passes it to
 * approve/reject, so mapping the product id here would moderate the wrong record.
 */
function toUiReview(review: ReviewDto): Review {
  return {
    id: String(review.reviewId || ''),
    storeId: String(review.productId || ''),
    storeName: review.productName || '—',
    rating: Number(review.rating) || 0,
    description: review.comment,
    status: String(review.status || 'pending').toUpperCase() as Review['status'],
    createdAt: review.createdAt || '',
    isPublished: String(review.status).toLowerCase() === 'approved',
    productId: review.productId,
    reviewerName: toReviewerName(review.user),
  };
}

// ── Order DTO mapping (Commerce -> console contract) ─────────────────────────

/**
 * Raw row returned by the Commerce `/admin/orders` endpoint
 * (see adminPlatform.service.getOrders).
 */
interface AdminOrderRow {
  id: string;
  customerId?: string | null;
  customerRef?: string | null;
  sellerId?: string | null;
  totalPrice?: number;
  items?: number;
  status?: string;
  paymentStatus?: string;
  stage?: string;
  stageLabel?: string;
  stageReason?: string;
  deliveryStatus?: string | null;
  shippingAddress?: unknown;
  createdAt?: string;
  updatedAt?: string;
}

/** Raw payload returned by `/admin/orders/:orderId/pickup-delivery`. */
interface OrderLifecycleDto {
  order?: {
    id: string;
    status?: string;
    paymentStatus?: string;
    totalPrice?: number;
    items?: unknown[];
    customerId?: string | null;
    sellerId?: string | null;
    createdAt?: string;
    updatedAt?: string;
  };
  stage?: string;
  stageLabel?: string;
  stageReason?: string;
  pickup?: OrderDetail['pickup'];
  dropOff?: OrderDetail['dropOff'];
  timeline?: OrderTimelineEntry[];
  deliveryUnavailable?: boolean;
}

/** Renders a shipping/pickup address object as a single display line. */
function addressToString(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  const parts = ['address', 'label', 'street', 'zone', 'city', 'region', 'country']
    .map((key) => record[key])
    .filter((part): part is string => typeof part === 'string' && part.length > 0);
  return parts.length ? parts.join(', ') : undefined;
}

/** Maps one order line onto the console's item shape. */
function toUiOrderItem(item: unknown) {
  const record = (item || {}) as Record<string, unknown>;
  const title = [record.title, record.name, record.productName].find(
    (value): value is string => typeof value === 'string' && value.length > 0
  );
  return {
    id: typeof record.productId === 'string' ? record.productId : undefined,
    title,
    quantity: Number(record.quantity ?? record.qty ?? 1) || 1,
    price: Number(record.price ?? record.unitPrice ?? 0) || 0,
  };
}

/**
 * Maps a Commerce order row onto the console's Order contract.
 *
 * The console reads `orderStatus` and `orderAmount`; the backend owns `status`
 * and `totalPrice`. Nothing is invented — every value comes from the order
 * document. The previous console vocabulary (PENDING/ACCEPTED/PICKED/ARRIVED)
 * was matched against values no service writes, which is why the list rendered
 * empty cells and status filters returned nothing.
 */
function toUiOrder(row: AdminOrderRow): Order {
  const id = String(row.id);
  return {
    id,
    orderId: id,
    orderAmount: Number(row.totalPrice) || 0,
    payer: row.customerRef || (row.customerId ? `#${String(row.customerId).slice(-6)}` : '—'),
    orderType: 'DELIVERY',
    orderStatus: (row.status as OrderStatus) || 'Processing',
    paymentStatus: row.paymentStatus as PaymentStatus | undefined,
    deliveryAddress: addressToString(row.shippingAddress),
    createdAt: row.createdAt || '',
    updatedAt: row.updatedAt,
    stage: row.stage,
    stageLabel: row.stageLabel,
    deliveryStatus: row.deliveryStatus ?? null,
  };
}

// ── Identity Service Admin APIs ───

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
  /** Paged admin shop list lives on `adminApi.getShopsPaged` (/admin/shops). */
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

  async suspendShop(id: string, reason = '') {
    const res = await http.post<{ success: boolean; shop: any }>(
      `/shop/admin/shops/${id}/suspend`,
      { reason }
    );
    return {
      ...res.shop,
      id: res.shop._id || res.shop.id,
    };
  },

  async activateShop(id: string) {
    const res = await http.post<{ success: boolean; shop: any }>(
      `/shop/admin/shops/${id}/activate`,
      {}
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
    return (res.categories || []).map(c => ({ ...c, id: c._id || c.id }));
  },

  async listSectors() {
    const res = await http.get<{ success: boolean; sectors: Sector[] }>(
      '/sector'
    );
    return (res.sectors || []).map(s => ({ ...s, id: s._id || s.id }));
  },

  async listOrders(options: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { page = 1, limit = 10, status, startDate, endDate } = options;
    const res = await http.get<{
      success: boolean;
      orders?: AdminOrderRow[];
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
    }>('/admin/orders', {
      params: {
        page,
        limit,
        ...(status && { status }),
        // The backend filters the created-at range as from/to.
        ...(startDate && { from: startDate }),
        ...(endDate && { to: endDate }),
      },
    });
    return {
      items: (res.orders || []).map(toUiOrder),
      total: res.total || 0,
      page: res.page || page,
      limit: res.limit || limit,
      totalPages: res.totalPages ?? Math.ceil((res.total || 0) / limit),
    };
  },

  async getOrder(id: string) {
    // The lifecycle endpoint returns the Commerce order together with the
    // Delivery record, the backend-recorded timeline and the operational stage —
    // the detail page needs all of it.
    const res = await http.get<{ success: boolean; lifecycle: OrderLifecycleDto }>(
      `/admin/orders/${id}/pickup-delivery`
    );
    const lifecycle = res.lifecycle || {};
    const order: NonNullable<OrderLifecycleDto['order']> = lifecycle.order ?? { id };
    return {
      ...toUiOrder({
        id: String(order.id ?? id),
        customerId: order.customerId,
        sellerId: order.sellerId,
        totalPrice: order.totalPrice,
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      }),
      orderType: 'DELIVERY',
      stage: lifecycle.stage,
      stageLabel: lifecycle.stageLabel,
      stageReason: lifecycle.stageReason,
      timeline: lifecycle.timeline || [],
      pickup: lifecycle.pickup,
      dropOff: lifecycle.dropOff,
      deliveryUnavailable: lifecycle.deliveryUnavailable,
      deliveryAddress:
        toUiOrder({
          id: String(order.id ?? id),
          shippingAddress: lifecycle.dropOff?.address,
        }).deliveryAddress || undefined,
      customer: order.customerId ? { id: order.customerId } : undefined,
      store: order.sellerId ? { id: order.sellerId } : undefined,
      rider: lifecycle.pickup?.actorId ? { id: lifecycle.pickup.actorId } : undefined,
      items: Array.isArray(order.items) ? order.items.map(toUiOrderItem) : undefined,
    } satisfies OrderDetail;
  },

  async listPendingReviews(page = 1, limit = 10) {
    // The backend pages over the reviews EMBEDDED in product documents and
    // answers with the shared review DTO (see products.service.toReviewDto).
    const res = await http.get<{ success: boolean; reviews?: ReviewDto[] }>(
      '/order/admin/reviews/pending',
      { params: { page, limit } }
    );
    // Drop rows without a review id: the page keys rows by it and passes it to
    // approve/reject, so a row without one would target `/…/undefined/approve`.
    return (res.reviews || [])
      .filter((review) => Boolean(review.reviewId))
      .map(toUiReview);
  },

  async approveReview(id: string) {
    const res = await http.post<{ success: boolean; review?: ReviewDto }>(
      `/order/admin/reviews/${id}/approve`,
      {}
    );
    return res.review ? toUiReview(res.review) : null;
  },

  async rejectReview(id: string, reason = '') {
    const res = await http.post<{ success: boolean; review?: ReviewDto }>(
      `/order/admin/reviews/${id}/reject`,
      { reason }
    );
    return res.review ? toUiReview(res.review) : null;
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
      items: (res.applications || []).map(app => ({ ...app, id: app._id || app.id })),
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
    return res.application ? { ...res.application, id: res.application._id || res.application.id } : null;
  },

  async approveSellerApplication(id: string) {
    const res = await http.post<{ success: boolean; application: any; shop: any }>(
      `/seller-application/${id}/approve`,
      {}
    );
    return {
      ...res.application,
      id: res.application?._id || res.application?.id,
      // The approve flow also creates the shop; expose it for downstream UI.
      shopId: res.shop?._id || res.shop?.id || res.application?.shopId,
    };
  },

  async rejectSellerApplication(id: string, reason: string) {
    const res = await http.post<{ success: boolean; application: any }>(
      `/seller-application/${id}/reject`,
      { reason }
    );
    return res.application ? { ...res.application, id: res.application._id || res.application.id } : null;
  },

  async requestSellerInformation(id: string, reason: string) {
    const res = await http.post<{ success: boolean; application: any }>(
      `/seller-application/${id}/request-information`,
      { reason }
    );
    return res.application ? { ...res.application, id: res.application._id || res.application.id } : null;
  },

  async suspendSellerApplication(id: string, suspended: boolean) {
    const res = await http.post<{ success: boolean; application: any }>(
      `/seller-application/${id}/suspend`,
      { suspended }
    );
    return res.application ? { ...res.application, id: res.application._id || res.application.id } : null;
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
      '/delivery/partner',
      { params: { page, limit, search } }
    );
    return (res.actors || []).map(actor => ({
      ...actor,
      id: actor._id || actor.id,
    }));
  },

  async getRider(id: string) {
    const res = await http.get<{ success: boolean; partner?: any; actor?: any }>(
      `/delivery/partner/${id}`
    );
    const actor = res.partner || res.actor || {};
    return {
      ...actor,
      id: actor._id || actor.id,
    };
  },

  async createRider(data: Record<string, unknown>) {
    const res = await http.post<{ success: boolean; partner?: any; actor?: any }>(
      '/delivery/partner', data
    );
    const actor = res.partner || res.actor || {};
    return { ...actor, id: actor._id || actor.id };
  },

  async updateRider(id: string, data: Record<string, unknown>) {
    const res = await http.put<{ success: boolean; partner?: any; actor?: any }>(
      `/delivery/partner/${id}`, data
    );
    const actor = res.partner || res.actor || {};
    return { ...actor, id: actor._id || actor.id };
  },

  async approveRider(id: string) {
    const res = await http.post<{ success: boolean; partner?: any }>(
      `/delivery/partner/${id}/approve`,
      {}
    );
    const partner = res.partner || {};
    return {
      ...partner,
      id: partner._id || partner.id,
    };
  },

  async updateRiderStatus(id: string, status: string) {
    const res = await http.put<{ success: boolean; partner?: any }>(
      `/delivery/partner/${id}/status`,
      { status }
    );
    const partner = res.partner || {};
    return {
      ...partner,
      id: partner._id || partner.id,
    };
  },

  async listRidersWithFilters(page = 1, limit = 10, search = '', status = '') {
    const params: Record<string, string | number> = { page, limit };
    if (search) params.search = search;
    if (status) params.status = status;
    
    const res = await http.get<{
      success: boolean;
      actors?: any[];
      /** Page size — NOT the total. */
      count?: number;
      /** Number of matching actors across all pages. */
      total?: number;
    }>('/delivery/partner', { params });
    return {
      items: (res.actors || []).map(actor => ({
        ...actor,
        id: actor._id || actor.id,
      })),
      total: res.total ?? res.count ?? (res.actors || []).length,
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

  async listDeliveries(page = 1, limit = 10, status = '', search = '', extra: Record<string, string> = {}) {
    const params: Record<string, string | number> = { page, limit };
    if (status) params.status = status;
    if (search) params.search = search;
    Object.assign(params, extra);

    const res = await http.get<{ success: boolean; deliveries?: any[]; count?: number; total?: number; totalPages?: number; page?: number; limit?: number }>(
      '/delivery/delivery',
      { params }
    );
    return {
      items: (res.deliveries || []).map(delivery => ({
        ...delivery,
        id: delivery._id || delivery.id,
      })),
      total: res.total ?? res.count ?? (res.deliveries || []).length,
      page,
      limit,
      totalPages: res.totalPages || Math.ceil((res.total ?? res.count ?? (res.deliveries || []).length) / Math.max(limit, 1)),
    };
  },

  async getDelivery(id: string) {
    const res = await http.get<{ success: boolean; delivery: any }>(
      `/delivery/delivery/${id}`
    );
    return { ...res.delivery, id: res.delivery._id || res.delivery.id };
  },

  async getDeliveryHistory(id: string) {
    return http.get<{ success: boolean; timeline?: any[]; trackingEvents?: any[]; assignmentHistory?: any[] }>(
      `/delivery/delivery/${id}/history`
    );
  },

  async listSectors(params: Record<string, unknown> = {}) {
    const res = await http.get<{ success: boolean; locations?: any[]; count?: number }>(
      '/delivery/location', { params: { type: 'sector', ...params } as never }
    );
    return (res.locations || []).map(l => ({ ...l, id: l._id || l.id }));
  },

  async listZonesRaw(params: Record<string, unknown> = {}) {
    const res = await http.get<{ success: boolean; zones?: any[]; count?: number }>(
      '/delivery/zone', { params: params as never }
    );
    return (res.zones || []).map(z => ({ ...z, id: z._id || z.id }));
  },

  async listZones(page = 1, limit = 10, status = '', search = '') {
    const params: Record<string, string | number> = { page, limit };
    if (status) params.status = status;
    if (search) params.search = search;
    
    const res = await http.get<{
      success: boolean;
      zones?: any[];
      /** Page size — NOT the total. */
      count?: number;
      /** Number of matching zones across all pages. */
      total?: number;
    }>('/delivery/zone', { params });
    return {
      items: (res.zones || []).map(zone => ({
        ...zone,
        id: zone._id || zone.id,
      })),
      total: res.total ?? res.count ?? (res.zones || []).length,
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
    const res = await http.put<{ success: boolean; assignment?: any }>(
      `/delivery/delivery/${deliveryId}/assign`,
      { actorId }
    );
    const assignment = res.assignment || {};
    return {
      ...assignment,
      id: assignment._id || assignment.id,
    };
  },

  async createAssignment(data: { deliveryId: string; partnerId: string; serviceId?: string; zoneId?: string; notes?: string }) {
    const res = await http.post<{ success: boolean; assignment: any }>(
      '/delivery/assignment', data
    );
    return { ...res.assignment, id: res.assignment._id || res.assignment.id };
  },

  async reassignDelivery(deliveryId: string, newPartnerId: string) {
    const res = await http.post<{ success: boolean; assignment: any }>(
      '/delivery/assignment/reassign', { deliveryId, partnerId: newPartnerId }
    );
    return { ...res.assignment, id: res.assignment._id || res.assignment.id };
  },

  async listAssignments(page = 1, limit = 10, status = '', partnerId = '') {
    const params: Record<string, string | number> = { page, limit };
    if (status) params.status = status;
    if (partnerId) params.partnerId = partnerId;
    const res = await http.get<{
      success: boolean; assignments?: any[]; count?: number; total?: number; page?: number; limit?: number; totalPages?: number;
    }>('/delivery/assignment', { params });
    return {
      items: (res.assignments || []).map(a => ({ ...a, id: a._id || a.id })),
      total: res.total ?? res.count ?? (res.assignments || []).length,
      page: res.page || page,
      limit: res.limit || limit,
      totalPages: res.totalPages ?? Math.ceil((res.total ?? res.count ?? 0) / Math.max(limit, 1)),
    };
  },

  async getAssignment(id: string) {
    const res = await http.get<{ success: boolean; assignment: any }>(
      `/delivery/assignment/${id}`
    );
    return { ...res.assignment, id: res.assignment._id || res.assignment.id };
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

// ── Request Management (buyer → seller negotiation, commerce `/request`) ──

/** Offer stored on a request (seller's latest price wins, older ones are superseded). */
export interface AdminRequestOffer {
  productId?: string | null;
  productName?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  totalPrice: number;
  note?: string;
  status: 'ACTIVE' | 'ACCEPTED' | 'DECLINED' | 'SUPERSEDED';
  createdByRole?: string | null;
  previous?: {
    quantity?: number;
    unit?: string;
    unitPrice?: number;
    totalPrice?: number;
    productName?: string;
  } | null;
  createdAt?: string;
}

/** Agreement confirmation state — an order needs BOTH confirmations. */
export interface AdminRequestAgreement {
  buyerConfirmedAt?: string | null;
  sellerConfirmedAt?: string | null;
  confirmedAt?: string | null;
  note?: string;
  terms?: {
    productName?: string;
    quantity?: number;
    unit?: string;
    unitPrice: number;
    totalPrice: number;
  } | null;
}

/** A report filed against a request (open until an admin reviews it). */
export interface AdminRequestReport {
  id: string;
  category: string;
  reason: string;
  message?: string;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  reportedBy?: string;
  createdAt: string;
  reviewedAt?: string | null;
  resolution?: string;
}

/** One entry of the server-side activity log (`request.activity`). */
export interface AdminRequestActivity {
  id: string;
  type: string;
  summary: string;
  actorRole?: string | null;
  data?: Record<string, unknown> | null;
  createdAt: string;
}

/** Row returned by `GET /request/admin`. */
export interface AdminRequestRow {
  id: string;
  title: string;
  details: string;
  status: string;
  quantity: number;
  unit?: string;
  productName?: string;
  targetPrice: number | null;
  buyer: { id?: string; name?: string | null; email?: string | null } | null;
  sellerName?: string;
  customerId: string;
  sellerId: string | null;
  shopId: string | null;
  productId: string | null;
  orderId: string | null;
  conversationId: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  offers: AdminRequestOffer[];
  agreement?: AdminRequestAgreement;
  reports?: AdminRequestReport[];
  activity?: AdminRequestActivity[];
  specs?: Record<string, string>;
  attachments?: { url?: string; publicId?: string }[] | string[];
  suspended?: boolean;
  suspendReason?: string;
  suspendedAt?: string | null;
  suspendedBy?: string | null;
}

/** Pipeline counters from `GET /request/admin/stats`. */
export interface AdminRequestStats {
  total: number;
  byStatus: Record<string, number>;
  open: number;
  active?: number;
  negotiating?: number;
  agreed: number;
  converted: number;
  ordered?: number;
  closed?: number;
  reported?: number;
  openReports?: number;
  suspended?: number;
  conversionRate: number;
}

/** A platform-wide restriction on who may open/answer requests. */
export interface AdminRequestRestriction {
  id: string;
  userId: string;
  scope: 'BUYER' | 'SELLER' | 'BOTH';
  kind: 'TEMPORARY' | 'PERMANENT';
  until?: string | null;
  reason?: string;
  status: 'ACTIVE' | 'LIFTED';
  createdAt: string;
  liftedAt?: string | null;
  liftReason?: string;
}

/** Raw row as serialized by Mongoose (the API never renames `_id`). */
interface RequestDto {
  _id?: string;
  id?: string;
  title?: string;
  subject?: string;
  details?: string;
  status?: string;
  quantity?: number | string;
  unit?: string;
  productName?: string;
  targetPrice?: number | string | null;
  buyer?: { id?: string; name?: string | null; email?: string | null } | null;
  seller?: { id?: string; shopId?: string; shopName?: string; name?: string };
  customerId?: string;
  buyerId?: string;
  sellerId?: string | null;
  shopId?: string | null;
  productId?: string | null;
  orderId?: string | null;
  conversationId?: string | null;
  expiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  offers?: AdminRequestOffer[];
  agreement?: AdminRequestAgreement;
  reports?: (AdminRequestReport & { _id?: string })[];
  activity?: (AdminRequestActivity & { _id?: string })[];
  specs?: Record<string, string>;
  attachments?: { url?: string; publicId?: string }[] | string[];
  suspended?: boolean;
  suspendReason?: string;
  suspendedAt?: string | null;
  suspendedBy?: string | null;
}

/** One conversation message of a request. */
export interface AdminRequestMessage {
  id: string;
  text: string;
  sender: string;
  senderName?: string | null;
  type?: string;
  label?: string;
  replyTo?: { id?: string; sender?: string; text?: string } | null;
  images?: unknown[];
  createdAt: string;
}

/** Raw message row as serialized by Mongoose. */
interface MessageDto {
  _id?: string;
  id?: string;
  text?: string;
  sender?: string;
  senderName?: string | null;
  type?: string;
  label?: string;
  replyTo?: { id?: string; sender?: string; text?: string } | null;
  images?: unknown[];
  createdAt?: string;
}

function toUiRequest(raw: RequestDto): AdminRequestRow {
  return {
    id: String(raw._id || raw.id || ''),
    title: raw.title || raw.subject || '',
    details: raw.details || '',
    status: String(raw.status || '').toUpperCase(),
    quantity: Number(raw.quantity) || 0,
    unit: raw.unit || 'Unit',
    productName: raw.productName || '',
    targetPrice: raw.targetPrice == null ? null : Number(raw.targetPrice),
    buyer: raw.buyer || null,
    sellerName: raw.seller?.shopName || raw.seller?.name || '',
    customerId: String(raw.customerId || raw.buyerId || ''),
    sellerId: raw.sellerId || null,
    shopId: raw.shopId || null,
    productId: raw.productId || null,
    orderId: raw.orderId || null,
    conversationId: raw.conversationId || null,
    expiresAt: raw.expiresAt || null,
    createdAt: raw.createdAt || '',
    updatedAt: raw.updatedAt || '',
    offers: (raw.offers || []).map((offer) => ({ ...offer })),
    agreement: raw.agreement || undefined,
    reports: (raw.reports || []).map((report) => ({
      ...report,
      id: String(report._id || report.id || ''),
    })),
    activity: (raw.activity || []).map((entry) => ({
      ...entry,
      id: String(entry._id || entry.id || ''),
    })),
    specs: raw.specs || {},
    attachments: raw.attachments || [],
    suspended: Boolean(raw.suspended),
    suspendReason: raw.suspendReason || '',
    suspendedAt: raw.suspendedAt || null,
    suspendedBy: raw.suspendedBy || null,
  };
}

export const requestsAdmin = {
  /**
   * Admin request list. Tabs map to server-side stages
   * (`all|active|negotiating|agreed|ordered|closed|reported|suspended`) plus
   * the moderation filters: search, buyer, seller, product, dates, price range.
   */
  async list(
    params: {
      page?: number;
      limit?: number;
      status?: string;
      tab?: string;
      q?: string;
      buyer?: string;
      seller?: string;
      productId?: string;
      from?: string;
      to?: string;
      minPrice?: number | string;
      maxPrice?: number | string;
    } = {}
  ) {
    const { page = 1, limit = 10, status, tab, q, buyer, seller, productId, from, to, minPrice, maxPrice } = params;
    const res = await http.get<{
      success: boolean;
      requests?: RequestDto[];
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
    }>('/request/admin', {
      params: {
        page,
        limit,
        ...(status && { status }),
        ...(tab && { tab }),
        ...(q && { q }),
        ...(buyer && { buyer }),
        ...(seller && { seller }),
        ...(productId && { productId }),
        ...(from && { from }),
        ...(to && { to }),
        ...(minPrice !== undefined && minPrice !== '' && { minPrice }),
        ...(maxPrice !== undefined && maxPrice !== '' && { maxPrice }),
      },
    });
    const total = res.total || 0;
    return {
      items: (res.requests || []).map(toUiRequest),
      total,
      page: res.page || page,
      limit: res.limit || limit,
      totalPages: res.totalPages ?? Math.ceil(total / limit),
    };
  },

  /** Funnel + moderation counters (total / open / agreed / ordered / reported / suspended). */
  async stats(): Promise<AdminRequestStats> {
    const res = await http.get<{ success: boolean } & AdminRequestStats>(
      '/request/admin/stats'
    );
    return {
      total: res.total || 0,
      byStatus: res.byStatus || {},
      open: res.open || 0,
      active: res.active || 0,
      negotiating: res.negotiating || 0,
      agreed: res.agreed || 0,
      converted: res.converted || 0,
      ordered: res.ordered || 0,
      closed: res.closed || 0,
      reported: res.reported || 0,
      openReports: res.openReports || 0,
      suspended: res.suspended || 0,
      conversionRate: res.conversionRate || 0,
    };
  },

  /** Close an abusive/reported request; the reason is kept on the request. */
  async close(id: string, reason = '') {
    const res = await http.post<{ success: boolean; request: RequestDto }>(
      `/request/admin/${id}/close`,
      { reason }
    );
    return toUiRequest(res.request);
  },

  /** Suspend: every write on the request is frozen until it is restored. */
  async suspend(id: string, reason = '') {
    const res = await http.post<{ success: boolean; request: RequestDto }>(
      `/request/admin/${id}/suspend`,
      { reason }
    );
    return toUiRequest(res.request);
  },

  /** Restore a suspended request back into the negotiation. */
  async restore(id: string) {
    const res = await http.post<{ success: boolean; request: RequestDto }>(
      `/request/admin/${id}/restore`
    );
    return toUiRequest(res.request);
  },

  /** Remove one attachment (data-URL image) from a reported request. */
  async removeAttachment(id: string, index: number) {
    const res = await http.post<{ success: boolean; request: RequestDto }>(
      `/request/admin/${id}/attachments/remove`,
      { index }
    );
    return toUiRequest(res.request);
  },

  /** Resolve or dismiss a report (`RESOLVED` / `DISMISSED`). */
  async reviewReport(id: string, reportId: string, status: 'RESOLVED' | 'DISMISSED', resolution = '') {
    const res = await http.post<{ success: boolean; request: RequestDto }>(
      `/request/admin/${id}/reports/${reportId}/review`,
      { status, resolution }
    );
    return toUiRequest(res.request);
  },

  /** Platform-wide restrictions (who may open / answer requests). */
  async restrictions(params: { page?: number; limit?: number; status?: string } = {}) {
    const res = await http.get<{
      success: boolean;
      restrictions?: ({
        _id?: string;
        id?: string;
      } & Omit<AdminRequestRestriction, 'id'>)[];
      total?: number;
    }>('/request/admin/restrictions', { params: { page: 1, limit: 50, ...params } });
    return (res.restrictions || []).map((row) => ({
      ...row,
      id: String(row._id || row.id || ''),
    }));
  },

  async createRestriction(payload: {
    userId: string;
    scope: 'BUYER' | 'SELLER' | 'BOTH';
    kind: 'TEMPORARY' | 'PERMANENT';
    until?: string;
    reason?: string;
  }) {
    const res = await http.post<{ success: boolean; restriction: { _id?: string; id?: string } & Omit<AdminRequestRestriction, 'id'> }>(
      '/request/admin/restrictions',
      payload
    );
    const row = res.restriction || ({} as { _id?: string });
    return { ...row, id: String(row._id || row.id || '') };
  },

  async liftRestriction(restrictionId: string, reason = '') {
    const res = await http.post<{ success: boolean; restriction: { _id?: string; id?: string } & Omit<AdminRequestRestriction, 'id'> }>(
      `/request/admin/restrictions/${restrictionId}/lift`,
      { reason }
    );
    const row = res.restriction || ({} as { _id?: string });
    return { ...row, id: String(row._id || row.id || '') };
  },

  /** Conversation messages for a request (admin is a permitted participant). */
  async getMessages(id: string): Promise<AdminRequestMessage[]> {
    const res = await http.get<{ success: boolean; messages?: MessageDto[] }>(
      `/request/${id}/messages`
    );
    return (res.messages || []).map((message) => ({
      id: String(message._id || message.id || ''),
      text: message.text || '',
      sender: String(message.sender || ''),
      senderName: message.senderName || null,
      type: message.type || 'text',
      label: message.label || '',
      replyTo: message.replyTo || null,
      images: message.images,
      createdAt: message.createdAt || '',
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

  /**
   * How many audit logs a purge scope would remove. The UI shows this BEFORE
   * the destructive call so the admin confirms a real number, not a guess.
   */
  async previewPurge(params: { action?: string; module?: string; level?: string; startDate?: string; endDate?: string } = {}) {
    const queryParams: Record<string, string> = {};
    if (params.action) queryParams.action = params.action;
    if (params.module) queryParams.module = params.module;
    if (params.level) queryParams.level = params.level;
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;

    const res = await http.get<{ success: boolean; total: number }>('/admin/audit-logs/purge-preview', {
      params: queryParams,
    });
    return { total: res.total || 0 };
  },

  /**
   * Permanently delete audit logs. Requires the `audit.manage` permission and a
   * reason; the server also re-audits the purge so it can never be silent.
   */
  async clearLogs(payload: {
    reason: string;
    confirm: string;
    action?: string;
    module?: string;
    level?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const res = await http.delete<{
      success: boolean;
      deleted: number;
      total: number;
      byLevel: Record<string, number>;
    }>('/admin/audit-logs', payload as unknown as Record<string, unknown>);
    return { deleted: res.deleted || 0, total: res.total || 0, byLevel: res.byLevel || {} };
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
      items: (res.businesses || []).map(b => ({ ...b, id: b._id || b.id })),
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

  // Shop Management — the ONE admin shop list is getShopsPaged (/admin/shops).
  async getShopsPaged(filters?: Record<string, unknown>) {
    const res = await http.get<{
      success: boolean; shops: any[]; total?: number; page?: number;
      limit?: number; totalPages?: number; statusCounts?: any;
    }>('/admin/shops', { params: filters as any });
    return {
      items: (res.shops || []).map(s => ({ ...s, id: s._id || s.id })),
      total: res.total || 0,
      page: res.page || 1,
      limit: res.limit || 50,
      totalPages: res.totalPages || 0,
      statusCounts: res.statusCounts || {},
    };
  },

  /**
   * Admin "allow in public" toggle for a shop — the in-place Public switch on
   * the Stores table. Cascades server-side to the shop's products/events.
   */
  async setShopShowOnPublic(id: string, showOnPublic: boolean) {
    const res = await http.patch<{ success: boolean; shop: any }>(
      `/shop/admin/shops/${id}/public`,
      { showOnPublic }
    );
    return res.shop;
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

  // Audit Logs — use auditAdmin.listLogs / auditAdmin.getStats instead.
  // Export Functions — real field names match the camelCase AuditLog shape.
  generateAuditLogsCsv(logs: any[]): string {
    const headers = ['Timestamp', 'Admin', 'Action', 'Module', 'Target Entity', 'Target ID', 'Details'];
    const rows = logs.map(log =>
      [
        log.timestamp,
        log.adminName || log.adminId || '',
        log.action,
        log.module || '',
        log.targetEntity || '',
        log.targetId || '',
        typeof log.details === 'object' ? JSON.stringify(log.details) : (log.details || ''),
      ]
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  },
};
