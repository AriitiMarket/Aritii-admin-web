import { httpClient } from './client/httpClient';

export interface ReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Return {
  _id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  shopId: string;
  reason: 'DAMAGED' | 'WRONG_ITEM' | 'NOT_AS_DESCRIBED' | 'DEFECTIVE' | 'OTHER';
  description: string;
  items: ReturnItem[];
  returnAmount: number;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'PICKED_UP' | 'RETURNED' | 'REFUNDED';
  requestedAt: string;
  approvedAt?: string;
  refundedAt?: string;
}

export interface ReturnsResponse {
  returns: Return[];
  total: number;
  page: number;
  limit: number;
}

export const returnsService = {
  // List all returns
  async listReturns(
    page = 1,
    limit = 20,
    status?: string,
    buyerId?: string,
    sellerId?: string
  ): Promise<ReturnsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) params.append('status', status);
    if (buyerId) params.append('buyerId', buyerId);
    if (sellerId) params.append('sellerId', sellerId);

    const { data } = await httpClient.get(`/return/admin/list?${params.toString()}`);
    return data;
  },

  // Get return details
  async getReturn(returnId: string): Promise<Return> {
    const { data } = await httpClient.get(`/return/${returnId}`);
    return data.return;
  },

  // Approve return
  async approveReturn(returnId: string, notes?: string): Promise<Return> {
    const { data } = await httpClient.post(`/return/${returnId}/approve`, { notes });
    return data.return;
  },

  // Reject return
  async rejectReturn(returnId: string, rejectionReason: string): Promise<Return> {
    const { data } = await httpClient.post(`/return/${returnId}/reject`, {
      rejectionReason,
    });
    return data.return;
  },

  // Process refund
  async processRefund(returnId: string, paymentId: string): Promise<Return> {
    const { data } = await httpClient.post(`/return/${returnId}/refund`, { paymentId });
    return data.return;
  },

  // Get returns statistics
  async getStats(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const { data } = await httpClient.get(`/return/admin/stats?${params.toString()}`);
    return data;
  },
};
