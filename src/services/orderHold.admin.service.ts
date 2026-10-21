import { http } from '@/services/client/httpClient';
import { isApiError } from '@/types/api';

/**
 * Order Hold service (admin pause / release).
 *
 * Backing endpoints (commerce-service, mounted at /order-hold):
 *   POST   /order-hold                 place an order on hold { orderId, reason }
 *   GET    /order-hold/:orderId        current hold status (404 when not held)
 *   POST   /order-hold/:orderId/release  release a hold { releaseReason }
 *   GET    /order-hold/:orderId/history  hold history for the order
 *
 * A 404 from getHoldStatus is a normal "not currently held" state, so it is
 * surfaced as `null` rather than thrown — screens render an honest "not held"
 * panel instead of an error.
 */
export interface OrderHold {
  _id: string;
  orderId: string;
  reason: string;
  holdByRole?: string;
  heldBy?: string;
  createdAt?: string;
  releasedAt?: string | null;
  releaseReason?: string | null;
}

class OrderHoldService {
  /**
   * Get the active hold for an order, or null when it is not held.
   * @param {string} orderId
   * @returns {Promise<OrderHold | null>}
   */
  async getHoldStatus(orderId: string): Promise<OrderHold | null> {
    if (!orderId) throw new Error('Order ID is required');

    try {
      const data = await http.get<OrderHold>(`/order-hold/${orderId}`);
      return data ?? null;
    } catch (err) {
      // The client raises `ApiError`, whose status lives on `statusCode` — the
      // old `err.status` was always undefined, so a "not held" order (a 404)
      // threw instead of returning null and the panel showed an error.
      const status = isApiError(err) ? err.statusCode : undefined;
      // 404 == not currently on hold (normal state, not an error).
      if (status === 404) return null;
      throw new Error(
        `Failed to fetch order hold status: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Place an order on hold with a reason.
   * @param {string} orderId
   * @param {string} reason
   * @returns {Promise<OrderHold>}
   */
  async holdOrder(orderId: string, reason: string): Promise<OrderHold> {
    if (!orderId || !reason) {
      throw new Error('Order ID and reason are required');
    }

    try {
      const data = await http.post<OrderHold>('/order-hold', {
        orderId,
        reason,
        holdByRole: 'ADMIN',
      });
      return data;
    } catch (err) {
      throw new Error(`Failed to hold order: ${(err as Error).message}`);
    }
  }

  /**
   * Release an active hold.
   * @param {string} orderId
   * @param {string} releaseReason
   * @returns {Promise<OrderHold>}
   */
  async releaseHold(
    orderId: string,
    releaseReason = 'Released'
  ): Promise<OrderHold> {
    if (!orderId) throw new Error('Order ID is required');

    try {
      const data = await http.post<OrderHold>(
        `/order-hold/${orderId}/release`,
        { releaseReason }
      );
      return data;
    } catch (err) {
      throw new Error(`Failed to release order: ${(err as Error).message}`);
    }
  }

  /**
   * Full hold history for an order (released and active holds).
   * @param {string} orderId
   * @returns {Promise<OrderHold[]>}
   */
  async getHoldHistory(orderId: string): Promise<OrderHold[]> {
    if (!orderId) throw new Error('Order ID is required');

    try {
      const data = await http.get<{ history?: OrderHold[] }>(
        `/order-hold/${orderId}/history`
      );
      return data?.history ?? [];
    } catch (err) {
      throw new Error(
        `Failed to fetch order hold history: ${(err as Error).message}`
      );
    }
  }
}

export const orderHoldService = new OrderHoldService();