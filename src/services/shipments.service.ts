import { http } from '@/services/client/httpClient';

export interface ShipmentItem {
  id: string;
  deliveryId: string;
  label: string;
  quantity: number;
  weight: number;
  value: number;
}

export interface ShipmentLocation {
  id: string;
  name: string;
  sectorName: string;
  cityName: string;
  regionName: string;
}

export interface ShipmentRoute {
  id: string;
  name: string;
}

export interface ShipmentCapacity {
  usedItems: number;
  maxItems: number;
  usedWeight: number;
  maxWeight: number;
}

export interface Shipment {
  id: string;
  shipmentNumber: string;
  status: ShipmentStatus;
  originLocationId: string;
  destinationLocationId: string;
  hubId: string;
  orderId: string;
  deliveryId: string;
  serviceId: string;
  providerId: string;
  totalWeight: number;
  totalValue: number;
  items: ShipmentItem[];
  createdAt: string;
  updatedAt: string;
  originName?: string;
  destinationName?: string;
  routeName?: string;
  route?: ShipmentRoute;
  capacity?: ShipmentCapacity;
}

export interface ShipmentListResponse {
  shipments: Shipment[];
  count: number;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface ConsolidationCandidate {
  id: string;
  groupName: string;
  originLocationId: string;
  destinationLocationId: string;
  serviceId?: string;
  deliveryIds: string[];
  deliveryCount: number;
  /** Display names + the compatibility reason, resolved server-side (§18). */
  originName?: string;
  destinationName?: string;
  serviceName?: string;
  reason?: string;
  totalWeight?: number;
  orderIds?: string[];
}

export interface ConsolidationCandidatesResponse {
  candidates: ConsolidationCandidate[];
}

export interface ConsolidationResultResponse {
  shipment: Shipment;
}

export type ShipmentStatus =
  | 'planning'
  | 'ready'
  | 'dispatched'
  | 'in_transit'
  | 'arrived'
  | 'receiving'
  | 'received'
  | 'completed'
  | 'cancelled'
  | 'failed'
  | 'returned';

export const shipmentsService = {
  /** List shipments (backend: GET /delivery/shipments?page&limit&status&shipmentNumber&routeId...) */
  async list(params: {
    page?: number;
    limit?: number;
    status?: ShipmentStatus;
    shipmentNumber?: string;
    routeId?: string;
    originLocationId?: string;
    destinationLocationId?: string;
    hubId?: string;
    serviceId?: string;
    providerId?: string;
    orderId?: string;
    deliveryId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ShipmentListResponse> {
    const res = await http.get<ShipmentListResponse>('/delivery/shipments', { params: params as never });
    return res ?? { shipments: [], count: 0 };
  },

  /** Single shipment (backend: GET /delivery/shipments/:id) */
  async get(id: string): Promise<Shipment | null> {
    const res = await http.get<{ success: boolean; shipment?: Shipment }>(`/delivery/shipments/${id}`);
    return res?.shipment ?? null;
  },

  /** Advance a shipment to the next operational stage (backend: POST /delivery/shipments/:id/{dispatch,arrive,receive}) */
  async transition(id: string, action: 'dispatch' | 'arrive' | 'receive', note?: string): Promise<{ success: boolean; shipment?: Shipment }> {
    const res = await http.post<{ success: boolean; shipment?: Shipment }>(
      `/delivery/shipments/${id}/${action}`,
      { note }
    );
    return res ?? { success: false };
  },

  /** Candidate groups for consolidation (backend: GET /delivery/shipments/consolidation/candidates) */
  async getCandidates(filter?: {
    originLocationId?: string;
    destinationLocationId?: string;
    serviceId?: string;
  }): Promise<ConsolidationCandidatesResponse> {
    const res = await http.get<ConsolidationCandidatesResponse>('/delivery/shipments/consolidation/candidates', {
      params: filter as never,
    });
    return res ?? { candidates: [] };
  },

  /** Create a shipment by consolidating a set of deliveries (backend: POST /delivery/shipments) */
  async consolidate(body: {
    deliveryIds: string[];
    originLocationId?: string;
    destinationLocationId?: string;
    originHubId?: string;
    destinationHubId?: string;
    routeId?: string;
    serviceId?: string;
    providerId?: string;
    maxWeight?: number;
  }): Promise<ConsolidationResultResponse> {
    const res = await http.post<ConsolidationResultResponse>('/delivery/shipments', body);
    return res ?? { shipment: { id: '', shipmentNumber: '', status: 'pending', originLocationId: '', destinationLocationId: '', hubId: '', orderId: '', deliveryId: '', serviceId: '', providerId: '', totalWeight: 0, totalValue: 0, items: [], createdAt: '', updatedAt: '', originName: '', destinationName: '', routeName: '', route: undefined, capacity: undefined } };
  },
};
