import { useCallback, useEffect, useState } from 'react';

/** A platform refund as returned by the admin refunds endpoint. */
interface AdminRefund {
  id: string;
  orderId: string;
  buyerName: string;
  sellerName: string;
  amount: number;
  currency: string;
  reason: string;
  status: string;
  requestedAt: string;
}

/**
 * ADMIN REFUNDS PAGE - Manage all platform refunds system-wide
 */
export function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<AdminRefund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRefund, setSelectedRefund] = useState<AdminRefund | null>(null);

  const loadRefunds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (filterStatus && filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      // Fetch all platform refunds from backend
      const response = await fetch(`/admin/returns?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to load refunds: ${response.statusText}`);
      }

      const data = await response.json();
      setRefunds(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message || 'Failed to load refunds'
          : 'Failed to load refunds'
      );
      console.error('Load refunds error:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    loadRefunds();
  }, [loadRefunds]);

  const filteredRefunds = refunds.filter(
    (r) => filterStatus === 'all' || r.status === filterStatus
  );

  const stats = {
    pending: refunds.filter((r) => r.status === 'PENDING_APPROVAL').length,
    approved: refunds.filter((r) => r.status === 'APPROVED').length,
    rejected: refunds.filter((r) => r.status === 'REJECTED').length,
    totalAmount: refunds
      .filter((r) => r.status === 'APPROVED')
      .reduce((sum, r) => sum + r.amount, 0),
  };

  return (
    <div className="admin-refunds-page">
      <div className="page-header">
        <h1>Refund Management</h1>
        <p>Monitor and manage all platform refunds</p>
      </div>

      {error && (
        <div className="alert alert-error" onClick={() => setError(null)}>
          {error} ✕
        </div>
      )}

      {loading ? (
        <div className="loading-state"><p>Loading refunds...</p></div>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard label="Pending Approval" value={stats.pending} icon="⏱️" />
            <StatCard label="Approved" value={stats.approved} icon="✓" />
            <StatCard label="Rejected" value={stats.rejected} icon="✗" />
            <StatCard label="Total Amount" value={`${stats.totalAmount.toLocaleString()} ETB`} icon="💰" />
          </div>

          <div className="filter-group">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Refunds</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="refunds-table">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Buyer</th>
                  <th>Seller</th>
                  <th>Amount</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRefunds.map((refund) => (
                  <tr key={refund.id}>
                    <td>{refund.orderId}</td>
                    <td>{refund.buyerName}</td>
                    <td>{refund.sellerName}</td>
                    <td>{refund.amount.toLocaleString()} {refund.currency}</td>
                    <td>{refund.reason}</td>
                    <td>
                      <span className={`badge status-${refund.status === 'APPROVED' ? 'success' : refund.status === 'REJECTED' ? 'error' : 'warning'}`}>
                        {refund.status === 'PENDING_APPROVAL' ? 'Pending' : refund.status}
                      </span>
                    </td>
                    <td>{new Date(refund.requestedAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => setSelectedRefund(refund)}
                        className="btn btn-sm btn-secondary"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedRefund && (
            <div className="modal-overlay" onClick={() => setSelectedRefund(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={() => setSelectedRefund(null)}>✕</button>
                <h2>Refund Details</h2>
                <div className="detail-grid">
                  <div><strong>Order:</strong> {selectedRefund.orderId}</div>
                  <div><strong>Buyer:</strong> {selectedRefund.buyerName}</div>
                  <div><strong>Seller:</strong> {selectedRefund.sellerName}</div>
                  <div><strong>Amount:</strong> {selectedRefund.amount.toLocaleString()} {selectedRefund.currency}</div>
                  <div><strong>Reason:</strong> {selectedRefund.reason}</div>
                  <div><strong>Status:</strong> {selectedRefund.status}</div>
                </div>
                <button onClick={() => setSelectedRefund(null)} className="btn btn-primary">Close</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon?: string;
}) {
  return (
    <div className="stat-card">
      <span className="stat-icon">{icon}</span>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
    </div>
  );
}

export default AdminRefundsPage;
