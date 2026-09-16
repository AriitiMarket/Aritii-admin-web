/**
 * Locations + delivery-zones service (Delivery microservice contract).
 *
 * Two things this layer must own, because the API and the UI model differ:
 *
 *  1. **id normalisation.** MongoDB returns `_id`; every UI model uses `id`.
 *     Without this mapping a list row yields `undefined` and the app navigates
 *     to `/locations/undefined`, which used to produce
 *     `GET /delivery/location/undefined` (and a 500).
 *  2. **response envelopes.** The API returns `{ location }`, `{ locations, count }`,
 *     `{ hierarchy }`, `{ zones, count }`; the UI types are flat / paged. Each
 *     method maps exactly one envelope.
 *
 * Backend endpoints used here:
 *   GET    /delivery/location                     -> { locations, count }
 *   GET    /delivery/location/hierarchy           -> { hierarchy }
 *   GET    /delivery/location/:id                 -> { location }
 *   POST   /delivery/location                     -> { location }
 *   PUT    /delivery/location/:id                 -> { location }
 *   PUT    /delivery/location/:id/activate|deactivate -> { location }
 *   GET    /delivery/zone/location/:locationId    -> { zones, count }
 *   POST   /delivery/zone                         -> { zone }
 *   PUT    /delivery/zone/:id                     -> { zone }
 */
import { http } from '@/services/client/httpClient';
import type {
  Location,
  LocationDetail,
  LocationListFilter,
  LocationListResponse,
  LocationHierarchyNode,
  DeliveryZone,
} from '@/types';

export type { LocationListFilter, LocationListResponse, LocationHierarchyNode, DeliveryZone };

type ApiRecord = Record<string, any>;

/** Maps Mongo's `_id` onto the UI's `id` (never leaves an empty id behind). */
function withId<T extends object>(raw: ApiRecord | null | undefined): T & { id: string } {
  const record: ApiRecord = raw ?? {};
  return { ...(record as T), id: String(record.id ?? record._id ?? '') } as T & { id: string };
}

function toLocation(raw: ApiRecord | null | undefined): Location {
  return withId<Location>(raw);
}

function toLocationDetail(raw: ApiRecord | null | undefined): LocationDetail {
  const detail = withId<LocationDetail>(raw);
  return {
    ...detail,
    parent: detail.parent ? toLocation(detail.parent) : detail.parent,
    children: Array.isArray(detail.children) ? detail.children.map(toLocation) : detail.children,
  };
}

function toTree(nodes: ApiRecord[] | null | undefined, level = 0): LocationHierarchyNode[] {
  return (nodes ?? []).map((node) => {
    const mapped = withId<LocationHierarchyNode>(node);
    const children = toTree(node.children, level + 1);
    return {
      ...mapped,
      level: typeof node.level === 'number' ? node.level : level,
      expandable: children.length > 0,
      children,
    };
  });
}

function toZone(raw: ApiRecord | null | undefined): DeliveryZone {
  return withId<DeliveryZone>(raw);
}

class LocationsService {
  async list(filters?: LocationListFilter): Promise<LocationListResponse> {
    const params: ApiRecord = {};
    if (filters?.page) params.page = filters.page;
    if (filters?.limit) params.limit = filters.limit;
    // The API's text-search parameter is `q`, not `search`.
    if (filters?.search) params.q = filters.search;
    if (filters?.type) params.type = filters.type;
    if (filters?.parentId) params.parentId = filters.parentId;

    const response = await http.get<{ locations?: ApiRecord[]; count?: number }>(
      '/delivery/location',
      { params }
    );
    const items = (response.locations ?? []).map(toLocation);
    const total = typeof response.count === 'number' ? response.count : items.length;
    const limit = filters?.limit && filters.limit > 0 ? filters.limit : items.length || 1;
    return { items, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async get(id: string): Promise<LocationDetail> {
    const response = await http.get<{ location?: ApiRecord }>(`/delivery/location/${id}`);
    return toLocationDetail(response.location);
  }

  async create(data: Partial<Location>): Promise<Location> {
    const response = await http.post<{ location?: ApiRecord }>('/delivery/location', data);
    return toLocation(response.location);
  }

  async update(id: string, data: Partial<Location>): Promise<Location> {
    const response = await http.put<{ location?: ApiRecord }>(`/delivery/location/${id}`, data);
    return toLocation(response.location);
  }

  async setActive(id: string, isActive: boolean): Promise<Location> {
    const endpoint = isActive
      ? `/delivery/location/${id}/activate`
      : `/delivery/location/${id}/deactivate`;
    const response = await http.put<{ location?: ApiRecord }>(endpoint);
    return toLocation(response.location);
  }

  async getHierarchyTree(parentId?: string): Promise<LocationHierarchyNode[]> {
    const params = parentId ? { parentId } : {};
    const response = await http.get<{ hierarchy?: ApiRecord[] }>('/delivery/location/hierarchy', { params });
    return toTree(response.hierarchy);
  }

  async reorderHierarchy(locationId: string, newParentId?: string): Promise<Location> {
    const response = await http.put<{ location?: ApiRecord }>(`/delivery/location/${locationId}`, {
      parentId: newParentId ?? null,
    });
    return toLocation(response.location);
  }

  // ── Delivery zones ────────────────────────────────────────────────────────

  async getDeliveryZones(locationId: string): Promise<DeliveryZone[]> {
    const response = await http.get<{ zones?: ApiRecord[] }>(`/delivery/zone/location/${locationId}`);
    return (response.zones ?? []).map(toZone);
  }

  async createDeliveryZone(_locationId: string, data: Partial<DeliveryZone>): Promise<DeliveryZone> {
    const response = await http.post<{ zone?: ApiRecord }>('/delivery/zone', data);
    return toZone(response.zone);
  }

  async updateDeliveryZone(_locationId: string, zoneId: string, data: Partial<DeliveryZone>): Promise<DeliveryZone> {
    const response = await http.put<{ zone?: ApiRecord }>(`/delivery/zone/${zoneId}`, data);
    return toZone(response.zone);
  }
}

export const locationsService = new LocationsService();
export default locationsService;
