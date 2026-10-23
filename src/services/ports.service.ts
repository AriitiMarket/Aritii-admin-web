/**
 * Ports service facade.
 *
 * Ports are physical/logistical sites attached to a location. Their zone, route
 * and provider counts are DERIVED server-side from the real Zone / Route /
 * Partner records, so this client never invents relationships.
 */
import { http } from '@/services/client/httpClient';

export interface PortProvider {
  _id: string;
  name: string;
  status: string;
  vehicleType?: string;
  phone?: string;
}

export interface Port {
  _id: string;
  id?: string;
  name: string;
  description?: string;
  locationId: string;
  locationName?: string | null;
  locationType?: string | null;
  zoneId?: string | null;
  zoneName?: string | null;
  status: 'active' | 'inactive' | 'suspended';
  capacity?: number | null;
  currentLoad?: number | null;
  contactPhone?: string;
  contactEmail?: string;
  operatingHours?: { open: string; close: string };
  zoneCount: number;
  routeCount: number;
  providerCount: number;
  providers?: PortProvider[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PortListResult {
  ports: Port[];
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PortStats {
  totalPorts: number;
  activePorts: number;
  inactivePorts: number;
  suspendedPorts: number;
  totalCapacity: number;
  currentLoad: number;
  withProviders: number;
}

export const portsService = {
  async list(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    locationId?: string;
  }): Promise<PortListResult> {
    const res = await http.get<{
      success: boolean;
      ports?: Port[];
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
    }>('/delivery/port', { params: params as never });

    const ports = res.ports ?? [];
    return {
      ports,
      count: ports.length,
      total: res.total ?? ports.length,
      page: res.page ?? params.page ?? 1,
      limit: res.limit ?? params.limit ?? 20,
      totalPages: res.totalPages ?? 1,
    };
  },

  async get(id: string): Promise<Port> {
    const res = await http.get<{ success: boolean; port: Port }>(`/delivery/port/${id}`);
    return res.port;
  },

  async getStats(): Promise<PortStats> {
    const res = await http.get<{ success: boolean } & Partial<PortStats>>('/delivery/port/stats');
    return {
      totalPorts: res.totalPorts ?? 0,
      activePorts: res.activePorts ?? 0,
      inactivePorts: res.inactivePorts ?? 0,
      suspendedPorts: res.suspendedPorts ?? 0,
      totalCapacity: res.totalCapacity ?? 0,
      currentLoad: res.currentLoad ?? 0,
      withProviders: res.withProviders ?? 0,
    };
  },

  async create(data: {
    name: string;
    locationId: string;
    zoneId?: string | null;
    description?: string;
    status?: string;
    capacity?: number;
    contactPhone?: string;
    contactEmail?: string;
  }): Promise<Port> {
    const res = await http.post<{ success: boolean; port: Port }>(
      '/delivery/port',
      data as unknown as Record<string, unknown>
    );
    return res.port;
  },

  async update(id: string, data: Record<string, unknown>): Promise<Port> {
    const res = await http.put<{ success: boolean; port: Port }>(
      `/delivery/port/${id}`,
      data
    );
    return res.port;
  },

  async setStatus(id: string, status: string): Promise<Port> {
    const res = await http.put<{ success: boolean; port: Port }>(
      `/delivery/port/${id}/status`,
      { status }
    );
    return res.port;
  },
};
