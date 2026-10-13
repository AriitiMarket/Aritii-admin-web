/**
 * Platform Admin Control Center service (Commerce-owned platform APIs).
 *
 * The single typed boundary between the admin UI and the platform admin
 * endpoints. It owns the response envelopes, so pages never touch raw shapes.
 *
 * Endpoints used (verified against the live gateway):
 *   GET  /admin/platform/stats | /pending
 *   GET  /admin/businesses | /businesses/:id ; POST /businesses/:id/approve|reject
 *   GET  /admin/shops | /admin/orders | /admin/orders/:id/pickup-delivery
 *   GET  /admin/operations | /admin/operations/:stage
 */
import { http } from '@/services/client/httpClient';

export interface PendingAction {
  id: string;
  type: 'business_application' | 'shop' | 'dispute' | 'delivery';
  title: string;
  subtitle: string | null;
  status: string;
  createdAt: string;
  action: string;
  href: string;
}

export interface PlatformStats {
  users: {
    total: number | null;
    byRole: Record<string, number> | null;
    active: number | null;
    suspended: number | null;
    banned: number | null;
  };
  businesses: { total: number; active: number; pending: number; rejected: number; suspended: number; draft: number };
  shops: { total: number; active: number; pending: number; suspended: number; inactive: number };
  locations: { total: number; zones: number; regions: number | null; cities: number | null; areas: number | null } | null;
  sectors: { total: number; active: number };
  orders: {
    total: number;
    today: number;
    active: number;
    byStatus: Record<string, number>;
    completed: number;
    cancelled: number;
    awaitingPickup: number | null;
    inTransit: number | null;
    exception: number;
  };
  deliveries: {
    total: number;
    active: number;
    failed: number;
    byStatus: Record<string, number>;
    actors: { total: number; available: number };
  } | null;
  disputes: { total: number; open: number };
  pendingActions: {
    businesses: number;
    shops: number;
    disputes: number;
    failedDeliveries: number | null;
    total: number;
  };
  unavailable: string[];
  generatedAt: string;
}

export interface OperationalStage {
  stage: string;
  label: string;
  count: number | null;
  drilldown: string;
}

export interface OperationsOverview {
  stages: OperationalStage[];
  total: number;
  deliveryAvailable: boolean;
  delivery: {
    byStatus: Record<string, number>;
    active: number;
    failed: number;
    actors: { total: number; available: number };
  } | null;
  unsupportedStages: { stage: string; reason: string }[];
  generatedAt: string;
}

export interface AdminOrder {
  id: string;
  customerRef: string | null;
  sellerId: string | null;
  totalPrice: number;
  items: number;
  status: string;
  paymentStatus: string;
  stage: string;
  stageLabel: string;
  stageReason: string;
  deliveryStatus: string | null;
  deliveryId: string | null;
  pickupLocationId: string | null;
  destinationLocationId: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  failureReason: string | null;
  createdAt: string;
}

export interface PagedOrders {
  items: AdminOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stageCounts: Record<string, number>;
  stageDefinitions: { stage: string; label: string }[];
  /**
   * How the backend produced `stageCounts`: 'status' = aggregated from order
   * status across the whole scoped set; 'scan' = derived from a full lifecycle
   * scan (order + delivery). Absent on payloads that predate the labels.
   */
  stageCountsScope?: 'status' | 'scan';
  /** True when a stage scan hit its cap, so the totals may be incomplete. */
  stageScanCapped?: boolean;
}

export interface OrderLifecycle {
  order: { id: string; status: string; paymentStatus: string; totalPrice: number; createdAt: string };
  stage: string;
  stageLabel: string;
  stageReason: string;
  pickup: {
    locationId: string | null;
    address: unknown;
    status: string | null;
    actorId: string | null;
    readyAt: string | null;
    pickedUpAt: string | null;
  };
  dropOff: {
    destinationLocationId: string | null;
    address: unknown;
    zoneId: string | null;
    deliveredAt: string | null;
    failureReason: string | null;
  };
  timeline: { stage: string; label: string; timestamp: string; source: string }[];
  history: unknown[];
  deliveryUnavailable: boolean;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Payload of GET /admin/platform/pending — the admin action queue. */
export interface PendingActions {
  items: PendingAction[];
  counts: Record<string, number>;
  total: number;
  unavailable: string[];
}

// --- Service --------------------------------------------------------------

export const platformAdminService = {
  getPlatformStats(): Promise<PlatformStats> {
    return http
      .get<{ success: boolean; stats: PlatformStats }>('/admin/platform/stats')
      .then((res) => res.stats);
  },

  getPendingActions(): Promise<PendingActions> {
    return http
      .get<{ success: boolean; pending: PendingActions }>('/admin/platform/pending')
      .then((res) => res.pending);
  },

  listBusinesses(
    params: Record<string, string | number | undefined>
  ): Promise<PagedResult<Record<string, unknown>>> {
    return http
      .get<{
        success: boolean;
        businesses: Record<string, unknown>[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>('/admin/businesses', { params: params as never })
      .then((res) => ({
        items: res.businesses || [],
        total: res.total || 0,
        page: res.page || 1,
        limit: res.limit || 50,
        totalPages: res.totalPages || 0,
      }));
  },

  getBusinessDetail(businessId: string): Promise<{
    business: Record<string, unknown>;
    shops: Record<string, unknown>[];
    shopCount: number;
  }> {
    return http
      .get<{
        success: boolean;
        business: Record<string, unknown>;
        shops: Record<string, unknown>[];
        shopCount: number;
      }>(`/admin/businesses/${businessId}`)
      .then((res) => ({ business: res.business, shops: res.shops || [], shopCount: res.shopCount || 0 }));
  },

  // The seller-application approve/reject wrappers that used to live here were
  // removed: the console reviews applications through `businessesService`
  // (POST /seller-application/:id/...), and the backend now runs the alternate
  // /admin/businesses/:id/... path through that same implementation.

  /** Paged shop list lives on `adminApi.getShopsPaged` (/admin/shops). */

  listOrders(params: Record<string, string | number | undefined>): Promise<PagedOrders> {
    return http
      .get<{
        success: boolean;
        orders: AdminOrder[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        stageCounts: Record<string, number>;
        stageDefinitions: { stage: string; label: string }[];
      }>('/admin/orders', { params: params as never })
      .then((res) => ({
        items: res.orders || [],
        total: res.total || 0,
        page: res.page || 1,
        limit: res.limit || 50,
        totalPages: res.totalPages || 0,
        stageCounts: res.stageCounts || {},
        stageDefinitions: res.stageDefinitions || [],
      }));
  },

  getOrderLifecycle(orderId: string): Promise<OrderLifecycle> {
    return http
      .get<{ success: boolean; lifecycle: OrderLifecycle }>(`/admin/orders/${orderId}/pickup-delivery`)
      .then((res) => res.lifecycle);
  },

  getOperations(): Promise<OperationsOverview> {
    return http
      .get<{ success: boolean; operations: OperationsOverview }>('/admin/operations')
      .then((res) => res.operations);
  },

  getOrdersByStage(
    stage: string,
    params: Record<string, string | number | undefined> = {}
  ): Promise<PagedOrders & { stage: string }> {
    // The endpoint answers with `operations: { stage, orders, ... }`. It used to be
    // returned as-is while the type claimed `items`, so the drill-down list read
    // `data.items` and rendered empty.
    return http
      .get<{
        success: boolean;
        operations: {
          stage: string;
          orders?: AdminOrder[];
          total?: number;
          page?: number;
          limit?: number;
          totalPages?: number;
          stageCounts?: Record<string, number>;
          stageDefinitions?: { stage: string; label: string }[];
          stageCountsScope?: 'status' | 'scan';
          stageScanCapped?: boolean;
        };
      }>(`/admin/operations/${stage}`, { params: params as never })
      .then((res) => ({
        stage: res.operations.stage,
        items: res.operations.orders || [],
        total: res.operations.total || 0,
        page: res.operations.page || 1,
        limit: res.operations.limit || 50,
        totalPages: res.operations.totalPages || 0,
        stageCounts: res.operations.stageCounts || {},
        stageDefinitions: res.operations.stageDefinitions || [],
        stageCountsScope: res.operations.stageCountsScope,
        stageScanCapped: res.operations.stageScanCapped,
      }));
  },
};
