import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/common/Button';
import { commerceService, type PaymentMethodRecord } from '@/services/commerce.service';
import { PaymentMethodForm } from '@/pages/commerce/PaymentMethodForm';

export function AdminPaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethodRecord | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const loadPaymentMethods = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const methods = await commerceService.listPaymentMethods();
      // Sort by sortOrder, then name
      methods.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name));
      setPaymentMethods(methods);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment methods');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPaymentMethods();
  }, [loadPaymentMethods]);

  const handleSave = useCallback(async () => {
    loadPaymentMethods();
  }, [loadPaymentMethods]);

  const handleToggleStatus = async (method: PaymentMethodRecord) => {
    try {
      setActionLoading(true);
      const newStatus = method.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await commerceService.savePaymentMethod({
        id: method.id,
        status: newStatus,
        configured: method.configured,
      });
      loadPaymentMethods();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update payment method');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (methodId: string) => {
    if (!window.confirm('Delete this payment method? This cannot be undone.')) return;

    try {
      setActionLoading(true);
      // Note: DELETE endpoint not implemented on backend yet
      // For now, just set status to INACTIVE
      await commerceService.savePaymentMethod({
        id: methodId,
        status: 'INACTIVE',
        configured: false,
      });
      loadPaymentMethods();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete payment method');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const newMethods = [...paymentMethods];
    const [removed] = newMethods.splice(fromIndex, 1);
    newMethods.splice(toIndex, 0, removed);
    
    // Update sortOrder for all methods
    newMethods.forEach((method, index) => {
      method.sortOrder = index + 1;
    });
    
    setPaymentMethods(newMethods);
    
    // Save new sortOrder for each method
    newMethods.forEach((method) => {
      if (method.id) {
        commerceService.savePaymentMethod({
          id: method.id,
          sortOrder: method.sortOrder!,
          configured: method.configured,
        }).catch(console.error);
      }
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      handleReorder(draggedIndex, toIndex);
    }
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const canDeactivate = (method: PaymentMethodRecord) => {
    // Cannot deactivate the last active method
    const activeCount = paymentMethods.filter((m) => m.status === 'ACTIVE').length;
    return !(method.status === 'ACTIVE' && activeCount <= 1);
  };

  const getActiveCount = () => paymentMethods.filter((m) => m.status === 'ACTIVE').length;

  return (
    <div className="admin-payment-methods-page">
      <div className="page-header">
        <div>
          <h1>Payment Methods Configuration</h1>
          <p>Configure and manage payment methods available on the platform</p>
          {getActiveCount() === 1 && (
            <p className="text-sm text-amber-700 mt-1">
              ⚠ At least one payment method must remain active. The last active method cannot be deactivated.
            </p>
          )}
        </div>
        <Button
          onClick={() => {
            setEditingMethod(null);
            setShowForm(true);
          }}
          className="btn btn-primary"
          disabled={loading}
        >
          {showForm ? 'Cancel' : '+ Add Payment Method'}
        </Button>
      </div>

      {error && (
        <div className="alert alert-error" onClick={() => setError(null)} role="alert">
          {error} ✕
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <p>Loading payment methods...</p>
        </div>
      ) : (
        <>
          {showForm && (
            <PaymentMethodForm
              open={true}
              initial={editingMethod}
              onClose={() => {
                setShowForm(false);
                setEditingMethod(null);
              }}
              onSaved={handleSave}
            />
          )}

          <div className="payment-methods-table">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>Drag</th>
                  <th style={{ width: '50px' }}>Order</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Provider</th>
                  <th>Currency</th>
                  <th>Fees</th>
                  <th>Limits</th>
                  <th>Available For</th>
                  <th>Status</th>
                  <th>Configured</th>
                  <th style={{ width: '200px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paymentMethods.map((method, index) => (
                  <tr
                    key={method.id}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    style={{
                      opacity: draggedIndex === index ? 0.5 : 1,
                      backgroundColor: draggedIndex === index ? '#fef3c7' : 'transparent',
                      cursor: 'grab',
                    }}
                  >
                    <td className="text-center">
                      <span className="drag-handle" style={{ cursor: 'grab' }}>⋮⋮</span>
                    </td>
                    <td className="text-center font-mono text-sm text-gray-500">
                      {method.sortOrder ?? index + 1}
                    </td>
                    <td className="font-bold">{method.name}</td>
                    <td>{method.type}</td>
                    <td className="font-mono text-sm">{method.providerKey}</td>
                    <td>{method.currency}</td>
                    <td>
                      {(method.fixedFee ?? 0) > 0 && `${method.fixedFee} ETB + `}
                      {(method.percentageFee ?? 0) > 0 && `${method.percentageFee}%`}
                      {(method.fixedFee ?? 0) === 0 && (method.percentageFee ?? 0) === 0 && '—'}
                    </td>
                    <td className="text-sm">
                      {method.minAmount?.toLocaleString()} - {method.maxAmount?.toLocaleString() || '∞'}
                    </td>
                    <td>
                      <div className="tags">
                        {method.availableFor?.map((type) => (
                          <span key={type} className="tag">
                            {type}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge status-${method.status === 'ACTIVE' ? 'success' : 'secondary'}`}
                      >
                        {method.status}
                      </span>
                    </td>
                    <td>
                      <span className={method.configured ? 'badge status-success' : 'badge status-warning'}>
                        {method.configured ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={method.status === 'ACTIVE' ? 'secondary' : 'primary'}
                          onClick={() => handleToggleStatus(method)}
                          disabled={actionLoading || !canDeactivate(method)}
                          title={!canDeactivate(method) ? 'Cannot deactivate the last active method' : ''}
                        >
                          {method.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingMethod(method);
                            setShowForm(true);
                          }}
                          disabled={actionLoading}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(method.id)}
                          disabled={actionLoading}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {paymentMethods.length === 0 && !showForm && (
            <div className="empty-state">
              <p>No payment methods configured yet</p>
              <Button onClick={() => { setEditingMethod(null); setShowForm(true); }} className="btn btn-primary">
                Add First Payment Method
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminPaymentMethodsPage;