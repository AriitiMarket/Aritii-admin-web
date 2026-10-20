import React, { useState, useEffect } from 'react';
import { AiOutlineCheckCircle, AiOutlineCloseCircle, AiOutlineWarning } from 'react-icons/ai';
import { toast } from 'react-toastify';
import api from '@/services/api';

const DisputesManagementDashboard = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [resolution, setResolution] = useState('');

  useEffect(() => {
    fetchOpenDisputes();
  }, []);

  const fetchOpenDisputes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/order-dispute/admin/open');
      setDisputes(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to fetch disputes');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDispute = async () => {
    if (!newStatus) {
      toast.warning('Please select a status');
      return;
    }

    setUpdating(true);
    try {
      await api.patch(`/order-dispute/${selectedDispute._id}`, {
        status: newStatus,
        resolution: { notes: resolution }
      });
      toast.success('Dispute updated');
      setSelectedDispute(null);
      setNewStatus('');
      setResolution('');
      await fetchOpenDisputes();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update dispute');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      OPEN: 'bg-red-100 text-red-800',
      INVESTIGATING: 'bg-yellow-100 text-yellow-800',
      ESCALATED: 'bg-orange-100 text-orange-800',
      RESOLVED: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="p-8 text-center">Loading disputes...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Disputes List */}
      <div className="lg:col-span-1 bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Open Disputes</h3>
          <span className="text-xs text-gray-500">Total: {disputes.length}</span>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {disputes.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No open disputes</div>
          ) : (
            disputes.map((dispute) => (
              <button
                key={dispute._id}
                onClick={() => setSelectedDispute(dispute)}
                className={`w-full text-left p-3 border-l-4 rounded transition ${
                  selectedDispute?._id === dispute._id
                    ? 'bg-blue-50 border-blue-500'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-semibold text-sm text-gray-800">{dispute.orderId}</div>
                <div className={`text-xs font-semibold ${getStatusBadgeColor(dispute.status)}`}>
                  {dispute.status}
                </div>
                <div className="text-xs text-gray-600 mt-1">{dispute.reason}</div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Dispute Detail */}
      {selectedDispute && (
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Dispute Details</h3>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Order ID</label>
              <p className="text-gray-900 font-mono">{selectedDispute.orderId}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Initiated By</label>
              <p className="text-gray-900">{selectedDispute.initiatorRole}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Reason</label>
              <p className="text-gray-900">{selectedDispute.reason}</p>
            </div>

            {selectedDispute.evidence?.images?.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Evidence</label>
                <div className="flex gap-2 flex-wrap mt-2">
                  {selectedDispute.evidence.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`Evidence ${i}`}
                      className="w-20 h-20 object-cover rounded border border-gray-300"
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                disabled={updating}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select status...</option>
                <option value="INVESTIGATING">Investigating</option>
                <option value="ESCALATED">Escalated</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Resolution Notes</label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                disabled={updating}
                rows={4}
                placeholder="Describe the resolution..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setSelectedDispute(null)}
              disabled={updating}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50 transition"
            >
              Close
            </button>
            <button
              onClick={handleUpdateDispute}
              disabled={updating || !newStatus}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 transition"
            >
              {updating ? 'Updating...' : 'Update Dispute'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputesManagementDashboard;
