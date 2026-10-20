import { http } from '@/services/client/httpClient';

/**
 * Order Notes service (admin moderation surface).
 *
 * Backing endpoints (commerce-service, mounted at /order-notes):
 *   GET    /order-notes?orderId=..      list notes for an order
 *   POST   /order-notes                 create a note (buyer/seller/admin)
 *   PATCH  /order-notes/:noteId/pin     pin / unpin
 *   DELETE /order-notes/:noteId         soft-delete a note
 *
 * The admin console reads notes for moderation context and can pin/delete, but
 * the backend enforces that a plain DELETE may only remove the caller's OWN
 * note (see orderNotes.service.deleteNote) — admins moderate via flagging, so
 * a delete failure is surfaced to the operator rather than swallowed.
 */
export interface OrderNote {
  _id: string;
  orderId: string;
  userId: string;
  userRole: string;
  message: string;
  isPinned?: boolean;
  isInternal?: boolean;
  createdAt?: string;
  deletedAt?: string | null;
}

class OrderNotesService {
  /**
   * Fetch all (non-deleted) notes for an order, newest first.
   * @param {string} orderId
   * @returns {Promise<OrderNote[]>}
   */
  async getOrderNotes(orderId: string): Promise<OrderNote[]> {
    if (!orderId) throw new Error('Order ID is required');

    try {
      const data = await http.get<{ notes?: OrderNote[] }>(
        '/order-notes',
        { params: { orderId } }
      );
      return data?.notes ?? [];
    } catch (err) {
      throw new Error(
        `Failed to fetch order notes: ${(err as Error).message}`
      );
    }
  }

  /**
   * Add a note on behalf of the admin (used for internal annotations).
   * @param {string} orderId
   * @param {string} message
   * @param {Object} options - { isPinned?, isInternal? }
   */
  async addNote(
    orderId: string,
    message: string,
    options: { isPinned?: boolean; isInternal?: boolean } = {}
  ): Promise<OrderNote> {
    if (!orderId || !message) {
      throw new Error('Order ID and message are required');
    }

    try {
      const data = await http.post<OrderNote>('/order-notes', {
        orderId,
        message,
        isPinned: options.isPinned ?? false,
        // Admin-authored notes default to internal so they never leak into a
        // buyer/seller-facing thread.
        isInternal: options.isInternal ?? true,
      });
      return data;
    } catch (err) {
      throw new Error(`Failed to add order note: ${(err as Error).message}`);
    }
  }

  /**
   * Pin / unpin a note (surfaces it at the top of the thread).
   * @param {string} noteId
   * @param {boolean} isPinned
   */
  async setPinned(noteId: string, isPinned: boolean): Promise<OrderNote> {
    if (!noteId) throw new Error('Note ID is required');

    try {
      const data = await http.patch<OrderNote>(
        `/order-notes/${noteId}/pin`,
        { isPinned }
      );
      return data;
    } catch (err) {
      throw new Error(`Failed to pin note: ${(err as Error).message}`);
    }
  }

  /**
   * Soft-delete a note. Backend restricts deletion to the note's author.
   * @param {string} noteId
   */
  async deleteNote(noteId: string): Promise<void> {
    if (!noteId) throw new Error('Note ID is required');

    try {
      await http.delete(`/order-notes/${noteId}`);
    } catch (err) {
      throw new Error(`Failed to delete note: ${(err as Error).message}`);
    }
  }
}

export const orderNotesService = new OrderNotesService();