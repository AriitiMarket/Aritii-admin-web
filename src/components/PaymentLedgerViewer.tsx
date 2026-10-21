import { useState, useEffect, useCallback } from 'react';
import {
  paymentLedgerService,
  type LedgerFilters,
  type PaymentLedgerEntry,
} from '@/services/paymentLedger.admin.service';

/**
 * Payment Ledger Hook
 */
export function usePaymentLedger() {
  const [ledger, setLedger] = useState<PaymentLedgerEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LedgerFilters>({
    page: 1,
    limit: 20,
    status: null,
    sellerId: null,
    dateFrom: null,
    dateTo: null,
  });

  const clearError = useCallback(() => setError(null), []);

  const loadLedger = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await paymentLedgerService.getLedger(filters);
      setLedger(result.ledger);
      setTotal(result.total);
      setPages(result.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  const updateFilters = (newFilters: Partial<LedgerFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const goToPage = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const exportLedger = useCallback(async (format = 'csv') => {
    setError(null);

    try {
      const blob = await paymentLedgerService.exportLedger({ ...filters, format });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payment-ledger-${new Date().toISOString().split('T')[0]}.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [filters]);

  return {
    ledger,
    total,
    pages,
    loading,
    error,
    filters,
    clearError,
    updateFilters,
    goToPage,
    exportLedger,
  };
}

/**
 * Payment Ledger Viewer Component
 */
export function PaymentLedgerViewer() {
  const {
    ledger,
    total,
    pages,
    loading,
    error,
    filters,
    clearError,
    updateFilters,
    goToPage,
    exportLedger,
  } = usePaymentLedger();

  if (loading && ledger.length === 0) {
    return <div className="ledger-loading">Loading payment ledger...</div>;
  }

  return (
    <div className="payment-ledger-viewer">
      <div className="ledger-header">
        <h1>Payment Ledger</h1>
        <div className="ledger-actions">
          <button onClick={() => exportLedger('csv')} className="btn btn-secondary">
            Export CSV
          </button>
          <button onClick={() => exportLedger('pdf')} className="btn btn-secondary">
            Export PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" onClick={clearError}>
          {error} ✕
        </div>
      )}

      <LedgerFilters filters={filters} onUpdateFilters={updateFilters} />

      <LedgerTable
        ledger={ledger}
        total={total}
        pages={pages}
        currentPage={filters.page}
        onPageChange={goToPage}
        loading={loading}
      />
    </div>
  );
}

/**
 * Ledger Filters Component
 */
function LedgerFilters({
  filters,
  onUpdateFilters,
}: {
  filters: LedgerFilters;
  onUpdateFilters: (filters: Partial<LedgerFilters>) => void;
}) {
  return (
    <div className="ledger-filters">
      <div className="filter-group">
        <label>Status:</label>
        <select
          value={filters.status || ''}
          onChange={(e) => onUpdateFilters({ status: e.target.value || null })}
        >
          <option value="">All Statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </div>

      <div className="filter-group">
        <label>From Date:</label>
        <input
          type="date"
          value={filters.dateFrom || ''}
          onChange={(e) => onUpdateFilters({ dateFrom: e.target.value || null })}
        />
      </div>

      <div className="filter-group">
        <label>To Date:</label>
        <input
          type="date"
          value={filters.dateTo || ''}
          onChange={(e) => onUpdateFilters({ dateTo: e.target.value || null })}
        />
      </div>

      <div className="filter-group">
        <label>Seller ID:</label>
        <input
          type="text"
          placeholder="Enter seller ID"
          value={filters.sellerId || ''}
          onChange={(e) => onUpdateFilters({ sellerId: e.target.value || null })}
        />
      </div>

      <div className="filter-group">
        <label>Per Page:</label>
        <select
          value={filters.limit}
          onChange={(e) => onUpdateFilters({ limit: parseInt(e.target.value, 10) })}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
    </div>
  );
}

/**
 * Ledger Table Component
 */
function LedgerTable({
  ledger,
  total,
  pages,
  currentPage,
  onPageChange,
  loading,
}: {
  ledger: PaymentLedgerEntry[];
  total: number;
  pages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  loading: boolean;
}) {
  if (ledger.length === 0) {
    return <div className="no-data">No transactions found</div>;
  }

  return (
    <div className="ledger-table-container">
      <table className="ledger-table">
        <thead>
          <tr>
            <th>Transaction ID</th>
            <th>Order ID</th>
            <th>Seller</th>
            <th>Amount</th>
            <th>Commission</th>
            <th>Net Amount</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {ledger.map((entry) => (
            <LedgerRow key={entry._id || entry.id} entry={entry} />
          ))}
        </tbody>
      </table>

      <div className="ledger-pagination">
        <p>
          Showing {(currentPage - 1) * 20 + 1}-{Math.min(currentPage * 20, total)} of {total}
        </p>

        <div className="pagination-buttons">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
          >
            Previous
          </button>

          {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={currentPage === page ? 'active' : ''}
                disabled={loading}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === pages || loading}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Individual Ledger Row
 */
function LedgerRow({ entry }: { entry: PaymentLedgerEntry }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <tr className="ledger-row" onClick={() => setShowDetails(!showDetails)}>
        <td className="transaction-id">{entry.transactionId || entry._id}</td>
        <td>{entry.orderId}</td>
        <td>{entry.sellerName || entry.sellerId}</td>
        <td className="amount">${(entry.amount || 0).toFixed(2)}</td>
        <td className="commission">${(entry.commission || 0).toFixed(2)}</td>
        <td className="net-amount">${(entry.netAmount || 0).toFixed(2)}</td>
        <td>
          <span className={`status-badge status-${entry.status?.toLowerCase()}`}>
            {entry.status}
          </span>
        </td>
        <td>{new Date(entry.createdAt || entry.date || '').toLocaleDateString()}</td>
        <td>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(!showDetails);
            }}
            className="btn-details"
          >
            {showDetails ? '−' : '+'}
          </button>
        </td>
      </tr>

      {showDetails && (
        <tr className="ledger-details">
          <td colSpan={9}>
            <LedgerDetails entry={entry} />
          </td>
        </tr>
      )}
    </>
  );
}

/**
 * Ledger Entry Details
 */
function LedgerDetails({ entry }: { entry: PaymentLedgerEntry }) {
  return (
    <div className="entry-details">
      <div className="detail-grid">
        <div className="detail-item">
          <label>Order Reference:</label>
          <span>{entry.orderRef}</span>
        </div>

        <div className="detail-item">
          <label>Payment Method:</label>
          <span>{entry.paymentMethod}</span>
        </div>

        <div className="detail-item">
          <label>Currency:</label>
          <span>{entry.currency || 'USD'}</span>
        </div>

        <div className="detail-item">
          <label>Processing Fee:</label>
          <span>${(entry.processingFee || 0).toFixed(2)}</span>
        </div>

        <div className="detail-item">
          <label>Tax:</label>
          <span>${(entry.tax || 0).toFixed(2)}</span>
        </div>

        <div className="detail-item">
          <label>Commission Rate:</label>
          <span>{((entry.commissionRate || 0) * 100).toFixed(2)}%</span>
        </div>

        {entry.notes && (
          <div className="detail-item full-width">
            <label>Notes:</label>
            <span>{entry.notes}</span>
          </div>
        )}
      </div>
    </div>
  );
}
