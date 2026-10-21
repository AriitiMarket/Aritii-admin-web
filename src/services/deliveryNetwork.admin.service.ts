import { http } from '@/services/client/httpClient';
import { isApiError } from '@/types/api';

/**
 * Ports, routes, delivery services and shipment consolidation.
 *
 * The shared `http` client returns the PARSED BODY directly — it is not an
 * axios instance, so `const { data } = await http.get(...)` always yielded
 * `undefined` and every method here silently returned an empty list. It also
 * surfaces failures as `ApiError`, whose message is the server's message
 * (there is no `err.response.data.message` to read).
 *
 * Types are declared here rather than imported from elsewhere because the
 * delivery service owns these documents; the console only reads them.
 */
export type NetworkPort = {
  _id: string;
  name: string;
  locationId?: string | null;
  zoneId?: string | null;
  status?: string;
  capacity?: number | null;
  currentLoad?: number | null;
  contactPhone?: string;
  contactEmail?: string;
  operatingHours?: { open?: string | null; close?: string | null };
  createdAt?: string;
  updatedAt?: string;
}

export type NetworkRoute = {
  _id: string;
  name: string;
  code?: string | null;
  status?: string;
  originLocationId?: string | null;
  destinationLocationId?: string | null;
  distanceKm?: number | null;
  estimatedDurationMinutes?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export type NetworkService = {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  status?: string;
  serviceType?: string;
  baseFee?: number;
  perKmFee?: number;
  maxWeightKg?: number;
  estimatedDurationMinutes?: number;
  coverageZones?: string[];
}

export type NetworkShipment = {
  _id: string;
  shipmentNumber?: string;
  status?: string;
  originLocationId?: string | null;
  destinationLocationId?: string | null;
  routeId?: string | null;
  serviceId?: string | null;
  providerId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type PortInput = {
  name: string;
  locationId?: string | null;
  zoneId?: string | null;
  status?: string;
  capacity?: number | null;
  contactPhone?: string;
  contactEmail?: string;
  operatingHours?: { open?: string | null; close?: string | null };
}

export type RouteInput = {
  name: string;
  code?: string | null;
  origin: string;
  destination: string;
  status?: string;
  distanceKm?: number | null;
  estimatedDurationMinutes?: number | null;
}

export type ServiceInput = {
  name: string;
  code?: string;
  type: string;
  description?: string;
  status?: string;
  baseFee?: number;
  perKmFee?: number;
  maxWeightKg?: number;
  estimatedDurationMinutes?: number;
}

export type ConsolidationInput = {
  originLocationId?: string | null;
  destinationLocationId?: string | null;
  routeId?: string | null;
  serviceId?: string | null;
  providerId?: string | null;
  maxWeight?: number | null;
}

class DeliveryNetworkService {
  /** The server's message for a failed call, or a generic fallback. */
  private static reason(err: unknown, fallback: string): string {
    if (isApiError(err) && err.message) return err.message;
    if (err instanceof Error && err.message) return err.message;
    return fallback;
  }

  /**
   * PORT/HUB MANAGEMENT
   */

  async getPorts(params: Record<string, string | number | boolean | null | undefined> = {}) {
    try {
      const data = await http.get<{ ports?: NetworkPort[]; total?: number }>('/delivery/port', { params });
      return { ports: data?.ports ?? [], total: data?.total ?? 0 };
    } catch (err) {
      throw new Error(`Failed to fetch ports: ${DeliveryNetworkService.reason(err, 'Unknown error')}`);
    }
  }

  async getPort(portId: string): Promise<NetworkPort> {
    if (!portId) throw new Error('Port ID is required');
    try {
      const data = await http.get<{ port?: NetworkPort }>(`/delivery/port/${portId}`);
      return (data?.port ?? data) as NetworkPort;
    } catch (err) {
      throw new Error(`Failed to fetch port: ${DeliveryNetworkService.reason(err, 'Unknown error')}`);
    }
  }

  async createPort(portData: PortInput): Promise<NetworkPort> {
    if (!portData?.name) throw new Error('Port name is required');
    try {
      const data = await http.post<{ port?: NetworkPort }>('/delivery/port', portData);
      return (data?.port ?? data) as NetworkPort;
    } catch (err) {
      throw new Error(`Failed to create port: ${DeliveryNetworkService.reason(err, 'Unknown error')}`);
    }
  }

  async updatePort(portId: string, portData: Partial<PortInput>): Promise<NetworkPort> {
    if (!portId) throw new Error('Port ID is required');
    try {
      const data = await http.put<{ port?: NetworkPort }>(`/delivery/port/${portId}`, portData);
      return (data?.port ?? data) as NetworkPort;
    } catch (err) {
      throw new Error(`Failed to update port: ${DeliveryNetworkService.reason(err, 'Unknown error')}`);
    }
  }

  async deletePort(portId: string) {
    if (!portId) throw new Error('Port ID is required');
    try {
      const data = await http.delete<{ success?: boolean }>(`/delivery/port/${portId}`);
      return { success: data?.success !== false };
    } catch (err) {
      throw new Error(`Failed to delete port: ${DeliveryNetworkService.reason(err, 'Unknown error')}`);
    }
  }

  async getPortStats(): Promise<Record<string, unknown>> {
    try {
      const data = await http.get<{ stats?: Record<string, unknown> }>('/delivery/port/stats');
      return data?.stats ?? {};
    } catch (err) {
      throw new Error(`Failed to fetch port stats: ${DeliveryNetworkService.reason(err, 'Unknown error')}`);
    }
  }

  /**
   * ROUTE MANAGEMENT
   */

  async getRoutes(params: Record<string, string | number | boolean | null | undefined> = {}) {
    try {
      const data = await http.get<{ routes?: NetworkRoute[]; total?: number }>('/delivery/route', { params });
      return { routes: data?.routes ?? [], total: data?.total ?? 0 };
    } catch (err) {
      throw new Error(`Failed to fetch routes: ${DeliveryNetworkService.reason(err, 'Unknown error')}`);
    }
  }

  async getRoute(routeId: string): Promise<NetworkRoute> {
    if (!routeId) throw new Error('Route ID is required');
    try {
      const data = await http.get<{ route?: NetworkRoute }>(`/delivery/route/${routeId}`);
      return (data?.route ?? data) as NetworkRoute;
    } catch (err) {
      throw new Error(`Failed to fetch route: ${DeliveryNetworkService.reason(err, 'Unknown error')}`);
    }
  }

  async createRoute(routeData: RouteInput): Promise<NetworkRoute> {
    if (!routeData?.name || !routeData?.origin || !routeData?.destination) {
      throw new Error('Route name, origin, and destination are required');
    }
    try {
      const data = await http.post<{ route?: NetworkRoute }>('/delivery/route', routeData);
      return (data?.route ?? data) as NetworkRoute;
    } catch (err) {
      throw new Error(`Failed to create route: ${DeliveryNetworkService.reason(err, 'Unknown error')}`);
    }
  }

  async updateRoute(routeId: string, routeData: Partial<RouteInput>): Promise<NetworkRoute> {
    if (!routeId) throw new Error('Route ID is required');
    try {
      const data = await http.put<{ route?: NetworkRoute }>(`/delivery/route/${routeId}`, routeData);
      return (data?.route ?? data) as NetworkRoute;
    } catch (err) {
      throw new Error(`Failed to update route: ${DeliveryNetworkService.reason(err, 'Unknown error')}`);
    }
  }

  async searchRoutes(query: string): Promise<NetworkRoute[]> {
    try {
      const data = await http.get<{ routes?: NetworkRoute[] }>('/delivery/route/search', { params: { q: query } });
      return data?.routes ?? [];
    } catch (err) {
      throw new Error(`Failed to search routes: ${DeliveryNetworkService.reason(err, 'Unknown error')}`);
    }
  }

  async getRouteStats(): Promise<Record<string, unknown>> {
    try {
      const data = await http.get<{ stats?: Record<string, unknown> }>('/delivery/route/stats');
      return data?.stats ?? {};
    } catch (err) {
      throw new Error(`Failed to fetch route stats: ${DeliveryNetworkService.reason(err, 'Unknown error')}`);
    }
  }

  /**
   * DELIVERY SERVICES MANAGEMENT
   */

  async getServices(params: Record<string, string | number | boolean | null | undefined> = {}) {
    try {
      const data = await http.get<{ services?: NetworkService[]; total?: number }>('/delivery/service', { params });
      return { services: data?.services ?? [], total: data?.total ?? 0 };
    } catch (err) {
      throw new Error(`Failed to fetch delivery services: ${DeliveryNetworkService.reason(err, 'Unknown error')}`);
    }
  }

  async getService(serviceId: string): Promise<NetworkService> {
    if (!serviceId) throw new Error('Service ID is required');
    try {
      const data = await http.get<{ service?: NetworkService }>(`/delivery/service/${serviceId}`);
      return (data?.service ?? data) as NetworkService;
    } catch (err) {
      throw new Error(`Failed to fetch service: ${DeliveryNetworkService.reason(err, 'Unknown error')}`);
    }
  }

  async createService(serviceData: ServiceInput): Promise<NetworkService> {
    if (!serviceData?.name || !serviceData?.type) {
      throw new Error('Service name and type are required');
    }
    try {
      const data = await http.post<{ service?: NetworkService }>('/delivery/service', serviceData);
      return (data?.service ?? data) as NetworkService;
    } catch (err) {
      throw new Error(`Failed to create service: ${DeliveryNetworkService.reason(err, 'Unknown error')}`);
    }
  }

  async updateService(serviceId: string, serviceData: Partial<ServiceInput>): Promise<NetworkService> {
    if (!serviceId) throw new Error('Service ID is required');
    try {
      const data = await http.put<{ service?: NetworkService }>(`/delivery/service/${serviceId}`, serviceData);
      return (data?.service ?? data) as NetworkService;
    } catch (err) {
      throw new Error(`Failed to update service: ${DeliveryNetworkService.reason(err, 'Unknown error')}`);
    }
  }

  async deleteService(serviceId: string) {
    if (!serviceId) throw new Error('Service ID is required');
    try {
      const data = await http.delete<{ success?: boolean }>(`/delivery/service/${serviceId}`);
      return { success: data?.success !== false };
    } catch (err) {
      throw new Error(`Failed to delete service: ${DeliveryNetworkService.reason(err, 'Unknown error')}`);
    }
  }

  /**
   * SHIPMENT CONSOLIDATION
   */

  async getShipments(params: Record<string, string | number | boolean | null | undefined> = {}) {
    try {
      const data = await http.get<{ shipments?: NetworkShipment[]; total?: number }>('/delivery/shipments', { params });
      return { shipments: data?.shipments ?? [], total: data?.total ?? 0 };
    } catch (err) {
      throw new Error(`Failed to fetch shipments: ${DeliveryNetworkService.reason(err, 'Unknown error')}`);
    }
  }

  async getShipment(shipmentId: string): Promise<NetworkShipment> {
    if (!shipmentId) throw new Error('Shipment ID is required');
    try {
      const data = await http.get<{ shipment?: NetworkShipment }>(`/delivery/shipments/${shipmentId}`);
      return (data?.shipment ?? data) as NetworkShipment;
    } catch (err) {
      throw new Error(`Failed to fetch shipment: ${DeliveryNetworkService.reason(err, 'Unknown error')}`);
    }
  }

  async consolidateShipment(shipmentId: string, consolidationData: ConsolidationInput): Promise<NetworkShipment> {
    if (!shipmentId) throw new Error('Shipment ID is required');
    try {
      const data = await http.post<{ shipment?: NetworkShipment }>(`/delivery/shipments/${shipmentId}/consolidate`, consolidationData);
      return (data?.shipment ?? data) as NetworkShipment;
    } catch (err) {
      throw new Error(`Failed to consolidate shipment: ${DeliveryNetworkService.reason(err, 'Unknown error')}`);
    }
  }

  async getConsolidationCandidates(params: Record<string, string | number | boolean | null | undefined> = {}) {
    try {
      const data = await http.get<{ candidates?: unknown[] }>('/delivery/shipments/consolidation/candidates', { params });
      return { candidates: data?.candidates ?? [] };
    } catch (err) {
      throw new Error(`Failed to fetch consolidation candidates: ${DeliveryNetworkService.reason(err, 'Unknown error')}`);
    }
  }
}

export const deliveryNetworkService = new DeliveryNetworkService();
