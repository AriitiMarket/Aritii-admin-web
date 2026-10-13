/** Delivery Assignment service facade. */
import { http } from '@/services/client/httpClient';

export interface Assignment {
  /** Document id; the API may send it as `id` or as the raw `_id`. */
  id?: string;
  _id?: string;
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
  /** Force assignment (outside the delivery Zone/Port) — reason is REQUIRED. */
  forceAssignment?: boolean;
  reason?: string;
}

/**
 * A rider the admin may actually pick: available, online, under capacity and
 * serving the delivery's Zone/Port (MVP §8). In force mode the same shape comes
 * back for providers OUTSIDE the area, flagged by `inCoverage`.
 */
export interface EligiblePartner {
  _id: string;
  name: string;
  status: string;
  /** Read-only availability (provider/system controlled, never admin-set). */
  isOnline?: boolean;
  rating?: number | null;
  activeDeliveries?: number;
  maxActiveAssignments?: number | null;
  zoneId?: string | null;
  zoneName?: string | null;
  portId?: string | null;
  portName?: string | null;
  /** False = outside the delivery's Zone/Port (only in the force list). */
  inCoverage?: boolean;
}

export const assignmentsService = {
  /**
   * Eligible riders for a delivery (or for a zone/service pair).
   *
   * Normal call: only providers eligible for the delivery's SAME Zone/Port.
   * `force: true`: every otherwise-eligible active provider, wherever they
   * operate — the pool behind the admin's explicit "Force Assign".
   */
  async eligiblePartners(params: {
    deliveryId?: string;
    zoneId?: string;
    serviceId?: string;
    sectorId?: string;
    force?: boolean;
  } = {}): Promise<EligiblePartner[]> {
    const { force, ...rest } = params;
    const query: Record<string, unknown> = { ...rest };
    if (force) query.force = 'true';
    return http
      .get<{ success: boolean; providers?: EligiblePartner[]; partners?: EligiblePartner[]; count?: number }>(
        '/delivery/assignment/eligible-partners',
        { params: query as never }
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

  async reassign(
    deliveryId: string,
    newProviderId: string,
    reason?: string,
  ): Promise<Assignment> {
    return http
      .post<{ success: boolean; assignment: Assignment }>(
        '/delivery/assignment/reassign',
        {
          deliveryId,
          providerId: newProviderId,
          ...(reason ? { forceAssignment: true, reason } : {}),
        }
      )
      .then((res) => res.assignment);
  },
};
