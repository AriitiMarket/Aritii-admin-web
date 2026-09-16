/**
 * Platform Admin Control Center service (Commerce-owned platform APIs).
 *
 * The single typed boundary between the admin UI and the platform admin
 * endpoints. It owns the response envelopes, so pages never touch raw shapes.
 *
 * Endpoints used (verified against the live gateway):
 *   GET  /admin/platform/stats | /pending | /hierarchy
 *   GET  /admin/businesses | /businesses/:id ; POST /businesses/:id/approve|reject
 *   GET  /admin/shops | /admin/orders | /admin/orders/:id/pickup-delivery
 *   GET  /admin/operations | /admin/operations/:stage
 *   GET  /admin/growth-analytics
 *   GET/PUT/DELETE /delivery/sector-availability/location/:id[/:sectorId]
 */
import { http } from '@/services/client/httpClient';

export interface HierarchyNode {
  id: string;
  name: string;
  type: string;
  code: string | null;
  isActive: boolean;
  parentId: string | null;
  direct: { shops: number; orders: number; businesses: number };
  metrics: { shops: number; orders: number; businesses: number; children: number; activeChildren: number };
  children: HierarchyNode[];
}

export interface PlatformHierarchy {
  platform: { name: string; totals: Record<string, number> };
  regions: HierarchyNode[];
  levels?: string[];
  degraded?: boolean;
  error?: string;
  generatedAt?: string;
}

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

export interface GrowthAnalytics {
  granularity: string;
  window: { start: string; end: string; days?: number };
  comparison: { previousStart: string; previousEnd: string; basis: string; note?: string };
  series: {
    bucket: string;
    period: 'current' | 'previous';
    orders: number;
    revenue: number;
    delivered: number;
    cancelled: number;
    businesses: number;
    businessesApproved: number;
    shops: number;
    shopsActive: number;
  }[];
  summary: {
    orders: number;
    revenue: number;
    previousOrders: number;
    previousRevenue: number;
    ordersChangePercent: number | null;
    revenueChangePercent: number | null;
  };
  note?: string;
}

export interface SectorAvailability {
  sectorId: string;
  sectorName: string;
  isActive: boolean;
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  notes: string;
  updatedBy: string | null;
  updatedAt: string;
}

export interface SectorAvailabilityResponse {
  location: { id: string; name: string; type: string; isActive: boolean; parentId: string | null };
  sectors: SectorAvailability[];
  summary: { total: number; active: number; inactive: number; deliveryAvailable: number; pickupAvailable: number };
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// --- Service --------------------------------------------------------------

export const platformAdminService = {
  getPlatformStats(): Promise<PlatformStats> {
    return http
      .get<{ success: boolean; stats: PlatformStats }>('/admin/platform/stats')
      .then((res) => res.stats);
  },

  getPendingActions(): Promise<{
    items: PendingAction[];
    counts: Record<string, number>;
    total: number;
    unavailable: string[];
  }> {
    return http
      .get<{ success: boolean; pending: any }>('/admin/platform/pending')
      .then((res) => res.pending);
  },

  getHierarchy(params: { includeInactive?: boolean } = {}): Promise<PlatformHierarchy> {
    return http
      .get<{ success: boolean; hierarchy: PlatformHierarchy }>('/admin/platform/hierarchy', {
        params: params as Record<string, string | number | boolean>,
      })
      .then((res) => res.hierarchy);
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

  approveBusiness(businessId: string, notes?: string) {
    return http
      .post<{ success: boolean; business: unknown }>(`/admin/businesses/${businessId}/approve`, { notes })
      .then((res) => res.business);
  },

  rejectBusiness(businessId: string, reason: string) {
    return http
      .post<{ success: boolean; business: unknown }>(`/admin/businesses/${businessId}/reject`, { reason })
      .then((res) => res.business);
  },

  listShops(params: Record<string, string | number | undefined>): Promise<PagedResult<Record<string, unknown>>> {
    return http
      .get<{
        success: boolean;
        shops: Record<string, unknown>[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>('/admin/shops', { params: params as never })
      .then((res) => ({
        items: res.shops || [],
        total: res.total || 0,
        page: res.page || 1,
        limit: res.limit || 50,
        totalPages: res.totalPages || 0,
      }));
  },

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
    return http
      .get<{ success: boolean; operations: PagedOrders & { stage: string } }>(`/admin/operations/${stage}`, {
        params: params as never,
      })
      .then((res) => res.operations);
  },

  getGrowthAnalytics(params: Record<string, string | number | undefined>): Promise<GrowthAnalytics> {
    return http
      .get<{ success: boolean; analytics: GrowthAnalytics }>('/admin/growth-analytics', {
        params: params as never,
      })
      .then((res) => res.analytics);
  },

  getSectorAvailability(locationId: string): Promise<SectorAvailabilityResponse> {
    return http
      .get<{
        success: boolean;
        location: SectorAvailabilityResponse['location'];
        sectors: SectorAvailability[];
        summary: SectorAvailabilityResponse['summary'];
      }>(`/delivery/sector-availability/location/${locationId}`)
      .then((res) => ({ location: res.location, sectors: res.sectors || [], summary: res.summary }));
  },

  setSectorAvailability(
    locationId: string,
    sectorId: string,
    payload: {
      isActive?: boolean;
      deliveryAvailable?: boolean;
      pickupAvailable?: boolean;
      sectorName?: string;
      notes?: string;
    }
  ): Promise<SectorAvailability> {
    return http
      .put<{ success: boolean; availability: SectorAvailability }>(
        `/delivery/sector-availability/location/${locationId}/${sectorId}`,
        payload
      )
      .then((res) => res.availability);
  },

  removeSectorAvailability(locationId: string, sectorId: string): Promise<SectorAvailability> {
    return http
      .delete<{ success: boolean; removed: SectorAvailability }>(
        `/delivery/sector-availability/location/${locationId}/${sectorId}`
      )
      .then((res) => res.removed);
  },

  /**
   * Hierarchy-aware API methods for unified context filtering.
   * These endpoints apply server-side filtering based on geographic/organizational hierarchy.
   */

  /**
   * List businesses by hierarchy context (region, city, area, or sector).
   */
  listBusinessesByHierarchy(
    parentId: string,
    level: 'region' | 'city' | 'area' | 'sector',
    params: Record<string, string | number | undefined> = {}
  ): Promise<PagedResult<Record<string, unknown>>> {
    return http
      .get<{
        success: boolean;
        businesses: Record<string, unknown>[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>('/admin/businesses', {
        params: {
          ...params,
          [`${level}Id`]: parentId,
        } as never,
      })
      .then((res) => ({
        items: res.businesses || [],
        total: res.total || 0,
        page: res.page || 1,
        limit: res.limit || 50,
        totalPages: res.totalPages || 0,
      }));
  },

  /**
   * List shops by hierarchy context (sector, business, or location).
   */
  listShopsByHierarchy(
    parentId: string,
    level: 'sector' | 'business' | 'region' | 'city' | 'area',
    params: Record<string, string | number | undefined> = {}
  ): Promise<PagedResult<Record<string, unknown>>> {
    return http
      .get<{
        success: boolean;
        shops: Record<string, unknown>[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>('/admin/shops', {
        params: {
          ...params,
          [`${level}Id`]: parentId,
        } as never,
      })
      .then((res) => ({
        items: res.shops || [],
        total: res.total || 0,
        page: res.page || 1,
        limit: res.limit || 50,
        totalPages: res.totalPages || 0,
      }));
  },

  /**
   * List orders by hierarchy context.
   * Filters orders within the specified geographic/organizational scope.
   */
  listOrdersByHierarchy(
    hierarchyContext: {
      regionId?: string;
      cityId?: string;
      areaId?: string;
      sectorId?: string;
      businessId?: string;
      shopId?: string;
    },
    params: Record<string, string | number | undefined> = {}
  ): Promise<PagedResult<AdminOrder>> {
    const filterParams = Object.fromEntries(
      Object.entries(hierarchyContext).filter(([_, v]) => v !== undefined)
    );

    return http
      .get<{ success: boolean; operations: PagedOrders }>('/admin/operations/orders', {
        params: {
          ...params,
          ...filterParams,
        } as never,
      })
      .then((res) => ({
        items: res.operations?.items || [],
        total: res.operations?.total || 0,
        page: res.operations?.page || 1,
        limit: res.operations?.limit || 50,
        totalPages: res.operations?.totalPages || 0,
      }));
  },

  /**
   * Get dashboard stats filtered by hierarchy context.
   */
  getStatsByHierarchy(hierarchyContext: {
    regionId?: string;
    cityId?: string;
    areaId?: string;
    sectorId?: string;
    businessId?: string;
    shopId?: string;
  }): Promise<PlatformStats> {
    const params = Object.fromEntries(
      Object.entries(hierarchyContext).filter(([_, v]) => v !== undefined)
    );

    return http
      .get<{ success: boolean; stats: PlatformStats }>('/admin/platform/stats', {
        params: params as never,
      })
      .then((res) => res.stats);
  },

  /**
   * Get growth analytics filtered by hierarchy context.
   */
  getGrowthAnalyticsByHierarchy(
    hierarchyContext: {
      regionId?: string;
      cityId?: string;
      areaId?: string;
      sectorId?: string;
      businessId?: string;
      shopId?: string;
    },
    params: Record<string, string | number | undefined> = {}
  ): Promise<GrowthAnalytics> {
    const filterParams = Object.fromEntries(
      Object.entries(hierarchyContext).filter(([_, v]) => v !== undefined)
    );

    return http
      .get<{ success: boolean; analytics: GrowthAnalytics }>('/admin/growth-analytics', {
        params: {
          ...params,
          ...filterParams,
        } as never,
      })
      .then((res) => res.analytics);
  },
};