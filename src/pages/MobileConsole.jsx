/**
 * Admin Mobile Console - Critical operations on mobile
 */
import React, { useState, useEffect } from 'react';

export function AdminMobileConsole() {
  const [dashboard, setDashboard] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);

  useEffect(() => {
    // Fetch dashboard data
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/admin/mobile/dashboard', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setDashboard(data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    }
  };

  if (!dashboard) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-mobile-console">
      {/* Status Overview */}
      <div className="status-card">
        <div className="status-indicator">
          <span className={`dot ${dashboard.status}`}></span>
          <span>{dashboard.status}</span>
        </div>
      </div>

      {/* Alerts */}
      {dashboard.criticalAlerts > 0 && (
        <div className="alerts-card">
          <h3>⚠️ {dashboard.criticalAlerts} Critical Alerts</h3>
          <button 
            className="view-btn"
            onClick={() => setSelectedAction('alerts')}
          >
            View
          </button>
        </div>
      )}

      {/* Pending Approvals */}
      {dashboard.pendingApprovals > 0 && (
        <div className="action-card">
          <h3>📋 {dashboard.pendingApprovals} Pending</h3>
          <p>Seller applications awaiting approval</p>
          <button 
            className="action-btn"
            onClick={() => setSelectedAction('applications')}
          >
            Review
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <button 
          className="action-btn"
          onClick={() => setSelectedAction('suspend')}
        >
          Suspend Seller
        </button>
        <button 
          className="action-btn"
          onClick={() => setSelectedAction('refund')}
        >
          Refund Order
        </button>
        <button 
          className="action-btn"
          onClick={() => setSelectedAction('disable')}
        >
          Disable Product
        </button>
      </div>

      {/* Metrics */}
      <div className="metrics-grid">
        <div className="metric">
          <span className="label">Orders</span>
          <span className="value">{dashboard.metrics.todayOrders}</span>
        </div>
        <div className="metric">
          <span className="label">Revenue</span>
          <span className="value">{dashboard.metrics.todayRevenue} Br</span>
        </div>
        <div className="metric">
          <span className="label">New Users</span>
          <span className="value">{dashboard.metrics.newUsers}</span>
        </div>
      </div>

      {/* Modal for Actions */}
      {selectedAction && (
        <QuickActionModal
          action={selectedAction}
          onClose={() => setSelectedAction(null)}
        />
      )}
    </div>
  );
}

function QuickActionModal({ action, onClose }) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/mobile/operation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ operation: action, data: formData })
      });

      if (response.ok) {
        alert('Action completed successfully');
        onClose();
      }
    } catch (error) {
      alert('Action failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (action) {
      case 'suspend':
        return (
          <div className="form-group">
            <label>Seller ID</label>
            <input 
              type="text"
              value={formData.sellerId || ''}
              onChange={(e) => setFormData({...formData, sellerId: e.target.value})}
            />
            <label>Reason</label>
            <textarea
              value={formData.reason || ''}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
            />
          </div>
        );
      case 'refund':
        return (
          <div className="form-group">
            <label>Order ID</label>
            <input 
              type="text"
              value={formData.orderId || ''}
              onChange={(e) => setFormData({...formData, orderId: e.target.value})}
            />
            <label>Amount</label>
            <input 
              type="number"
              value={formData.amount || ''}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{action}</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        {renderContent()}

        <div className="modal-actions">
          <button 
            className="cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="submit-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminMobileConsole;
