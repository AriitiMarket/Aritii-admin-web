/** Delivery Assignment service facade. */
import { http } from '@/services/client/httpClient';

export interface Assignment {
  id: string;
  deliveryId: string;
  providerId: string;
  partnerName?: string;
  providerName?: string;
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
  providerId: string;
  serviceId?: string;
  zoneId?: string;
  notes?: string;
}

/** A rider the admin may actually pick: available, online, under capacity and serving the delivery (MVP §8). */
export interface EligiblePartner {
  _id: string;
  name: string;
  status: string;
  rating?: number | null;
  activeDeliveries?: number;
  maxActiveAssignments?: number | null;
  zoneId?: string | null;
  sectorId?: string | null;
}

export const assignmentsService = {
  /** Eligible riders for a delivery (or for a zone/service pair). */
  async eligiblePartners(params: {
    deliveryId?: string;
    zoneId?: string;
    serviceId?: string;
    sectorId?: string;
  } = {}): Promise<EligiblePartner[]> {
    return http
      .get<{ success: boolean; providers?: EligiblePartner[]; partners?: EligiblePartner[]; count?: number }>(
        '/delivery/assignment/eligible-partners',
        { params: params as never }
      )
      .then((res) => res.providers ?? res.partners ?? []);
  },

  async list(params?: { page?: number; limit?: number; status?: string; providerId?: string }): Promise<AssignmentResult> {
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

  async reassign(deliveryId: string, newProviderId: string): Promise<Assignment> {
    return http
      .post<{ success: boolean; assignment: Assignment }>(
        '/delivery/assignment/reassign',
        { deliveryId, providerId: newProviderId }
      )
      .then((res) => res.assignment);
  },
};
