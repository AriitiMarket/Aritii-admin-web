/**
 * Payouts Management Page
 * Admin view for seller payout requests
 */

import { useCallback, useEffect, useState } from 'react';
import { payoutService } from '@/services/financial.service';
import { PageHeader } from '@/components/common/PageHeader';
import { Spinner } from '@/components/common/Spinner';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { StatusBadge } from '@/components/common/StatusBadge';
import './PayoutsPage.css';

interface Payout {
  id: string;
  sellerId: string;
  amount: number;
  status: string;
  payoutMethod: string;
  createdAt: string;
  approvedAt?: string;
  completedAt?: string;
}

const PayoutsPage = () => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('PENDING');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [approvalData, setApprovalData] = useState({ notes: '' });
  const [completionData, setCompletionData] = useState({
    transactionId: '',
    transactionReference: '',
    bankReference: '',
    notes: ''
  });

  const fetchPayouts = useCallback(async () => {
    try {
      setLoading(true);
      let response;
      
      if (status === 'PENDING') {
        response = await payoutService.getPendingPayouts({
          limit: 15,
          offset: page * 15
        });
      } else {
        response = await payoutService.getAllPayouts({
          status,
          limit: 15,
          offset: page * 15
        });
      }
      
      setPayouts(response.data || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Failed to fetch payouts:', error);
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const handleApprovePayout = async () => {
    if (!selectedPayout) return;

    try {
      await payoutService.approvePayout(selectedPayout.id, approvalData);
      setShowApprovalModal(false);
      setApprovalData({ notes: '' });
      fetchPayouts();
    } catch (error) {
      console.error('Failed to approve payout:', error);
      alert('Failed to approve payout');
    }
  };

  const handleCompletePayout = async () => {
    if (!selectedPayout || !completionData.transactionId) {
      alert('Transaction ID is required');
      return;
    }

    try {
      await payoutService.completePayout(selectedPayout.id, completionData);
      setShowCompletionModal(false);
      setCompletionData({ transactionId: '', transactionReference: '', bankReference: '', notes: '' });
      fetchPayouts();
    } catch (error) {
      console.error('Failed to complete payout:', error);
      alert('Failed to complete payout');
    }
  };

  const handleRejectPayout = async () => {
    if (!selectedPayout) return;
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      await payoutService.rejectPayout(selectedPayout.id, reason, true);
      fetchPayouts();
    } catch (error) {
      console.error('Failed to reject payout:', error);
      alert('Failed to reject payout');
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'Payout ID',
      width: '150px',
      render: (value: string) => value.slice(0, 8) + '...'
    },
    {
      key: 'sellerId',
      label: 'Seller',
      width: '150px'
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value: number) => `${value.toFixed(2)} ETB`
    },
    {
      key: 'payoutMethod',
      label: 'Method',
      width: '120px'
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => <StatusBadge status={value} />
    },
    {
      key: 'createdAt',
      label: 'Requested',
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '200px',
      render: (_: unknown, row: Payout) => (
        <div className="actions">
          {row.status === 'PENDING' && (
            <>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setSelectedPayout(row);
                  setShowApprovalModal(true);
                }}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  setSelectedPayout(row);
                  handleRejectPayout();
                }}
              >
                Reject
              </Button>
            </>
          )}
          {row.status === 'APPROVED' && (
            <Button
              size="sm"
              onClick={() => {
                setSelectedPayout(row);
                setShowCompletionModal(true);
              }}
            >
              Complete
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="payouts-page">
      <PageHeader title="Payout Management" />

      <div className="toolbar">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0);
          }}
          className="status-filter"
        >
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="PROCESSING">Processing</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <Button onClick={fetchPayouts} disabled={loading}>
          {loading ? <Spinner size="sm" /> : 'Refresh'}
        </Button>
      </div>

      {loading && !payouts.length ? (
        <div className="loading-state">
          <Spinner />
          <p>Loading payouts...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={payouts}
          onPageChange={setPage}
          currentPage={page}
          pageSize={15}
          total={total}
        />
      )}

      {showApprovalModal && selectedPayout && (
        <Modal
          title="Approve Payout"
          onClose={() => setShowApprovalModal(false)}
          actions={[
            { label: 'Cancel', onClick: () => setShowApprovalModal(false) },
            { label: 'Approve', onClick: handleApprovePayout, primary: true }
          ]}
        >
          <div className="approval-form">
            <p><strong>Seller ID:</strong> {selectedPayout.sellerId}</p>
            <p><strong>Amount:</strong> {selectedPayout.amount.toFixed(2)} ETB</p>
            <p><strong>Method:</strong> {selectedPayout.payoutMethod}</p>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={approvalData.notes}
                onChange={(e) => setApprovalData({ ...approvalData, notes: e.target.value })}
                placeholder="Optional approval notes..."
                rows={3}
              />
            </div>
          </div>
        </Modal>
      )}

      {showCompletionModal && selectedPayout && (
        <Modal
          title="Mark Payout as Completed"
          onClose={() => setShowCompletionModal(false)}
          actions={[
            { label: 'Cancel', onClick: () => setShowCompletionModal(false) },
            { label: 'Complete', onClick: handleCompletePayout, primary: true }
          ]}
        >
          <div className="completion-form">
            <p><strong>Seller ID:</strong> {selectedPayout.sellerId}</p>
            <p><strong>Amount:</strong> {selectedPayout.amount.toFixed(2)} ETB</p>

            <div className="form-group">
              <label>Transaction ID *</label>
              <input
                type="text"
                value={completionData.transactionId}
                onChange={(e) => setCompletionData({ ...completionData, transactionId: e.target.value })}
                placeholder="e.g., TXN123456"
              />
            </div>

            <div className="form-group">
              <label>Transaction Reference</label>
              <input
                type="text"
                value={completionData.transactionReference}
                onChange={(e) => setCompletionData({ ...completionData, transactionReference: e.target.value })}
                placeholder="Payment gateway reference..."
              />
            </div>

            <div className="form-group">
              <label>Bank Reference</label>
              <input
                type="text"
                value={completionData.bankReference}
                onChange={(e) => setCompletionData({ ...completionData, bankReference: e.target.value })}
                placeholder="Bank transfer reference..."
              />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={completionData.notes}
                onChange={(e) => setCompletionData({ ...completionData, notes: e.target.value })}
                placeholder="Optional completion notes..."
                rows={3}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PayoutsPage;
