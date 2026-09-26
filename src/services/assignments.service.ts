/** Delivery Assignment service facade. */
import { http } from '@/services/client/httpClient';

export interface Assignment {
  id: string;
  deliveryId: string;
  partnerId: string;
  partnerName?: string;
  serviceId?: string;
  zoneId?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
  assignedAt: string;
  respondedAt?: string;
  expiresAt?: string;
  rejectionReason: string;
  notes: string;
}

export interface AssignmentResult {
  assignments: Assignment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AssignmentCreate {
  [key: string]: unknown;
  deliveryId: string;
  partnerId: string;
  serviceId?: string;
  zoneId?: string;
  notes?: string;
}

export const assignmentsService = {
  async list(params?: { page?: number; limit?: number; status?: string; partnerId?: string }): Promise<AssignmentResult> {
    return http
      .get<{ success: boolean; assignments: Assignment[]; total: number; page: number; limit: number; totalPages: number }>(
        '/delivery/assignment',
        { params: params as never }
      )
      .then((res) => ({
        assignments: res.assignments || [],
        total: res.total || 0,
        page: res.page || 1,
        limit: res.limit || 50,
        totalPages: res.totalPages || 0,
      }));
  },

  async get(id: string): Promise<Assignment> {
    return http
      .get<{ success: boolean; assignment: Assignment }>(`/delivery/assignment/${id}`)
      .then((res) => res.assignment);
  },

  async create(data: AssignmentCreate): Promise<Assignment> {
    return http
      .post<{ success: boolean; assignment: Assignment }>('/delivery/assignment', data)
      .then((res) => res.assignment);
  },

  async reassign(deliveryId: string, newPartnerId: string): Promise<Assignment> {
    return http
      .post<{ success: boolean; assignment: Assignment }>(
        '/delivery/assignment/reassign',
        { deliveryId, partnerId: newPartnerId }
      )
      .then((res) => res.assignment);
  },
};
