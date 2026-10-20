import { http } from '@/services/client/httpClient';
import { isApiError } from '@/types/api';

/**
 * Payment Ledger admin service — audit platform payment movements.
 *
 * Backing endpoints (commerce-service, mounted at /payment-ledger):
 *   GET /payment-ledger/:paymentId            payment history
 *   GET /payment-ledger/:paymentId/audit      audit (ADMIN)
 *   GET /payment-ledger/failed                failed payments (ADMIN)
 *   GET /payment-ledger/stats                 ledger stats (ADMIN)
 *
 * Controllers return rows directly (not `{ success, data }` envelopes).
 */
export interface PaymentLedgerEntry {
  _id?: string;
  id?: string;
  transactionId?: string;
  orderId?: string;
  orderRef?: string;
  paymentId?: string;
  paymentMethod?: string;
  sellerId?: string;
  sellerName?: string;
  amount?: number;
  commission?: number;
  commissionRate?: number;
  netAmount?: number;
  processingFee?: number;
  tax?: number;
  currency?: string;
  status?: string;
  type?: string;
  notes?: string;
  date?: string;
  createdAt?: string;
}

export interface PaymentLedgerStats {
  totalPayments?: number;
  totalVolume?: number;
  failedCount?: number;
  pendingCount?: number;
  completedCount?: number;
}

/** A commission booked on the commission ledger. */
export interface CommissionLedgerEntry {
  _id?: string;
  id?: string;
  sellerId?: string;
  sellerName?: string;
  orderId?: string;
  amount?: number;
  commission?: number;
  status?: string;
  createdAt?: string;
}

/** Aggregated reconciliation report. */
export interface ReconciliationReport {
  total?: number;
  matched?: number;
  unmatched?: number;
  discrepancies?: number;
  generatedAt?: string;
}

/** Filters accepted by the ledger endpoints. */
export type LedgerFilters = {
  page: number;
  limit: number;
  status: string | null;
  sellerId: string | null;
  dateFrom: string | null;
  dateTo: string | null;
};

/** Query parameters accepted by the ledger endpoints. */
export type LedgerParams = Record<
  string,
  string | number | boolean | null | undefined
>;

class PaymentLedgerAdminService {
  /** Payment history for one payment. */
  async getPaymentHistory(paymentId: string): Promise<PaymentLedgerEntry | null> {
    if (!paymentId) throw new Error('Payment ID is required');
    const res = await http.get<PaymentLedgerEntry | null>(`/payment-ledger/${paymentId}`);
    return res ?? null;
  }

  /** Audit trail for one payment (ADMIN). */
  async auditPayment(paymentId: string): Promise<{
    paymentId: string; entries: PaymentLedgerEntry[]; createdAt?: string;
  }> {
    if (!paymentId) throw new Error('Payment ID is required');
    const res = await http.get<{
      paymentId: string; entries: PaymentLedgerEntry[]; createdAt?: string;
    }>(`/payment-ledger/${paymentId}/audit`);
    return res;
  }

  /** Failed payments (ADMIN). */
  async getFailedPayments(): Promise<PaymentLedgerEntry[]> {
    const res = await http.get<PaymentLedgerEntry[]>('/payment-ledger/failed');
    return res ?? [];
  }

  /** Ledger summary stats (ADMIN). */
  async getLedgerStats(): Promise<PaymentLedgerStats> {
    const res = await http.get<PaymentLedgerStats>('/payment-ledger/stats');
    return res ?? {};
  }
}

export const paymentLedgerAdminService = new PaymentLedgerAdminService();

class PaymentLedgerService {
  /** The server's message for a failed call, or a generic fallback. */
  private static reason(err: unknown, fallback: string): string {
    if (isApiError(err) && err.message) return err.message;
    if (err instanceof Error && err.message) return err.message;
    return fallback;
  }

  /**
   * Get payment ledger with filters
   * @param params - Query params (page, limit, sellerId, status, etc)
   */
  async getLedger(
    params: LedgerParams = {}
  ): Promise<{ ledger: PaymentLedgerEntry[]; total: number; pages: number }> {
    try {
      const data = await http.get<{
        ledger?: PaymentLedgerEntry[];
        transactions?: PaymentLedgerEntry[];
        total?: number;
        pages?: number;
      }>('/payment-ledger', { params });
      return {
        ledger: data?.ledger || data?.transactions || [],
        total: data?.total || 0,
        pages: data?.pages || 0,
      };
    } catch (err) {
      throw new Error(
        `Failed to fetch payment ledger: ${PaymentLedgerService.reason(err, 'Unknown error')}`
      );
    }
  }

  /**
   * Get ledger entry details
   * @param entryId - Entry ID
   */
  async getEntry(entryId: string): Promise<PaymentLedgerEntry> {
    if (!entryId) throw new Error('Entry ID is required');

    try {
      const data = await http.get<
        PaymentLedgerEntry & { entry?: PaymentLedgerEntry }
      >(`/payment-ledger/${entryId}`);
      return data?.entry || data;
    } catch (err) {
      throw new Error(
        `Failed to fetch ledger entry: ${PaymentLedgerService.reason(err, 'Unknown error')}`
      );
    }
  }

  /**
   * Get commission ledger
   * @param params - Query params
   */
  async getCommissionLedger(
    params: LedgerParams = {}
  ): Promise<{ ledger: CommissionLedgerEntry[]; total: number }> {
    try {
      const data = await http.get<{
        ledger?: CommissionLedgerEntry[];
        commissions?: CommissionLedgerEntry[];
        total?: number;
      }>('/commission-ledger', { params });
      return {
        ledger: data?.ledger || data?.commissions || [],
        total: data?.total || 0,
      };
    } catch (err) {
      throw new Error(
        `Failed to fetch commission ledger: ${PaymentLedgerService.reason(err, 'Unknown error')}`
      );
    }
  }

  /**
   * Get seller commissions
   * @param sellerId - Seller ID
   * @param params - Query params
   */
  async getSellerCommissions(
    sellerId: string,
    params: LedgerParams = {}
  ): Promise<{ commissions: CommissionLedgerEntry[]; total: number }> {
    if (!sellerId) throw new Error('Seller ID is required');

    try {
      const data = await http.get<{
        commissions?: CommissionLedgerEntry[];
        total?: number;
      }>(`/commission-ledger/seller/${sellerId}`, { params });
      return {
        commissions: data?.commissions || [],
        total: data?.total || 0,
      };
    } catch (err) {
      throw new Error(
        `Failed to fetch seller commissions: ${PaymentLedgerService.reason(err, 'Unknown error')}`
      );
    }
  }

  /**
   * Get payment reconciliation report
   * @param params - Query params
   */
  async getReconciliation(
    params: LedgerParams = {}
  ): Promise<ReconciliationReport> {
    try {
      const data = await http.get<
        ReconciliationReport & { reconciliation?: ReconciliationReport }
      >('/payment-reconciliation', { params });
      return data?.reconciliation || data;
    } catch (err) {
      throw new Error(
        `Failed to fetch reconciliation: ${PaymentLedgerService.reason(err, 'Unknown error')}`
      );
    }
  }

  /**
   * Trigger manual reconciliation
   */
  async triggerReconciliation(): Promise<{
    success: boolean;
    report: ReconciliationReport;
  }> {
    try {
      const data = await http.post<
        ReconciliationReport & { success?: boolean; report?: ReconciliationReport }
      >('/payment-reconciliation/trigger', {});
      return {
        success: data?.success !== false,
        report: data?.report || data,
      };
    } catch (err) {
      throw new Error(
        `Failed to trigger reconciliation: ${PaymentLedgerService.reason(err, 'Unknown error')}`
      );
    }
  }

  /**
   * Export ledger as CSV/PDF
   * @param params - Query and export params
   */
  async exportLedger(params: LedgerParams = {}): Promise<Blob> {
    try {
      const response = await http.get<{ data: Blob }>('/payment-ledger/export', {
        params,
        responseType: 'blob',
      });
      return response.data;
    } catch (err) {
      throw new Error(
        `Failed to export ledger: ${PaymentLedgerService.reason(err, 'Unknown error')}`
      );
    }
  }
}

export const paymentLedgerService = new PaymentLedgerService();
