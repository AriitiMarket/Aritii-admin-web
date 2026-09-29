/**
 * Delivery service catalog — list + admin management.
 *
 * Mirrors /delivery/service:
 *   GET    /delivery/service        paginated catalog (search/status/type)
 *   POST   /delivery/service        create
 *   PUT    /delivery/service/:id    edit fields / change status
 *   DELETE /delivery/service/:id    delete (backend blocks while providers
 *                                   are still linked to the service)
 */
import { http } from '@/services/client/httpClient';

export type DeliveryServiceStatus = 'active' | 'inactive' | 'suspended';

export const DELIVERY_SERVICE_TYPES = [
  { value: 'standard', label: 'Standard' },
  { value: 'express', label: 'Express' },
  { value: 'same_day', label: 'Same day' },
  { value: 'next_day', label: 'Next day' },
  { value: 'rural', label: 'Rural' },
  { value: 'scheduled', label: 'Scheduled' },
] as const;

export const DELIVERY_SERVICE_STATUSES: { value: DeliveryServiceStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];

export interface DeliveryService {
  _id: string;
  name: string;
  code: string;
  description?: string;
  status: DeliveryServiceStatus;
  serviceType: string;
  baseFee: number;
  perKmFee: number;
  maxWeightKg: number;
  estimatedDurationMinutes: number;
  coverageZones?: string[];
}

export type DeliveryServiceInput = {
  name: string;
  code: string;
  description?: string;
  serviceType: string;
  status: DeliveryServiceStatus;
  baseFee: number;
  perKmFee: number;
  maxWeightKg: number;
  estimatedDurationMinutes: number;
  coverageZones: string[];
};

export interface DeliveryServiceListResult {
  items: DeliveryService[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const deliveryServicesService = {
  list(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    serviceType?: string;
  }): Promise<DeliveryServiceListResult> {
    return http
      .get<{
        success: boolean;
        services?: DeliveryService[];
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
      }>('/delivery/service', { params: params as never })
      .then((res) => ({
        items: res.services ?? [],
        total: res.total ?? 0,
        page: res.page ?? params?.page ?? 1,
        limit: res.limit ?? params?.limit ?? 50,
        totalPages: res.totalPages ?? 0,
      }));
  },

  create(data: DeliveryServiceInput): Promise<DeliveryService> {
    return http
      .post<{ success: boolean; service: DeliveryService }>('/delivery/service', data)
      .then((res) => res.service);
  },

  update(id: string, data: Partial<DeliveryServiceInput>): Promise<DeliveryService> {
    return http
      .put<{ success: boolean; service: DeliveryService }>(`/delivery/service/${id}`, data)
      .then((res) => res.service);
  },

  remove(id: string): Promise<{ success: boolean; service?: DeliveryService }> {
    return http.delete<{ success: boolean; service?: DeliveryService }>(`/delivery/service/${id}`);
  },
};
