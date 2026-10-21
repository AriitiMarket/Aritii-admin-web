import React, { useState } from 'react';
import { AiOutlineSearchFile, AiOutlineDownload } from 'react-icons/ai';
import { toast } from 'react-toastify';
import api from '@/services/api';

const CommissionAuditDashboard = () => {
  const [sellerId, setSellerId] = useState('');
  const [commissionData, setCommissionData] = useState(null);
  const [auditResult, setAuditResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('month');

  const handleAudit = async () => {
    if (!sellerId.trim()) {
      toast.warning('Please enter a Seller ID');
      return;
    }

    setLoading(true);
    try {
      const [dataRes, auditRes] = await Promise.all([
        api.get(`/commission-ledger/seller/${sellerId}?period=${period}`),
        api.get(`/commission-ledger/seller/${sellerId}/audit`)
      ]);

      setCommissionData(dataRes.data?.data);
      setAuditResult(auditRes.data?.data);
      toast.success('Audit completed');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to audit commissions');
      setCommissionData(null);
      setAuditResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Commission Audit</h3>

        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Enter Seller ID..."
            value={sellerId}
            onChange={(e) => setSellerId(e.target.value)}
            disabled={loading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            disabled={loading}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>

          <button
            onClick={handleAudit}
            disabled={loading || !sellerId}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 transition"
          >
            <AiOutlineSearchFile /> Audit
          </button>
        </div>
      </div>

      {/* Audit Result */}
      {auditResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h4 className="text-sm font-medium text-gray-600">Total Commission</h4>
            <p className="text-3xl font-bold text-green-600">${auditResult.totalCommission || 0}</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h4 className="text-sm font-medium text-gray-600">Order Count</h4>
            <p className="text-3xl font-bold text-blue-600">{auditResult.orderCount || 0}</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h4 className="text-sm font-medium text-gray-600">Average Commission</h4>
            <p className="text-3xl font-bold text-purple-600">${auditResult.avgCommission || 0}</p>
          </div>
        </div>
      )}

      {/* Commission Breakdown */}
      {auditResult?.breakdown && auditResult.breakdown.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Commission Breakdown by Reason</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Reason</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Amount</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Count</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {auditResult.breakdown.map((item, idx) => {
                  const percentage = auditResult.totalCommission 
                    ? ((item.amount / auditResult.totalCommission) * 100).toFixed(1)
                    : 0;
                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-800">{item.reason}</td>
                      <td className="px-4 py-2">${item.amount.toFixed(2)}</td>
                      <td className="px-4 py-2">{item.count}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${Math.min(100, percentage)}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-600">{percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Commission History */}
      {commissionData?.history && commissionData.history.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Commission History</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Order ID</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Commission</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Reason</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {commissionData.history.slice(0, 10).map((entry) => (
                  <tr key={entry._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs">{entry.orderId}</td>
                    <td className="px-4 py-2 font-semibold text-green-600">${entry.amount}</td>
                    <td className="px-4 py-2">{entry.reason}</td>
                    <td className="px-4 py-2 text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommissionAuditDashboard;
