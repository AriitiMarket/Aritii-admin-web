/**
 * Delivery Providers service.
 *
 * A "Delivery Provider" is the single admin-facing entity for anyone who
 * performs deliveries: an individual rider, a delivery business, or a
 * logistics partner. The kind is carried by `providerType`; there are no
 * separate rider/actor/provider modules.
 */
import { http } from '@/services/client/httpClient';
import type { Zone, DeliveryRoute } from '@/services/locations.service';

export type ProviderType = 'individual_rider' | 'delivery_business' | 'logistics_partner';

export const PROVIDER_TYPES: { value: ProviderType; label: string }[] = [
  { value: 'individual_rider', label: 'Individual Rider' },
  { value: 'delivery_business', label: 'Delivery Business' },
  { value: 'logistics_partner', label: 'Logistics Partner' },
];

export const PROVIDER_TYPE_LABELS: Record<ProviderType, string> = {
  individual_rider: 'Individual Rider',
  delivery_business: 'Delivery Business',
  logistics_partner: 'Logistics Partner',
};

export type ProviderStatus = 'pending' | 'available' | 'busy' | 'offline' | 'suspended';

export const PROVIDER_STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'available', label: 'Available' },
  { value: 'busy', label: 'Busy' },
  { value: 'offline', label: 'Offline' },
  { value: 'suspended', label: 'Suspended' },
];

export const AVAILABILITY_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Online' },
  { value: 'false', label: 'Offline' },
];

export interface ProviderAvailability {
  isOnline?: boolean;
  lastSeenAt?: string | null;
  currentLocation?: { type?: string; coordinates?: number[] };
}

export interface Provider {
  _id: string;
  id?: string;
  name: string;
  phone?: string;
  email?: string | null;
  status: ProviderStatus;
  providerType: ProviderType;
  /** Transport role the provider fills (rider / driver / courier / pickup agent). */
  actorType?: string;
  availability?: ProviderAvailability;
  serviceId?: string | null;
  sectorId?: string | null;
  zoneId?: string | null;
  zoneIds?: string[];
  hubId?: string | null;
  vehicleType?: string;
  plateNumber?: string;
  maxCapacityKg?: number;
  maxActiveAssignments?: number;
  activeDeliveries?: number;
  completedDeliveries?: number;
  rating?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProviderAssignment {
  _id: string;
  reference: string;
  status: string;
  partnerId: string;
  deliveries: { orderId: string; status: string }[];
  routeId?: string | null;
  zoneIds?: string[];
  assignedAt?: string;
  respondedAt?: string | null;
  completedAt?: string | null;
  cancellationReason?: string;
}

/** Provider plus the relations the detail workspace needs. */
export interface ProviderDetail extends Provider {
  operatingLocationName?: string | null;
  zones: Zone[];
  routes: DeliveryRoute[];
  assignments: ProviderAssignment[];
  activeAssignmentCount: number;
  assignmentCount: number;
  deliveryCount: number;
}

export interface ProviderListResult {
  items: Provider[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const BASE = '/delivery/partner';

export const providersService = {
  async list(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    providerType?: string;
    zoneId?: string;
    sectorId?: string;
    isOnline?: string;
  }): Promise<ProviderListResult> {
    const res = await http.get<{
      success: boolean;
      partners?: Provider[];
      actors?: Provider[];
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
    }>(BASE, { params: params as never });

    const items = res.partners ?? res.actors ?? [];
    return {
      items: items.map((p) => ({ ...p, id: p._id || p.id })),
      total: res.total ?? items.length,
      page: res.page ?? params.page ?? 1,
      limit: res.limit ?? params.limit ?? 20,
      totalPages: res.totalPages ?? 1,
    };
  },

  async get(id: string): Promise<ProviderDetail> {
    const res = await http.get<{ success: boolean; provider: ProviderDetail }>(`${BASE}/${id}/detail`);
    return res.provider;
  },

  async create(data: Partial<Provider>): Promise<Provider> {
    const res = await http.post<{ success: boolean; partner: Provider }>(
      BASE,
      data as unknown as Record<string, unknown>
    );
    return res.partner;
  },

  async update(id: string, data: Partial<Provider>): Promise<Provider> {
    const res = await http.put<{ success: boolean; partner: Provider }>(
      `${BASE}/${id}`,
      data as unknown as Record<string, unknown>
    );
    return res.partner;
  },

  async setStatus(id: string, status: ProviderStatus): Promise<Provider> {
    const res = await http.put<{ success: boolean; partner: Provider }>(`${BASE}/${id}/status`, { status });
    return res.partner;
  },

  async setOnline(id: string, isOnline: boolean): Promise<Provider> {
    const res = await http.put<{ success: boolean; partner: Provider }>(`${BASE}/${id}/online`, { isOnline });
    return res.partner;
  },

  async approve(id: string): Promise<Provider> {
    const res = await http.post<{ success: boolean; partner: Provider }>(`${BASE}/${id}/approve`, {});
    return res.partner;
  },

  async reject(id: string, reason?: string): Promise<Provider> {
    const res = await http.post<{ success: boolean; partner: Provider }>(`${BASE}/${id}/reject`, { reason });
    return res.partner;
  },

  /** Replace assigned zones. Backend rejects inactive/non-serviceable zones. */
  async assignZones(id: string, zoneIds: string[]): Promise<Zone[]> {
    const res = await http.put<{ success: boolean; zones?: Zone[] }>(`${BASE}/${id}/zones`, { zoneIds });
    return res.zones ?? [];
  },

  /** Replace assigned routes. Reuses the existing Routes module data. */
  async assignRoutes(id: string, routeIds: string[]): Promise<DeliveryRoute[]> {
    const res = await http.put<{ success: boolean; routes?: DeliveryRoute[] }>(`${BASE}/${id}/routes`, { routeIds });
    return res.routes ?? [];
  },
};
