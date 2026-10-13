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

export type ProviderStatus = 'pending' | 'available' | 'busy' | 'offline' | 'suspended' | 'rejected';

/**
 * Canonical provider-status labels.
 *
 * PROVIDER status is its own lifecycle and is never mixed with delivery status:
 * `pending` = application under review, `rejected` = declined application,
 * `suspended` = an approved provider taken off the platform (the Admin console
 * labels it Deactivated). `available` / `busy` / `offline` are operational
 * shifts of an already-approved provider — read-only in the Admin console, not
 * approvals and not delivery progress.
 */
export const PROVIDER_STATUS_LABELS: Record<ProviderStatus, string> = {
  pending: 'Pending approval',
  rejected: 'Rejected',
  available: 'Available',
  busy: 'Busy',
  offline: 'Offline',
  suspended: 'Deactivated',
};

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
  /** Operating location: City -> Zone -> Port (§4, §5). */
  cityId?: string | null;
  portId?: string | null;
  portName?: string;
  zoneId?: string | null;
  zoneIds?: string[];
  vehicleType?: string;
  plateNumber?: string;
  maxCapacityKg?: number;
  maxActiveAssignments?: number;
  activeDeliveries?: number;
  completedDeliveries?: number;
  rating?: number;
  /**
   * Free-form record data the backend owns: `application` (what a self-applied
   * provider declared — the review questions, §4/§15) and
   * `deactivationReason` (why an Admin deactivated them, §6).
   */
  metadata?: {
    application?: Record<string, unknown>;
    deactivationReason?: string;
    [key: string]: unknown;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ProviderAssignment {
  _id: string;
  reference: string;
  status: string;
  providerId: string;
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
  /** Resolved name of `cityId` — the City in the City/Zone/Port block. */
  cityName?: string | null;
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

const BASE = '/delivery/provider';

/**
 * Response envelope of the provider endpoints.
 *
 * The detail route already answers `{ provider }` while the CRUD routes answer
 * `{ partner }`; accept either key so the read survives the partner→provider
 * renaming either way.
 */
type ProviderEnvelope = { success: boolean; provider?: Provider; partner?: Provider };

const unwrapProvider = (res: ProviderEnvelope): Provider =>
  (res.provider ?? res.partner) as Provider;

export const providersService = {
  async list(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    providerType?: string;
    zoneId?: string;
    portId?: string;
    isOnline?: string;
  }): Promise<ProviderListResult> {
    const res = await http.get<{
      success: boolean;
      providers?: Provider[];
      partners?: Provider[];
      actors?: Provider[];
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
    }>(BASE, { params: params as never });

    const items = res.providers ?? res.partners ?? res.actors ?? [];
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
    const res = await http.post<ProviderEnvelope>(
      BASE,
      data as unknown as Record<string, unknown>
    );
    return unwrapProvider(res);
  },

  async update(id: string, data: Partial<Provider>): Promise<Provider> {
    const res = await http.put<ProviderEnvelope>(
      `${BASE}/${id}`,
      data as unknown as Record<string, unknown>
    );
    return unwrapProvider(res);
  },

  /**
   * Change the provider's ACCOUNT status (approve/reject/activate/deactivate).
   * `reason` is required by the UI for deactivation and is stored on the record.
   * Availability (Online/Offline/Busy) has no admin endpoint — it is the
   * provider's own switch, exposed only through the PROVIDER-facing
   * `PUT /delivery/provider/:id/online`.
   */
  async setStatus(id: string, status: ProviderStatus, reason?: string): Promise<Provider> {
    const res = await http.put<ProviderEnvelope>(`${BASE}/${id}/status`, {
      status,
      ...(reason ? { reason } : {}),
    });
    return unwrapProvider(res);
  },

  async approve(id: string): Promise<Provider> {
    const res = await http.post<ProviderEnvelope>(`${BASE}/${id}/approve`, {});
    return unwrapProvider(res);
  },

  async reject(id: string, reason?: string): Promise<Provider> {
    const res = await http.post<ProviderEnvelope>(`${BASE}/${id}/reject`, { reason });
    return unwrapProvider(res);
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
