import { useCallback, useEffect, useState } from 'react';

/** A seller payout request as returned by the admin payouts endpoint. */
interface AdminPayout {
  id: string;
  sellerName: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  requestedAt: string;
  bankAccount?: string;
  approvedAt?: string;
  approvalNotes?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

/**
 * ADMIN PAYOUTS PAGE - Approve and manage seller payouts
 */
export function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('PENDING_APPROVAL');
  const [selectedPayout, setSelectedPayout] = useState<AdminPayout | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [actionReason, setActionReason] = useState('');

  const loadPayouts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (filterStatus && filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      // Fetch admin payout requests from backend
      const response = await fetch(`/payout/admin/requests?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to load payouts: ${response.statusText}`);
      }

      const data = await response.json();
      setPayouts(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message || 'Failed to load payouts'
          : 'Failed to load payouts'
      );
      console.error('Load payouts error:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    loadPayouts();
  }, [loadPayouts]);

  const handleApprove = async (payoutId: string, reason = '') => {
    try {
      setActionLoading(true);
      setError(null);

      // Send approval to backend
      const response = await fetch(`/payout/admin/${payoutId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: reason }),
      });

      if (!response.ok) {
        throw new Error(`Failed to approve payout: ${response.statusText}`);
      }

      // Update local state
      setPayouts((prev) =>
        prev.map((p) =>
          p.id === payoutId
            ? {
                ...p,
                status: 'APPROVED',
                approvedAt: new Date().toISOString(),
                approvalNotes: reason,
              }
            : p
        )
      );
      setSelectedPayout(null);
      setActionType(null);
      setActionReason('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message || 'Failed to approve payout'
          : 'Failed to approve payout'
      );
      console.error('Approve payout error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (payoutId: string, reason: string) => {
    try {
      setActionLoading(true);
      setError(null);

      // Send rejection to backend
      const response = await fetch(`/payout/admin/${payoutId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error(`Failed to reject payout: ${response.statusText}`);
      }

      // Update local state
      setPayouts((prev) =>
        prev.map((p) =>
          p.id === payoutId
            ? {
                ...p,
                status: 'REJECTED',
                rejectedAt: new Date().toISOString(),
                rejectionReason: reason,
              }
            : p
        )
      );
      setSelectedPayout(null);
      setActionType(null);
      setActionReason('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message || 'Failed to reject payout'
          : 'Failed to reject payout'
      );
      console.error('Reject payout error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPayouts = payouts.filter(
    (p) => filterStatus === 'all' || p.status === filterStatus
  );

  const stats = {
    pending: payouts.filter((p) => p.status === 'PENDING_APPROVAL').length,
    approved: payouts.filter((p) => p.status === 'APPROVED').length,
    completed: payouts.filter((p) => p.status === 'COMPLETED').length,
    totalAmount: payouts
      .filter((p) => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0),
  };

  return (
    <div className="admin-payouts-page">
      <div className="page-header">
        <h1>Payout Management</h1>
        <p>Approve and manage seller payout requests</p>
      </div>

      {error && (
        <div className="alert alert-error" onClick={() => setError(null)}>
          {error} ✕
        </div>
      )}

      {loading ? (
        <div className="loading-state"><p>Loading payouts...</p></div>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard label="Pending" value={stats.pending} icon="⏱️" highlight={stats.pending > 0} />
            <StatCard label="Approved" value={stats.approved} icon="✓" />
            <StatCard label="Completed" value={stats.completed} icon="💰" />
            <StatCard label="Total Paid" value={`${stats.totalAmount.toLocaleString()} ETB`} icon="✅" />
          </div>

          <div className="filter-group">
            <label>Filter:</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Payouts</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="payouts-table">
            <table>
              <thead>
                <tr>
                  <th>Seller</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayouts.map((payout) => (
                  <tr key={payout.id}>
                    <td>{payout.sellerName}</td>
                    <td>{payout.amount.toLocaleString()} {payout.currency}</td>
                    <td>{payout.method}</td>
                    <td>
                      <span className={`badge status-${
                        payout.status === 'COMPLETED' ? 'success' :
                        payout.status === 'APPROVED' ? 'info' :
                        payout.status === 'PENDING_APPROVAL' ? 'warning' : 'error'
                      }`}>
                        {payout.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>{new Date(payout.requestedAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => setSelectedPayout(payout)}
                        className="btn btn-sm btn-secondary"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedPayout && (
            <div className="modal-overlay" onClick={() => setSelectedPayout(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={() => setSelectedPayout(null)}>✕</button>
                <h2>Payout Details</h2>

                <div className="detail-grid">
                  <div><strong>Request ID:</strong> {selectedPayout.id}</div>
                  <div><strong>Seller:</strong> {selectedPayout.sellerName}</div>
                  <div><strong>Amount:</strong> {selectedPayout.amount.toLocaleString()} {selectedPayout.currency}</div>
                  <div><strong>Method:</strong> {selectedPayout.method}</div>
                  <div><strong>Bank Account:</strong> {selectedPayout.bankAccount}</div>
                  <div><strong>Status:</strong> {selectedPayout.status}</div>
                </div>

                {selectedPayout.status === 'PENDING_APPROVAL' && !actionType && (
                  <div className="modal-actions">
                    <button
                      onClick={() => setActionType('approve')}
                      className="btn btn-success"
                    >
                      Approve Payout
                    </button>
                    <button
                      onClick={() => setActionType('reject')}
                      className="btn btn-danger"
                    >
                      Reject Payout
                    </button>
                  </div>
                )}

                {actionType && (
                  <div className="action-section">
                    <textarea
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder={actionType === 'approve' ? 'Approval notes (optional)' : 'Rejection reason (required)'}
                      rows={3}
                    />
                    <div className="modal-actions">
                      <button
                        onClick={() => {
                          if (actionType === 'approve') {
                            handleApprove(selectedPayout.id, actionReason);
                          } else {
                            if (!actionReason.trim()) {
                              setError('Rejection reason is required');
                              return;
                            }
                            handleReject(selectedPayout.id, actionReason);
                          }
                        }}
                        disabled={actionLoading}
                        className={`btn ${actionType === 'approve' ? 'btn-success' : 'btn-danger'}`}
                      >
                        {actionLoading ? 'Processing...' : (actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection')}
                      </button>
                      <button
                        onClick={() => {
                          setActionType(null);
                          setActionReason('');
                        }}
                        disabled={actionLoading}
                        className="btn btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {!actionType && (
                  <div className="modal-actions">
                    <button
                      onClick={() => setSelectedPayout(null)}
                      className="btn btn-secondary"
                    >
                      Close
                    </button>
                  </div>
                )}
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
  highlight,
}: {
  label: string;
  value: string | number;
  icon?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`stat-card ${highlight ? 'highlight' : ''}`}>
      <span className="stat-icon">{icon}</span>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
    </div>
  );
}

export default AdminPayoutsPage;
