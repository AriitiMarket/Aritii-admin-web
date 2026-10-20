/**
 * Financial Management Service
 * Admin API for wallet and payout management
 */

import { http } from './client/httpClient';

/**
 * Seller wallet as rendered by the admin console.
 *
 * The document is owned by this module; the console pages only read it.
 */
export interface Wallet {
  id: string;
  sellerId: string;
  sellerName: string;
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
  commissionPaid: number;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/** A single wallet ledger entry. */
export interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  reference: string;
  reason?: string;
  balanceAfter: number;
  createdAt: string;
}

/** Seller payout request as rendered by the admin console. */
export interface Payout {
  id: string;
  sellerId: string;
  amount: number;
  status: string;
  payoutMethod: string;
  createdAt: string;
  approvedAt?: string;
  completedAt?: string;
}

/** Platform-wide financial figures. */
export interface FinancialSummary {
  totalWallets: number;
  totalBalance: number;
  pendingBalance: number;
  currency?: string;
}

/** Aggregated payout counters for the requested window. */
export interface PayoutStatistics {
  total: number;
  pending: number;
  approved: number;
  completed: number;
  failed?: number;
}

/** List envelope shared by the wallet/payout collection endpoints. */
export interface PagedResponse<T> {
  data: T[];
  total?: number;
}

/** Query filters accepted by the wallet collection endpoints. */
export interface WalletFilters {
  status?: string;
  limit?: number;
  offset?: number;
  sellerId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

/** Query filters accepted by the wallet transaction endpoint. */
export interface TransactionFilters {
  type?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/** Query filters accepted by the payout collection endpoints. */
export interface PayoutFilters {
  status?: string;
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}

/** Body of a manual wallet balance adjustment. */
export interface WalletAdjustment {
  /** Accepts a numeric string because the form input holds raw text. */
  amount: number | string;
  type?: string;
  reason: string;
  notes?: string;
}

/** Body of a payout approval. */
export interface PayoutApproval {
  notes?: string;
  processingFee?: number;
  expectedCompletionDate?: string;
}

/** Body of a payout completion. */
export interface PayoutCompletion {
  transactionId?: string;
  transactionReference?: string;
  bankReference?: string;
  notes?: string;
}

/** Body of a payout failure report. */
export interface PayoutFailure {
  reason: string;
  code?: string;
  shouldRetry?: boolean;
  notes?: string;
}

// Correct API base paths matching backend mount points
const WALLET_API = '/wallet';
const WALLET_ADMIN_API = '/wallet/admin';
const PAYOUT_API = '/payout';
const PAYOUT_ADMIN_API = '/payout/admin';

// ==================== WALLET MANAGEMENT ====================

export const walletService = {
  /**
   * Get all seller wallets with optional filtering
   * Backend: GET /wallet/admin/wallets
   */
  async getAllWallets(filters: WalletFilters = {}): Promise<PagedResponse<Wallet>> {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.offset) params.append('offset', String(filters.offset));
    if (filters.sellerId) params.append('sellerId', filters.sellerId);
    if (filters.search) params.append('search', filters.search);
    
    const queryString = params.toString();
    const url = queryString ? WALLET_ADMIN_API + '/wallets?' + queryString : WALLET_ADMIN_API + '/wallets';
    return http.get<PagedResponse<Wallet>>(url);
  },

  /**
   * Get platform financial summary
   * Backend: GET /wallet/admin/financial-summary
   */
  async getFinancialSummary(): Promise<FinancialSummary> {
    return http.get<FinancialSummary>(WALLET_ADMIN_API + '/financial-summary');
  },

  /**
   * Get wallet by ID
   * Backend: GET /wallet/:walletId
   */
  async getWalletById(walletId: string): Promise<{ data: Wallet }> {
    return http.get<{ data: Wallet }>(WALLET_API + '/' + walletId);
  },

  /**
   * Get wallet transaction history
   * Backend: GET /wallet/:walletId/transactions
   */
  async getWalletTransactions(
    walletId: string,
    filters: TransactionFilters = {}
  ): Promise<PagedResponse<Transaction>> {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.offset) params.append('offset', String(filters.offset));

    const queryString = params.toString();
    const url = queryString
      ? WALLET_API + '/' + walletId + '/transactions?' + queryString
      : WALLET_API + '/' + walletId + '/transactions';

    return http.get<PagedResponse<Transaction>>(url);
  },

  /**
   * Suspend a seller's wallet
   * Backend: POST /wallet/admin/wallets/:walletId/suspend
   */
  async suspendWallet(walletId: string, reason: string) {
    return http.post(WALLET_ADMIN_API + '/wallets/' + walletId + '/suspend', {
      reason,
      suspendedAt: new Date().toISOString(),
      suspendedBy: 'admin'
    });
  },

  /**
   * Reactivate a suspended wallet
   * Backend: POST /wallet/admin/wallets/:walletId/reactivate
   */
  async reactivateWallet(walletId: string, reason: string) {
    return http.post(WALLET_ADMIN_API + '/wallets/' + walletId + '/reactivate', { reason });
  },

  /**
   * Make manual adjustment to wallet balance (admin only)
   * Backend: POST /wallet/admin/wallets/:walletId/adjustment
   */
  async adjustWallet(walletId: string, adjustmentData: WalletAdjustment) {
    return http.post(WALLET_ADMIN_API + '/wallets/' + walletId + '/adjustment', {
      amount: Number(adjustmentData.amount),
      type: adjustmentData.type || 'ADMIN_ADJUSTMENT',
      reason: adjustmentData.reason,
      notes: adjustmentData.notes,
      adjustedBy: 'admin',
      adjustedAt: new Date().toISOString()
    });
  },

  /**
   * Export wallet data to CSV
   * Backend: GET /wallet/admin/wallets/export
   */
  async exportWalletData(filters: WalletFilters = {}) {
    const params = new URLSearchParams({ format: 'csv' });
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    return http.get(WALLET_ADMIN_API + '/wallets/export?' + params.toString());
  }
};

// ==================== PAYOUT MANAGEMENT ====================

export const payoutService = {
  /**
   * Get pending payouts
   * Backend: GET /payout/admin/payouts/pending
   */
  async getPendingPayouts(filters: PayoutFilters = {}): Promise<PagedResponse<Payout>> {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.offset) params.append('offset', String(filters.offset));
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const queryString = params.toString();
    const url = queryString
      ? PAYOUT_ADMIN_API + '/payouts/pending?' + queryString
      : PAYOUT_ADMIN_API + '/payouts/pending';

    return http.get<PagedResponse<Payout>>(url);
  },

  /**
   * Get all payouts with filtering
   * Backend: GET /payout/admin/payouts
   */
  async getAllPayouts(filters: PayoutFilters = {}): Promise<PagedResponse<Payout>> {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.offset) params.append('offset', String(filters.offset));
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const queryString = params.toString();
    const url = queryString
      ? PAYOUT_ADMIN_API + '/payouts?' + queryString
      : PAYOUT_ADMIN_API + '/payouts';

    return http.get<PagedResponse<Payout>>(url);
  },

  /**
   * Get payout detail
   * Backend: GET /payout/:payoutId
   */
  async getPayoutDetail(payoutId: string): Promise<{ data: Payout }> {
    return http.get<{ data: Payout }>(PAYOUT_API + '/' + payoutId);
  },

  /**
   * Approve a payout request
   * Backend: POST /payout/admin/payouts/:payoutId/approve
   */
  async approvePayout(payoutId: string, approvalData: PayoutApproval) {
    return http.post(PAYOUT_ADMIN_API + '/payouts/' + payoutId + '/approve', {
      approvedAt: new Date().toISOString(),
      approvedBy: 'admin',
      notes: approvalData.notes,
      processingFee: approvalData.processingFee || 0,
      expectedCompletionDate: approvalData.expectedCompletionDate
    });
  },

  /**
   * Reject a payout request
   * Backend: POST /payout/admin/payouts/:payoutId/reject
   */
  async rejectPayout(payoutId: string, reason: string, returnFunds = true) {
    return http.post(PAYOUT_ADMIN_API + '/payouts/' + payoutId + '/reject', {
      reason,
      returnFunds,
      rejectedAt: new Date().toISOString(),
      rejectedBy: 'admin'
    });
  },

  /**
   * Mark payout as completed (payment sent)
   * Backend: POST /payout/admin/payouts/:payoutId/complete
   */
  async completePayout(payoutId: string, completionData: PayoutCompletion) {
    return http.post(PAYOUT_ADMIN_API + '/payouts/' + payoutId + '/complete', {
      completedAt: new Date().toISOString(),
      completedBy: 'admin',
      transactionId: completionData.transactionId,
      transactionReference: completionData.transactionReference,
      bankReference: completionData.bankReference,
      notes: completionData.notes
    });
  },

  /**
   * Mark payout as failed
   * Backend: POST /payout/admin/payouts/:payoutId/fail
   */
  async failPayout(payoutId: string, failureData: PayoutFailure) {
    return http.post(PAYOUT_ADMIN_API + '/payouts/' + payoutId + '/fail', {
      failureReason: failureData.reason,
      failureCode: failureData.code,
      shouldRetry: failureData.shouldRetry !== false,
      failedAt: new Date().toISOString(),
      failedBy: 'admin',
      notes: failureData.notes
    });
  },

  /**
   * Get payout statistics
   * Backend: GET /payout/admin/payouts/statistics/platform
   */
  async getPayoutStatistics(timeRange = '30d'): Promise<PayoutStatistics> {
    return http.get<PayoutStatistics>(PAYOUT_ADMIN_API + '/payouts/statistics/platform?timeRange=' + timeRange);
  },

  /**
   * Export payout data to CSV
   * Backend: GET /payout/admin/payouts/export
   */
  async exportPayoutData(filters: PayoutFilters = {}) {
    const params = new URLSearchParams();
    params.append('format', 'csv');
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    return http.get(PAYOUT_ADMIN_API + '/payouts/export?' + params.toString());
  }
};

export default {
  walletService,
  payoutService
};
