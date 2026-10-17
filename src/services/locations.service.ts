/**
 * Location management service — talks to Delivery Service via API Gateway.
 *
 * All endpoints go through /delivery/location/* which the gateway proxies
 * to the Delivery Service. Admin endpoints require admin auth.
 */
import { http } from '@/services/client/httpClient';

export interface LocationServiceability {
  serviceable: boolean;
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  codAvailable: boolean;
  estimatedDeliveryTime?: string;
  deliveryFee?: number;
  freeDeliveryThreshold?: number;
  minimumOrder?: number;
  operatingHours?: {
    open: string;
    close: string;
    days: string[];
  };
}

export interface Port {
  isPort: boolean;
  portName?: string;
  portCode?: string;
  portAddress?: string;
  contactInfo?: { phone?: string; email?: string };
  operatingStatus: 'active' | 'inactive' | 'maintenance';
  capacity?: number;
}

export interface Location {
  _id: string;
  name: string;
  localName?: string;
  type: string;
  parentId: string | null;
  code: string | null;
  description: string;
  isActive: boolean;
  /** GeoJSON Point, [longitude, latitude]. Null when the location is not mapped. */
  coordinates?: GeoPoint | null;
  serviceability?: LocationServiceability;
  port?: Port;
  expansionStatus?: 'planned' | 'preparing' | 'testing' | 'active' | 'suspended' | 'closed';
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocationTreeNode {
  _id: string;
  name: string;
  type: string;
  code: string | null;
  isActive: boolean;
  parentId: string | null;
  children: LocationTreeNode[];
}

export interface LocationHierarchy {
  location: Location;
  ancestors: Location[];
}

export interface TypeRules {
  types: string[];
  rootTypes: string[];
  children: Record<string, string[]>;
}

export interface PagedLocations {
  locations: Location[];
  count: number;
}

export interface BulkImportResult {
  created: Location[];
  createdCount: number;
  failed: { row: number; name: string | null; reason: string }[];
  failedCount: number;
  total: number;
  limit: number;
}

/**
 * GeoJSON Point as stored by the Delivery Service.
 * `coordinates` is [longitude, latitude] — NOT [lat, lng].
 */
export interface GeoPoint {
  type: string;
  coordinates: number[];
}

export interface Zone {
  _id: string;
  name: string;
  code: string;
  status: string;
  lifecycle?: 'DRAFT' | 'READY' | 'LIVE' | 'PAUSED';
  locationIds: string[];
  coverage?: {
    radiusKm?: number;
    /** Typed as GeoPoint (not `unknown`) so the map needs no unsafe cast. */
    center?: GeoPoint;
    boundaries?: unknown;
    includedAreas?: string[];
    excludedAreas?: string[];
  };
  deliveryRules?: { serviceable: boolean; deliveryFee: number; freeDeliveryThreshold?: number; estimatedDeliveryTime: string; minimumOrder?: number; codAvailable: boolean; pickupAvailable: boolean };
  operationalRules?: { allowedProviders?: string[]; allowedRiders?: string[]; priority: number; operatingHours?: { open: string; close: string; days: string[] } };
  priority?: number;
  portId?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// --- Location API ---

/** Query params accepted by `GET /delivery/location`. */
export interface LocationListParams {
  type?: string;
  parentId?: string;
  /** 'active' | 'inactive' | 'all' — omitted defaults to active only. */
  status?: string;
  /** 'true' | 'false' */
  serviceable?: string;
  /** 'true' | 'false' */
  port?: string;
  expansionStatus?: string;
  /** Free-text search over name / localName / code. */
  q?: string;
  page?: number;
  limit?: number;
}

/** Paginated response of `GET /delivery/location`. */
export interface LocationListResult {
  locations: Location[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Aggregated stats returned by `GET /delivery/location/stats`. */
export interface LocationStats {
  totalLocations: number;
  activeLocations: number;
  serviceableLocations: number;
  ports: number;
  pendingExpansion: number;
}

function fetchLocationList(params?: LocationListParams): Promise<LocationListResult> {
  return http
    .get<{
      success: boolean;
      locations: Location[];
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
    }>('/delivery/location', { params: params as never })
    .then((res) => ({
      locations: res.locations || [],
      total: res.total ?? res.locations?.length ?? 0,
      page: res.page ?? params?.page ?? 1,
      limit: res.limit ?? params?.limit ?? 50,
      totalPages: res.totalPages ?? 0,
    }));
}

export const locationsService = {
  /** Full location tree. */
  getHierarchy(): Promise<LocationTreeNode[]> {
    return http
      .get<{ success: boolean; hierarchy: LocationTreeNode[] }>(
        '/delivery/location/hierarchy'
      )
      .then((res) => res.hierarchy || []);
  },

  /** List locations with optional filters (first page items only). */
  list(params?: LocationListParams): Promise<Location[]> {
    return fetchLocationList(params).then((res) => res.locations);
  },

  /** List locations including pagination metadata. */
  listWithMeta(params?: LocationListParams): Promise<LocationListResult> {
    return fetchLocationList(params);
  },

  /** Aggregated location stats for the summary cards. */
  getStats(): Promise<LocationStats> {
    return http
      .get<{ success: boolean } & Partial<LocationStats>>(
        '/delivery/location/stats'
      )
      .then((res) => ({
        totalLocations: res.totalLocations ?? 0,
        activeLocations: res.activeLocations ?? 0,
        serviceableLocations: res.serviceableLocations ?? 0,
        ports: res.ports ?? 0,
        pendingExpansion: res.pendingExpansion ?? 0,
      }));
  },

  /** Get a single location by ID. */
  get(id: string): Promise<Location> {
    return http
      .get<{ success: boolean; location: Location }>(
        `/delivery/location/${id}`
      )
      .then((res) => res.location);
  },

  /** Get children of a location. */
  getChildren(id: string): Promise<Location[]> {
    return http
      .get<{ success: boolean; children: Location[]; count: number }>(
        `/delivery/location/${id}/children`
      )
      .then((res) => res.children || []);
  },

  /** Get ancestors (path) of a location. */
  getAncestors(id: string): Promise<Location[]> {
    return http
      .get<{ success: boolean; ancestors: Location[]; count: number }>(
        `/delivery/location/${id}/ancestors`
      )
      .then((res) => res.ancestors || []);
  },

  /** Get full hierarchy path for a location (ancestors + self). */
  getHierarchyPath(id: string): Promise<LocationHierarchy> {
    return http
      .get<{ success: boolean; location: Location; ancestors: Location[] }>(
        `/delivery/location/${id}`
      )
      .then((res) => ({
        location: res.location,
        ancestors: res.ancestors || [],
      }));
  },

  /** Search locations by name. */
  search(query: string): Promise<Location[]> {
    return http
      .get<{ success: boolean; locations: Location[]; count: number }>(
        '/delivery/location/search',
        { params: { q: query } }
      )
      .then((res) => res.locations || []);
  },

  /** Get location type rules. */
  getTypeRules(): Promise<TypeRules> {
    return http
      .get<{ success: boolean } & TypeRules>('/delivery/location/types')
      .then((res) => ({
        types: res.types,
        rootTypes: res.rootTypes,
        children: res.children,
      }));
  },

  /** Create a new location (admin only). */
  create(data: {
    name: string;
    type: string;
    parentId?: string | null;
    code?: string;
    description?: string;
    isActive?: boolean;
  }): Promise<Location> {
    return http
      .post<{ success: boolean; location: Location }>(
        '/delivery/location',
        data
      )
      .then((res) => res.location);
  },

  /** Update a location (admin only). */
  update(
    id: string,
    data: {
      name?: string;
      type?: string;
      parentId?: string | null;
      code?: string;
      description?: string;
      isActive?: boolean;
    }
  ): Promise<Location> {
    return http
      .put<{ success: boolean; location: Location }>(
        `/delivery/location/${id}`,
        data
      )
      .then((res) => res.location);
  },

  /** Activate a location (admin only). */
  activate(id: string): Promise<Location> {
    return http
      .put<{ success: boolean; location: Location }>(
        `/delivery/location/${id}/activate`
      )
      .then((res) => res.location);
  },

  /** Deactivate a location (admin only). */
  deactivate(id: string): Promise<Location> {
    return http
      .put<{ success: boolean; location: Location }>(
        `/delivery/location/${id}/deactivate`
      )
      .then((res) => res.location);
  },

  /** Bulk import locations (admin only). */
  bulkImport(rows: {
    name: string;
    type: string;
    parentName?: string;
    code?: string;
    description?: string;
    isActive?: boolean;
  }[]): Promise<BulkImportResult> {
    return http.post<BulkImportResult>('/delivery/location/bulk', { rows });
  },
};

// --- Zone API ---

export const zonesService = {
  /** List zones with optional filters. */
  list(params?: { status?: string; search?: string; page?: number; limit?: number }): Promise<{ zones: Zone[]; total: number; page: number; limit: number; totalPages: number }> {
    return http
      .get<{ success: boolean; zones: Zone[]; total: number; page: number; limit: number; totalPages: number }>(
        '/delivery/zone',
        { params: params as never }
      )
      .then((res) => ({
        zones: res.zones || [],
        total: res.total || 0,
        page: res.page || 1,
        limit: res.limit || 50,
        totalPages: res.totalPages || 0,
      }));
  },

  /** Get a zone by ID. */
  get(id: string): Promise<Zone> {
    return http
      .get<{ success: boolean; zone: Zone }>(`/delivery/zone/${id}`)
      .then((res) => res.zone);
  },

  /** Create a zone. */
  create(data: { name: string; code: string; status?: string; locationIds?: string[]; coverage?: Record<string, unknown> }): Promise<Zone> {
    return http
      .post<{ success: boolean; zone: Zone }>('/delivery/zone', data)
      .then((res) => res.zone);
  },

  /** Update a zone. */
  update(id: string, data: Partial<{ name: string; code: string; status: string; locationIds: string[] }>): Promise<Zone> {
    return http
      .put<{ success: boolean; zone: Zone }>(`/delivery/zone/${id}`, data)
      .then((res) => res.zone);
  },

  /** Activate a zone. */
  activate(id: string): Promise<Zone> {
    return http
      .put<{ success: boolean; zone: Zone }>(`/delivery/zone/${id}/activate`)
      .then((res) => res.zone);
  },

  /** Deactivate a zone. */
  deactivate(id: string): Promise<Zone> {
    return http
      .put<{ success: boolean; zone: Zone }>(`/delivery/zone/${id}/deactivate`)
      .then((res) => res.zone);
  },

  /** Delete a zone. */
  delete(id: string): Promise<Zone> {
    return http
      .delete<{ success: boolean; zone: Zone }>(`/delivery/zone/${id}`)
      .then((res) => res.zone);
  },

  /** Get zone stats. */
  getStats(): Promise<{ totalZones: number; activeZones: number; serviceableZones: number; unassignedZones: number; zonesWithActiveRoutes: number }> {
    return http
      .get<{ success: boolean } & { totalZones: number; activeZones: number; serviceableZones: number; unassignedZones: number; zonesWithActiveRoutes: number }>('/delivery/zone/stats')
      .then((res) => ({
        totalZones: res.totalZones,
        activeZones: res.activeZones,
        serviceableZones: res.serviceableZones,
        unassignedZones: res.unassignedZones,
        zonesWithActiveRoutes: res.zonesWithActiveRoutes,
      }));
  },

  /** Add a location to a zone. */
  addLocation(zoneId: string, locationId: string): Promise<Zone> {
    return http
      .post<{ success: boolean; zone: Zone }>(`/delivery/zone/${zoneId}/locations`, { locationId })
      .then((res) => res.zone);
  },

  /** Remove a location from a zone. */
  removeLocation(zoneId: string, locationId: string): Promise<Zone> {
    return http
      .delete<{ success: boolean; zone: Zone }>(`/delivery/zone/${zoneId}/locations/${locationId}`)
      .then((res) => res.zone);
  },

  /** Check coverage for a location. */
  checkCoverage(locationId: string): Promise<{ covered: boolean; zones: { id: string; name: string; code: string }[] }> {
    return http
      .get<{ success: boolean; covered: boolean; zones: { id: string; name: string; code: string }[] }>(
        `/delivery/zone/coverage/${locationId}`
      )
      .then((res) => ({ covered: res.covered, zones: res.zones || [] }));
  },

  /** Find zones for a location. */
  findByLocation(locationId: string): Promise<Zone[]> {
    return http
      .get<{ success: boolean; zones: Zone[] }>(
        `/delivery/zone/location/${locationId}`
      )
      .then((res) => res.zones || []);
  },
};

// --- Route API ---

export interface DeliveryRoute {
  _id: string;
  name: string;
  code?: string;
  originLocationId: string;
  originLocationName?: string;
  destinationLocationId: string;
  destinationLocationName?: string;
  status: string;
  distanceKm?: number;
  estimatedDurationMinutes?: number;
  distance?: number;
  estimatedDuration?: number;
  description?: string;
  waypoints?: string[];
  providerId?: string;
  vehicleRequirements?: string[];
  riderRequirements?: string[];
  operatingHours?: { open: string; close: string; days: string[] };
  maxCapacity?: number;
  priority?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const routesService = {
  /** List routes. */
  list(params?: { status?: string; originId?: string; destinationId?: string; search?: string; page?: number; limit?: number }): Promise<{ routes: DeliveryRoute[]; total: number; page: number; limit: number; totalPages: number }> {
    return http
      .get<{ success: boolean; routes: DeliveryRoute[]; total: number; page: number; limit: number; totalPages: number }>(
        '/delivery/route',
        { params: params as never }
      )
      .then((res) => ({
        routes: res.routes || [],
        total: res.total || 0,
        page: res.page || 1,
        limit: res.limit || 50,
        totalPages: res.totalPages || 0,
      }));
  },

  /** Get a route by ID. */
  get(id: string): Promise<DeliveryRoute> {
    return http
      .get<{ success: boolean; route: DeliveryRoute }>(`/delivery/route/${id}`)
      .then((res) => res.route);
  },

  /** Create a route. */
  create(data: { name: string; code?: string; originLocationId: string; destinationLocationId: string; status?: string; distanceKm?: number; estimatedDurationMinutes?: number; description?: string; waypoints?: string[]; providerId?: string; priority?: number; maxCapacity?: number }): Promise<DeliveryRoute> {
    return http
      .post<{ success: boolean; route: DeliveryRoute }>('/delivery/route', data)
      .then((res) => res.route);
  },

  /** Update a route. */
  update(id: string, data: Partial<{ name: string; code?: string; status: string; distanceKm?: number; estimatedDurationMinutes?: number; description?: string; providerId?: string; priority?: number; maxCapacity?: number }>): Promise<DeliveryRoute> {
    return http
      .put<{ success: boolean; route: DeliveryRoute }>(`/delivery/route/${id}`, data)
      .then((res) => res.route);
  },

  /** Delete a route. */
  delete(id: string): Promise<DeliveryRoute> {
    return http
      .delete<{ success: boolean; route: DeliveryRoute }>(`/delivery/route/${id}`)
      .then((res) => res.route);
  },

  /** Get route stats. */
  getStats(): Promise<{ totalRoutes: number; activeRoutes: number; routesInOperation: number; delayedRoutes: number; routesRequiringReview: number }> {
    return http
      .get<{ success: boolean } & { totalRoutes: number; activeRoutes: number; routesInOperation: number; delayedRoutes: number; routesRequiringReview: number }>('/delivery/route/stats')
      .then((res) => ({
        totalRoutes: res.totalRoutes,
        activeRoutes: res.activeRoutes,
        routesInOperation: res.routesInOperation,
        delayedRoutes: res.delayedRoutes,
        routesRequiringReview: res.routesRequiringReview,
      }));
  },

  /** List all public delivery zones (for shop coverage assignment). */
  async listZones(params?: { cityId?: string; limit?: number }): Promise<{ zones: any[]; count: number }> {
    const query = new URLSearchParams();
    if (params?.cityId) query.set('cityId', params.cityId);
    if (params?.limit) query.set('limit', String(params.limit));
    const res = await http.get<{ success: boolean; zones: any[]; count: number }>(
      `/delivery/zone/public?${query}`
    );
    return { zones: res.zones || [], count: res.count || 0 };
  },
};
