import React, { useState, useEffect } from 'react';
import { AiOutlineCheckCircle, AiOutlineWarning } from 'react-icons/ai';
import { toast } from 'react-toastify';
import api from '@/services/api';

const PaymentReconciliationDashboard = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('day');
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState(null);

  useEffect(() => {
    fetchReport();
  }, [period]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payment-reconciliation/report', { params: { period } });
      setReport(res.data?.data || {});
    } catch (err) {
      toast.error('Failed to fetch reconciliation report');
    } finally {
      setLoading(false);
    }
  };

  const handleFlagDiscrepancy = async (transactionId) => {
    try {
      await api.post('/payment-reconciliation/flag-discrepancy', {
        paymentId: transactionId,
        reason: 'Manual review required'
      });
      toast.success('Discrepancy flagged');
      await fetchReport();
    } catch (err) {
      toast.error('Failed to flag discrepancy');
    }
  };

  const handleResolveDiscrepancy = async (paymentId, action) => {
    try {
      await api.post('/payment-reconciliation/resolve-discrepancy', {
        paymentId,
        action
      });
      toast.success(`Discrepancy resolved with action: ${action}`);
      await fetchReport();
    } catch (err) {
      toast.error('Failed to resolve discrepancy');
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading reconciliation data...</div>;
  }

  if (!report.summary) {
    return <div className="p-8 text-center text-gray-500">No data available</div>;
  }

  const reconciledPercent = report.summary.matched ? 
    ((report.summary.matched / (report.summary.matched + report.summary.unmatched + report.summary.discrepancies)) * 100).toFixed(1) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-4 items-center">
        <label className="text-sm font-medium text-gray-700">Period:</label>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="day">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="text-sm font-medium text-gray-600">Matched</h4>
          <p className="text-2xl font-bold text-green-600">{report.summary.matched}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="text-sm font-medium text-gray-600">Unmatched</h4>
          <p className="text-2xl font-bold text-red-600">{report.summary.unmatched}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="text-sm font-medium text-gray-600">Discrepancies</h4>
          <p className="text-2xl font-bold text-orange-600">{report.summary.discrepancies}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="text-sm font-medium text-gray-600">Reconciled %</h4>
          <p className="text-2xl font-bold text-blue-600">{reconciledPercent}%</p>
        </div>
      </div>

      {/* Discrepancies Table */}
      {report.results?.discrepancies?.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              Amount Discrepancies ({report.results.discrepancies.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Transaction ID</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">DB Amount</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Provider Amount</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Difference</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {report.results.discrepancies.map((disc) => (
                  <tr key={disc.transactionId} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs">{disc.transactionId}</td>
                    <td className="px-4 py-2">${disc.dbAmount}</td>
                    <td className="px-4 py-2">${disc.providerAmount}</td>
                    <td className="px-4 py-2 text-red-600 font-semibold">${disc.difference}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleFlagDiscrepancy(disc.transactionId)}
                        className="px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600 transition"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Unmatched Transactions */}
      {report.results?.unmatched?.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              Unmatched Transactions ({report.results.unmatched.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Transaction ID</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Amount</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {report.results.unmatched.map((unm) => (
                  <tr key={unm.transactionId} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs">{unm.transactionId}</td>
                    <td className="px-4 py-2">${unm.amount}</td>
                    <td className="px-4 py-2 text-gray-600">{unm.reason}</td>
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

export default PaymentReconciliationDashboard;
