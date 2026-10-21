import { useState, useEffect } from 'react';
import { DataTable } from '@/components/tables/DataTable';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Textarea } from '@/components/common/Textarea';
import { SelectField as Select } from '@/components/common/SelectField';
import { returnsService, type Return } from '@/services/returns.service';
import { useToast } from '@/hooks/useToast';

export const ReturnsManagementPage = () => {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [notes, setNotes] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | 'refund' | null>(null);
  const { showToast: toast } = useToast();

  const limit = 20;

  useEffect(() => {
    loadReturns();
  }, [page, statusFilter]);

  const loadReturns = async () => {
    setLoading(true);
    try {
      const result = await returnsService.listReturns(page, limit, statusFilter || undefined);
      setReturns(result.returns);
      setTotal(result.total);
    } catch (_err) {
      toast({ message: 'Failed to load returns', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedReturn) return;
    try {
      await returnsService.approveReturn(selectedReturn._id, notes);
      toast({ message: 'Return approved', type: 'success' });
      setSelectedReturn(null);
      setAction(null);
      setNotes('');
      loadReturns();
    } catch (_err) {
      toast({ message: 'Failed to approve return', type: 'error' });
    }
  };

  const handleReject = async () => {
    if (!selectedReturn) return;
    try {
      await returnsService.rejectReturn(selectedReturn._id, notes);
      toast({ message: 'Return rejected', type: 'success' });
      setSelectedReturn(null);
      setAction(null);
      setNotes('');
      loadReturns();
    } catch (_err) {
      toast({ message: 'Failed to reject return', type: 'error' });
    }
  };

  const handleProcessRefund = async () => {
    if (!selectedReturn) return;
    try {
      // Generate or use existing payment ID
      const paymentId = `ref-${Date.now()}`;
      await returnsService.processRefund(selectedReturn._id, paymentId);
      toast({ message: 'Refund processed', type: 'success' });
      setSelectedReturn(null);
      setAction(null);
      loadReturns();
    } catch (_err) {
      toast({ message: 'Failed to process refund', type: 'error' });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      REQUESTED: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      REJECTED: 'bg-red-100 text-red-800',
      PICKED_UP: 'bg-purple-100 text-purple-800',
      RETURNED: 'bg-indigo-100 text-indigo-800',
      REFUNDED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const columns = [
    { header: 'Order ID', accessor: 'orderId', width: '15%' },
    { header: 'Buyer', accessor: 'buyerId', width: '15%' },
    { header: 'Reason', accessor: 'reason', width: '15%' },
    { header: 'Amount', accessor: (row: Return) => `$${row.returnAmount}`, width: '12%' },
    {
      header: 'Status',
      accessor: (row: Return) => (
        <span className={`px-3 py-1 rounded ${getStatusColor(row.status)}`}>{row.status}</span>
      ),
      width: '15%',
    },
    {
      header: 'Actions',
      width: '20%',
      cell: (row: Return) => (
        <div className="flex gap-2">
          {row.status === 'REQUESTED' && (
            <>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedReturn(row);
                  setAction('approve');
                }}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  setSelectedReturn(row);
                  setAction('reject');
                }}
              >
                Reject
              </Button>
            </>
          )}
          {row.status === 'RETURNED' && (
            <Button
              size="sm"
              variant="success"
              onClick={() => {
                setSelectedReturn(row);
                setAction('refund');
              }}
            >
              Process Refund
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Returns Management</h1>
        <span className="text-sm text-gray-600">Total: {total}</span>
      </div>

      <div className="flex gap-4">
        <Select
          label="Filter by Status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          options={[
            { label: 'All', value: '' },
            { label: 'Requested', value: 'REQUESTED' },
            { label: 'Approved', value: 'APPROVED' },
            { label: 'Rejected', value: 'REJECTED' },
            { label: 'Picked Up', value: 'PICKED_UP' },
            { label: 'Returned', value: 'RETURNED' },
            { label: 'Refunded', value: 'REFUNDED' },
          ]}
        />
      </div>

      <DataTable
        columns={columns}
        data={returns}
        loading={loading}
        pagination={{ page, setPage, limit, total }}
      />

      {action === 'approve' && selectedReturn && (
        <Modal
          title="Approve Return"
          open={true}
          onClose={() => {
            setAction(null);
            setSelectedReturn(null);
            setNotes('');
          }}
        >
          <div className="space-y-4">
            <p>Order: {selectedReturn.orderId}</p>
            <p>Reason: {selectedReturn.reason}</p>
            <p>Amount: ${selectedReturn.returnAmount}</p>
            <Textarea
              label="Admin Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="flex gap-2 pt-4">
              <Button onClick={handleApprove} variant="primary">
                Approve Return
              </Button>
              <Button
                onClick={() => {
                  setAction(null);
                  setSelectedReturn(null);
                  setNotes('');
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {action === 'reject' && selectedReturn && (
        <Modal
          title="Reject Return"
          open={true}
          onClose={() => {
            setAction(null);
            setSelectedReturn(null);
            setNotes('');
          }}
        >
          <div className="space-y-4">
            <p>Order: {selectedReturn.orderId}</p>
            <Textarea
              label="Rejection Reason"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why are you rejecting this return?"
            />
            <div className="flex gap-2 pt-4">
              <Button onClick={handleReject} variant="destructive">
                Reject Return
              </Button>
              <Button
                onClick={() => {
                  setAction(null);
                  setSelectedReturn(null);
                  setNotes('');
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {action === 'refund' && selectedReturn && (
        <Modal
          title="Process Refund"
          open={true}
          onClose={() => {
            setAction(null);
            setSelectedReturn(null);
          }}
        >
          <div className="space-y-4">
            <p>Order: {selectedReturn.orderId}</p>
            <p>Amount to Refund: ${selectedReturn.returnAmount}</p>
            <p>Processing refund for returned items...</p>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleProcessRefund} variant="success">
                Confirm Refund
              </Button>
              <Button
                onClick={() => {
                  setAction(null);
                  setSelectedReturn(null);
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
