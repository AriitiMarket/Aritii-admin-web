/**
 * Hubs service facade.
 *
 * Hubs are physical/logistical sites attached to a location. Their zone, route
 * and provider counts are DERIVED server-side from the real Zone / Route /
 * Partner records, so this client never invents relationships.
 */
import { http } from '@/services/client/httpClient';

export interface HubProvider {
  _id: string;
  name: string;
  status: string;
  vehicleType?: string;
  phone?: string;
}

export interface Hub {
  _id: string;
  id?: string;
  name: string;
  description?: string;
  locationId: string;
  locationName?: string | null;
  locationType?: string | null;
  status: 'active' | 'inactive' | 'suspended';
  capacity?: number | null;
  currentLoad?: number | null;
  contactPhone?: string;
  contactEmail?: string;
  operatingHours?: { open: string; close: string };
  zoneCount: number;
  routeCount: number;
  providerCount: number;
  providers?: HubProvider[];
  createdAt?: string;
  updatedAt?: string;
}

export interface HubListResult {
  hubs: Hub[];
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface HubStats {
  totalHubs: number;
  activeHubs: number;
  inactiveHubs: number;
  suspendedHubs: number;
  totalCapacity: number;
  currentLoad: number;
  withProviders: number;
}

export const hubsService = {
  async list(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    locationId?: string;
  }): Promise<HubListResult> {
    const res = await http.get<{
      success: boolean;
      hubs?: Hub[];
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
    }>('/delivery/hub', { params: params as never });

    const hubs = res.hubs ?? [];
    return {
      hubs,
      count: hubs.length,
      total: res.total ?? hubs.length,
      page: res.page ?? params.page ?? 1,
      limit: res.limit ?? params.limit ?? 20,
      totalPages: res.totalPages ?? 1,
    };
  },

  async get(id: string): Promise<Hub> {
    const res = await http.get<{ success: boolean; hub: Hub }>(`/delivery/hub/${id}`);
    return res.hub;
  },

  async getStats(): Promise<HubStats> {
    const res = await http.get<{ success: boolean } & Partial<HubStats>>('/delivery/hub/stats');
    return {
      totalHubs: res.totalHubs ?? 0,
      activeHubs: res.activeHubs ?? 0,
      inactiveHubs: res.inactiveHubs ?? 0,
      suspendedHubs: res.suspendedHubs ?? 0,
      totalCapacity: res.totalCapacity ?? 0,
      currentLoad: res.currentLoad ?? 0,
      withProviders: res.withProviders ?? 0,
    };
  },

  async create(data: {
    name: string;
    locationId: string;
    description?: string;
    status?: string;
    capacity?: number;
    contactPhone?: string;
    contactEmail?: string;
  }): Promise<Hub> {
    const res = await http.post<{ success: boolean; hub: Hub }>(
      '/delivery/hub',
      data as unknown as Record<string, unknown>
    );
    return res.hub;
  },

  async update(id: string, data: Record<string, unknown>): Promise<Hub> {
    const res = await http.put<{ success: boolean; hub: Hub }>(
      `/delivery/hub/${id}`,
      data
    );
    return res.hub;
  },

  async setStatus(id: string, status: string): Promise<Hub> {
    const res = await http.put<{ success: boolean; hub: Hub }>(
      `/delivery/hub/${id}/status`,
      { status }
    );
    return res.hub;
  },
};
