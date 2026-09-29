/** Delivery requests admin service (delivery-service route: GET/POST /delivery/request).

Backend contract:
  GET /delivery/request?page&limit&search&sellerId&buyerId&orderId&serviceId&zoneId&sectorId&dateFrom&dateTo
    -> { requests, count, total, page, limit, totalPages }
    each request carries `status` ('pending' | 'materialized'), `deliveryId`
    and `deliveryStatus` — derived from whether a Delivery exists for the order.
  POST /delivery/request                              -> 201 + { request }
*/

import { http } from '@/services/client/httpClient';

export interface DeliveryRequestItem {
  name: string;
  weight: number;
  quantity: number;
  value: number;
}

/** Materialization state of a handoff: a Delivery exists or is still pending. */
export type DeliveryRequestState = 'pending' | 'materialized';

export interface DeliveryRequest {
  orderId: string;
  sellerId: string;
  buyerId: string;
  pickupLocationId: string | null;
  destinationLocationId: string | null;
  pickupAddress: {
    regionName: string;
    areaName: string;
    cityName: string;
    sectorName: string;
    shopId: string | null;
    shopName: string;
    businessId: string | null;
    addressDetail: string;
    landmark: string;
    building: string;
    contactName: string;
    contactPhone: string;
  };
  deliveryAddress: {
    regionName: string;
    areaName: string;
    cityName: string;
    sectorName: string;
    addressDetail: string;
    landmark: string;
    building: string;
    contactName: string;
    contactPhone: string;
    additionalInstructions: string;
  };
  items: DeliveryRequestItem[];
  totalValue: number;
  totalWeight: number;
  preferredServiceId: string | null;
  specialInstructions: string;
  requestedAt: string;
  /** Server-derived — do not send back. */
  status?: DeliveryRequestState;
  deliveryId?: string | null;
  deliveryStatus?: string | null;
}

export interface DeliveryRequestsListResponse {
  success: boolean;
  requests?: DeliveryRequest[];
  count?: number;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface DeliveryRequestRequest extends DeliveryRequest {
  id: string;
  sellerName?: string;
  buyerName?: string;
  buyerPhone?: string;
  shopName?: string;
}

export const deliveryRequestsService = {
  /** List requests (backend: GET /delivery/request) with real pagination meta. */
  async list(params: {
    page?: number;
    limit?: number;
    sellerId?: string;
    buyerId?: string;
    orderId?: string;
    serviceId?: string;
    zoneId?: string;
    sectorId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }): Promise<DeliveryRequestsListResponse> {
    const res = await http.get<DeliveryRequestsListResponse>('/delivery/request', { params: params as never });
    return res ?? { requests: [] };
  },

  /** Single request (backend: GET /delivery/request/:id) */
  async get(id: string): Promise<DeliveryRequest | null> {
    const res = await http.get<{ success: boolean; request?: DeliveryRequest }>(`/delivery/request/${id}`);
    return res?.request ?? null;
  },
};
