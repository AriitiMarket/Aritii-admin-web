/**
 * Multi-order assignment ("dispatch") API.
 *
 * Backs the full admin workflow:
 *   ready orders -> select many -> assign to one rider -> track -> reassign
 *
 * Every request goes through the API gateway, same as the rest of the admin web.
 */
import { http } from '@/services/client/httpClient';

export type AssignmentStatus =
  | 'waiting_acceptance'
  | 'accepted'
  | 'picking_up'
  | 'picked_up'
  | 'in_transit'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export type OrderDeliveryStatus =
  | 'pending'
  | 'assigned'
  | 'pickup'
  | 'in_transit'
  | 'delivered'
  | 'failed'
  | 'cancelled'
  | 'reassigned';

/** An order the admin may select right now (Ready for Pickup, unassigned). */
export interface ReadyOrder {
  id: string;
  orderId: string;
  sellerId: string;
  sellerName: string;
  shopName: string;
  pickup: string;
  customer: string;
  zoneId: string | null;
  zoneName: string;
  status: OrderDeliveryStatus;
  createdAt: string;
}

export interface ReadyOrdersResult {
  orders: ReadyOrder[];
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BatchOrder {
  deliveryId: string;
  orderId: string;
  sellerId: string;
  sellerName: string;
  shopName: string;
  status: OrderDeliveryStatus;
}

export interface PickupStop {
  sequence: number;
  sellerId: string;
  sellerName: string;
  shopName: string;
  address: Record<string, string> | null;
  orderIds: string[];
  completed: boolean;
  completedAt: string | null;
}

export interface AssignmentHistoryEntry {
  status: AssignmentStatus;
  at: string;
  actorId: string | null;
  actorName: string;
  note: string;
}

export interface Rider {
  _id: string;
  name: string;
  phone: string;
  vehicleType: string;
  status: string;
  rating?: number;
  activeDeliveries?: number;
  maxActiveAssignments?: number;
}

export interface AssignmentBatch {
  _id: string;
  reference: string;
  partnerId: string;
  partnerName: string;
  serviceId: string | null;
  routeId: string | null;
  zoneIds: string[];
  status: AssignmentStatus;
  deliveries: BatchOrder[];
  pickupPlan: PickupStop[];
  assignedAt: string;
  respondedAt: string | null;
  completedAt: string | null;
  cancellationReason: string;
  rejectionReason: string;
  notes: string;
  reassignedFromId: string | null;
  reassignedToId: string | null;
  history: AssignmentHistoryEntry[];
  partner?: Rider | null;
}

export interface AssignmentListResult {
  assignments: AssignmentBatch[];
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateBatchInput {
  deliveryIds: string[];
  partnerId: string;
  routeId?: string;
  notes?: string;
}

export const dispatchService = {
  /** Orders that are ready and not held by an active assignment. */
  async listReadyOrders(params: {
    page?: number;
    limit?: number;
    search?: string;
    zoneId?: string;
  }): Promise<ReadyOrdersResult> {
    const res = await http.get<{
      success: boolean;
      orders?: ReadyOrder[];
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
    }>('/delivery/dispatch/ready-orders', { params: params as never });

    const orders = res.orders ?? [];
    return {
      orders,
      count: orders.length,
      total: res.total ?? orders.length,
      page: res.page ?? params.page ?? 1,
      limit: res.limit ?? params.limit ?? 20,
      totalPages: res.totalPages ?? 1,
    };
  },

  /** Assign many ready orders to one rider in a single operation. */
  async assign(input: CreateBatchInput): Promise<AssignmentBatch> {
    const res = await http.post<{ success: boolean; assignment: AssignmentBatch }>(
      '/delivery/dispatch/batches',
      input as unknown as Record<string, unknown>
    );
    return res.assignment;
  },

  async list(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<AssignmentListResult> {
    const res = await http.get<{
      success: boolean;
      assignments?: AssignmentBatch[];
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
    }>('/delivery/dispatch/batches', { params: params as never });

    const assignments = res.assignments ?? [];
    return {
      assignments,
      count: assignments.length,
      total: res.total ?? assignments.length,
      page: res.page ?? params.page ?? 1,
      limit: res.limit ?? params.limit ?? 20,
      totalPages: res.totalPages ?? 1,
    };
  },

  async get(id: string): Promise<AssignmentBatch> {
    const res = await http.get<{ success: boolean; assignment: AssignmentBatch }>(
      `/delivery/dispatch/batches/${id}`
    );
    return res.assignment;
  },

  /**
   * Move this assignment to another rider. The previous assignment is kept in
   * history and linked forward — it is never silently duplicated.
   */
  async reassign(id: string, partnerId: string, reason?: string): Promise<AssignmentBatch> {
    const res = await http.post<{
      success: boolean;
      assignment: AssignmentBatch;
      previous: AssignmentBatch;
    }>(`/delivery/dispatch/batches/${id}/reassign`, { partnerId, reason });
    return res.assignment;
  },

  async cancel(id: string, reason?: string): Promise<AssignmentBatch> {
    const res = await http.post<{ success: boolean; assignment: AssignmentBatch }>(
      `/delivery/dispatch/batches/${id}/cancel`,
      { reason }
    );
    return res.assignment;
  },
};
