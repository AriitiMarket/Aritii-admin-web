import { http } from '@/services/client/httpClient';

/**
 * Payment Reconciliation service — compare internal payments against a
 * provider's transaction feed and triage discrepancies.
 *
 * Backing endpoints (commerce-service, mounted at /payment-reconciliation):
 *   POST /payment-reconciliation/reconcile          { provider, transactions }
 *   GET  /payment-reconciliation/report?period=day  summary for a period
 *   POST /payment-reconciliation/flag-discrepancy   { paymentId, reason }
 *   POST /payment-reconciliation/resolve-discrepancy{ paymentId, action }
 *
 * Controllers wrap replies in `{ success, data }`.
 */
export interface ReconciliationSummary {
  matched: number;
  unmatched: number;
  discrepancies: number;
}

/** One reconciled payment row. */
export interface ReconciliationRow {
  transactionId?: string;
  dbAmount?: number;
  providerAmount?: number;
  difference?: number;
  reason?: string;
}

export interface ReconciliationReport {
  provider?: string;
  period?: string;
  timestamp?: string;
  summary: ReconciliationSummary;
  results?: {
    matched?: ReconciliationRow[];
    unmatched?: ReconciliationRow[];
    discrepancies?: ReconciliationRow[];
  };
}

export interface ProviderTransaction {
  id: string;
  amount: number;
}

interface Envelope<T> {
  success?: boolean;
  data?: T;
}

class PaymentReconciliationService {
  /** Reconciliation summary for a period ('day' | 'week' | 'month'). */
  async getReport(period = 'day'): Promise<ReconciliationReport | null> {
    const res = await http.get<Envelope<ReconciliationReport>>(
      '/payment-reconciliation/report',
      { params: { period } }
    );
    return res?.data ?? null;
  }

  /** Run a reconciliation against a provider's transaction list. */
  async reconcile(
    provider: string,
    transactions: ProviderTransaction[]
  ): Promise<ReconciliationReport> {
    if (!provider) throw new Error('Provider is required');
    const res = await http.post<Envelope<ReconciliationReport>>(
      '/payment-reconciliation/reconcile',
      { provider, transactions }
    );
    return res?.data as ReconciliationReport;
  }

  /** Flag a payment as a discrepancy for investigation. */
  async flagDiscrepancy(
    paymentId: string,
    reason: string
  ): Promise<unknown> {
    if (!paymentId || !reason) {
      throw new Error('Payment ID and reason are required');
    }
    const res = await http.post<Envelope<unknown>>(
      '/payment-reconciliation/flag-discrepancy',
      { paymentId, reason }
    );
    return res?.data;
  }

  /** Resolve a flagged discrepancy. */
  async resolveDiscrepancy(
    paymentId: string,
    action: 'adjust' | 'refund' | 'ignore' | string
  ): Promise<unknown> {
    if (!paymentId || !action) {
      throw new Error('Payment ID and action are required');
    }
    const res = await http.post<Envelope<unknown>>(
      '/payment-reconciliation/resolve-discrepancy',
      { paymentId, action }
    );
    return res?.data;
  }
}

export const paymentReconciliationService = new PaymentReconciliationService();