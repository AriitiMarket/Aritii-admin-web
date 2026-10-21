import { http } from '@/services/client/httpClient';

/**
 * Commission Ledger admin service — audit platform commission movements.
 *
 * Backing endpoints (commerce-service, mounted at /commission-ledger):
 *   GET /commission-ledger/seller/:sellerId          history (with limit/offset/startDate/endDate)
 *   GET /commission-ledger/seller/:sellerId/period   totals for a period
 *   GET /commission-ledger/seller/:sellerId/audit    full audit (ADMIN only)
 *   GET /commission-ledger/seller/:sellerId/by-reason breakdown by reason
 *
 * Controllers return rows directly (not `{ success, data }` envelopes).
 */
export interface CommissionEntry {
  _id?: string;
  id?: string;
  orderId?: string;
  sellerId: string;
  grossSubtotal?: number;
  shippingFee?: number;
  taxAmount?: number;
  discountAmount?: number;
  commissionRate?: number;
  platformCommission?: number;
  netPayable?: number;
  allocationId?: string;
  reason?: string;
  createdAt?: string;
}

export interface CommissionTotals {
  sellerId?: string;
  period?: { startDate?: string; endDate?: string };
  totalCommission?: number;
  totalOrders?: number;
  totalGross?: number;
}

export interface CommissionAudit {
  sellerId?: string;
  period?: { startDate?: string; endDate?: string };
  entries?: CommissionEntry[];
  totals?: CommissionTotals;
  byReason?: Array<{ reason: string; commission: number; count: number }>;
}

class CommissionLedgerAdminService {
  /** Commission history for a seller (paginated, optional date range). */
  async getCommissionHistory(sellerId: string, params?: {
    limit?: number; offset?: number; startDate?: string; endDate?: string;
  }): Promise<{ sellerId: string; history: CommissionEntry[]; limit: number; offset: number }> {
    if (!sellerId) throw new Error('Seller ID is required');
    const res = await http.get<{
      sellerId: string; history: CommissionEntry[]; limit: number; offset: number;
    }>(`/commission-ledger/seller/${sellerId}`, { params });
    return res;
  }

  /** Total commission for a seller over a period. */
  async getTotalCommissionForPeriod(sellerId: string, params?: {
    startDate?: string; endDate?: string;
  }): Promise<CommissionTotals> {
    if (!sellerId) throw new Error('Seller ID is required');
    const res = await http.get<CommissionTotals>(
      `/commission-ledger/seller/${sellerId}/period`,
      { params }
    );
    return res;
  }

  /** Full commission audit for a seller (ADMIN). */
  async auditCommissions(sellerId: string, params?: {
    startDate?: string; endDate?: string;
  }): Promise<CommissionAudit> {
    if (!sellerId) throw new Error('Seller ID is required');
    const res = await http.get<CommissionAudit>(
      `/commission-ledger/seller/${sellerId}/audit`,
      { params }
    );
    return res;
  }

  /** Commission breakdown by reason for a seller. */
  async getCommissionByReason(sellerId: string): Promise<{
    sellerId: string; breakdown: Array<{ reason: string; commission: number; count: number }>;
  }> {
    if (!sellerId) throw new Error('Seller ID is required');
    const res = await http.get<{
      sellerId: string; breakdown: Array<{ reason: string; commission: number; count: number }>;
    }>(`/commission-ledger/seller/${sellerId}/by-reason`);
    return res;
  }
}

export const commissionLedgerAdminService = new CommissionLedgerAdminService();