import { useCallback, useEffect, useState } from 'react';

/** A commission override for one seller (or one seller type). */
export interface SellerCommissionVariation {
  sellerId: string;
  sellerType: string;
  commission: number;
}

/** A commission override for one product category. */
export interface CategoryCommission {
  category: string;
  commission: number;
}

/** The per-transaction fee breakdown. */
export interface TransactionFeeStructure {
  orderCommission: number;
  refundFee: number;
  payoutFee: number;
  walletTransferFee: number;
}

/** The commission configuration edited by this page. */
export interface CommissionSettings {
  commissionRate: number;
  deliveryFee: number;
  taxRate: number;
  expressDeliveryMultiplier: number;
  minOrderAmount: number;
  maxOrderAmount: number;
  sellerCommissionVariations: SellerCommissionVariation[];
  categoryCommissions: CategoryCommission[];
  transactionFeeStructure: TransactionFeeStructure;
}

/** One recorded commission change. */
export interface CommissionChangeEntry {
  _id: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  changedBy?: string;
  reason?: string;
  changedAt?: string;
}

/**
 * ADMIN COMMISSION CONFIGURATION PAGE
 * Dynamic configuration for platform commission rates on orders, sellers, and other transaction types
 */
export function AdminCommissionSettingsPage() {
  const [settings, setSettings] = useState<CommissionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [commissionHistory, setCommissionHistory] = useState<CommissionChangeEntry[]>([]);
  const [formData, setFormData] = useState<CommissionSettings>({
    commissionRate: 10,
    deliveryFee: 50,
    taxRate: 0,
    expressDeliveryMultiplier: 1.5,
    minOrderAmount: 100,
    maxOrderAmount: 50000,
    sellerCommissionVariations: [],
    categoryCommissions: [],
    transactionFeeStructure: {
      orderCommission: 10,
      refundFee: 0,
      payoutFee: 0,
      walletTransferFee: 0,
    },
  });

  const loadCommissionHistory = useCallback(async () => {
    try {
      const response = await fetch('/settings/platform/audit');
      if (!response.ok) return;
      const data = await response.json();
      setCommissionHistory(data.data || data || []);
    } catch (err) {
      console.error('Commission history load error:', err);
    }
  }, []);

  const loadCommissionSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load platform settings from backend
      const response = await fetch('/settings/platform');
      if (!response.ok) {
        throw new Error(`Failed to load settings: ${response.statusText}`);
      }

      const data = await response.json();
      const platformSettings = data.data || data;

      setSettings(platformSettings);
      setFormData({
        commissionRate: platformSettings.commissionRate ?? 10,
        deliveryFee: platformSettings.deliveryFee ?? 50,
        taxRate: platformSettings.taxRate ?? 0,
        expressDeliveryMultiplier: platformSettings.expressDeliveryMultiplier ?? 1.5,
        minOrderAmount: platformSettings.minOrderAmount ?? 100,
        maxOrderAmount: platformSettings.maxOrderAmount ?? 50000,
        sellerCommissionVariations: platformSettings.sellerCommissionVariations || [],
        categoryCommissions: platformSettings.categoryCommissions || [],
        transactionFeeStructure: platformSettings.transactionFeeStructure || {
          orderCommission: 10,
          refundFee: 0,
          payoutFee: 0,
          walletTransferFee: 0,
        },
      });
      await loadCommissionHistory();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message || 'Failed to load commission settings'
          : 'Failed to load commission settings'
      );
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [loadCommissionHistory]);

  useEffect(() => {
    loadCommissionSettings();
  }, [loadCommissionSettings]);

  const handleSaveSettings = async () => {
    try {
      setSaveLoading(true);
      setError(null);

      // Validate form data
      if (!validateSettings()) return;

      const previousRate = Number(settings?.commissionRate ?? 10);
      const nextRate = Number(formData.commissionRate);
      const commissionChanged = previousRate !== nextRate ||
        JSON.stringify(settings?.categoryCommissions || []) !== JSON.stringify(formData.categoryCommissions || []) ||
        JSON.stringify(settings?.sellerCommissionVariations || []) !== JSON.stringify(formData.sellerCommissionVariations || []);
      let reason = '';
      if (commissionChanged) {
        reason = window.prompt('Reason for this commission change:')?.trim() || '';
        if (!reason) {
          setError('Reason required for commission changes');
          return;
        }
        const confirmationText = previousRate !== nextRate
          ? `Change default commission from ${previousRate}% to ${nextRate}%? Applies to new orders only.`
          : 'Change commission rates? Changes apply to new orders only.';
        const confirmed = window.confirm(confirmationText);
        if (!confirmed) return;
      }

      // Save to backend
      const response = await fetch('/settings/platform', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, ...(reason ? { reason } : {}) }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save settings: ${response.statusText}`);
      }

      const result = await response.json();
      setSettings(result.data || result);
      await loadCommissionHistory();
      setEditMode(false);
      setSuccessMessage('Commission settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message || 'Failed to save settings'
          : 'Failed to save settings'
      );
      console.error('Save error:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const validateSettings = () => {
    if (!Number.isFinite(formData.commissionRate) || formData.commissionRate < 0 || formData.commissionRate > 100) {
      setError('Commission rate must be between 0 and 100%');
      return false;
    }
    if (Math.round(formData.commissionRate * 100) !== formData.commissionRate * 100) {
      setError('Commission rate can have at most 2 decimal places');
      return false;
    }
    if (formData.taxRate < 0 || formData.taxRate > 100) {
      setError('Tax rate must be between 0 and 100%');
      return false;
    }
    if (formData.minOrderAmount >= formData.maxOrderAmount) {
      setError('Minimum order amount must be less than maximum');
      return false;
    }
    if (formData.expressDeliveryMultiplier < 1) {
      setError('Express delivery multiplier must be at least 1');
      return false;
    }
    return true;
  };

  const addSellerCommissionVariation = () => {
    setFormData((prev) => ({
      ...prev,
      sellerCommissionVariations: [
        ...prev.sellerCommissionVariations,
        { sellerId: '', sellerType: '', commission: 10 },
      ],
    }));
  };

  const removeSellerCommissionVariation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      sellerCommissionVariations: prev.sellerCommissionVariations.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const addCategoryCommission = () => {
    setFormData((prev) => ({
      ...prev,
      categoryCommissions: [
        ...prev.categoryCommissions,
        { category: '', commission: 10 },
      ],
    }));
  };

  const removeCategoryCommission = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      categoryCommissions: prev.categoryCommissions.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return <div className="loading-state"><p>Loading commission settings...</p></div>;
  }

  return (
    <div className="admin-commission-settings-page">
      <div className="page-header">
        <div>
          <h1>Commission Configuration</h1>
          <p>Configure platform commission rates for orders, sellers, and transaction types</p>
        </div>
        <button
          onClick={() => (editMode ? setEditMode(false) : setEditMode(true))}
          className="btn btn-primary"
        >
          {editMode ? 'Cancel' : 'Edit Settings'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error" onClick={() => setError(null)}>
          {error} ✕
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success" onClick={() => setSuccessMessage('')}>
          {successMessage} ✓
        </div>
      )}

      <div className="commission-settings">
        {/* Main Commission Section */}
        <div className="settings-section">
          <h2>Primary Commission Settings</h2>

          <div className="form-row">
            <div className="form-group">
              <label>Platform Commission Rate (%)</label>
              {editMode ? (
                <input
                  type="number"
                  value={formData.commissionRate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      commissionRate: parseFloat(e.target.value),
                    }))
                  }
                  min="0"
                  max="100"
                  step="0.1"
                  disabled={saveLoading}
                />
              ) : (
                <span className="display-value">{formData.commissionRate}%</span>
              )}
              <small>Applied to order subtotal for all sellers</small>
            </div>

            <div className="form-group">
              <label>Default Delivery Fee (ETB)</label>
              {editMode ? (
                <input
                  type="number"
                  value={formData.deliveryFee}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      deliveryFee: parseFloat(e.target.value),
                    }))
                  }
                  min="0"
                  step="10"
                  disabled={saveLoading}
                />
              ) : (
                <span className="display-value">{formData.deliveryFee} ETB</span>
              )}
              <small>Default delivery cost per order</small>
            </div>

            <div className="form-group">
              <label>Tax Rate (%)</label>
              {editMode ? (
                <input
                  type="number"
                  value={formData.taxRate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      taxRate: parseFloat(e.target.value),
                    }))
                  }
                  min="0"
                  max="100"
                  step="0.1"
                  disabled={saveLoading}
                />
              ) : (
                <span className="display-value">{formData.taxRate}%</span>
              )}
              <small>Platform tax on orders</small>
            </div>
          </div>
        </div>

        {/* Order Amount Limits */}
        <div className="settings-section">
          <h2>Order Amount Limits</h2>

          <div className="form-row">
            <div className="form-group">
              <label>Minimum Order Amount (ETB)</label>
              {editMode ? (
                <input
                  type="number"
                  value={formData.minOrderAmount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      minOrderAmount: parseFloat(e.target.value),
                    }))
                  }
                  min="0"
                  step="10"
                  disabled={saveLoading}
                />
              ) : (
                <span className="display-value">{formData.minOrderAmount} ETB</span>
              )}
            </div>

            <div className="form-group">
              <label>Maximum Order Amount (ETB)</label>
              {editMode ? (
                <input
                  type="number"
                  value={formData.maxOrderAmount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      maxOrderAmount: parseFloat(e.target.value),
                    }))
                  }
                  min="0"
                  step="10"
                  disabled={saveLoading}
                />
              ) : (
                <span className="display-value">{formData.maxOrderAmount} ETB</span>
              )}
            </div>

            <div className="form-group">
              <label>Express Delivery Multiplier</label>
              {editMode ? (
                <input
                  type="number"
                  value={formData.expressDeliveryMultiplier}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      expressDeliveryMultiplier: parseFloat(e.target.value),
                    }))
                  }
                  min="1"
                  max="5"
                  step="0.1"
                  disabled={saveLoading}
                />
              ) : (
                <span className="display-value">{formData.expressDeliveryMultiplier}x</span>
              )}
              <small>Multiplier for express delivery cost</small>
            </div>
          </div>
        </div>

        {/* Transaction Fee Structure */}
        <div className="settings-section">
          <h2>Transaction Fee Structure</h2>

          <div className="form-row">
            <div className="form-group">
              <label>Order Commission Fee (%)</label>
              {editMode ? (
                <input
                  type="number"
                  value={formData.transactionFeeStructure.orderCommission}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      transactionFeeStructure: {
                        ...prev.transactionFeeStructure,
                        orderCommission: parseFloat(e.target.value),
                      },
                    }))
                  }
                  min="0"
                  max="100"
                  step="0.1"
                  disabled={saveLoading}
                />
              ) : (
                <span className="display-value">
                  {formData.transactionFeeStructure.orderCommission}%
                </span>
              )}
              <small>Platform commission on order value</small>
            </div>

            <div className="form-group">
              <label>Refund Processing Fee (%)</label>
              {editMode ? (
                <input
                  type="number"
                  value={formData.transactionFeeStructure.refundFee}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      transactionFeeStructure: {
                        ...prev.transactionFeeStructure,
                        refundFee: parseFloat(e.target.value),
                      },
                    }))
                  }
                  min="0"
                  max="100"
                  step="0.1"
                  disabled={saveLoading}
                />
              ) : (
                <span className="display-value">
                  {formData.transactionFeeStructure.refundFee}%
                </span>
              )}
              <small>Fee charged for refund processing</small>
            </div>

            <div className="form-group">
              <label>Payout Processing Fee (%)</label>
              {editMode ? (
                <input
                  type="number"
                  value={formData.transactionFeeStructure.payoutFee}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      transactionFeeStructure: {
                        ...prev.transactionFeeStructure,
                        payoutFee: parseFloat(e.target.value),
                      },
                    }))
                  }
                  min="0"
                  max="100"
                  step="0.1"
                  disabled={saveLoading}
                />
              ) : (
                <span className="display-value">
                  {formData.transactionFeeStructure.payoutFee}%
                </span>
              )}
              <small>Fee for seller payout transactions</small>
            </div>

            <div className="form-group">
              <label>Wallet Transfer Fee (%)</label>
              {editMode ? (
                <input
                  type="number"
                  value={formData.transactionFeeStructure.walletTransferFee}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      transactionFeeStructure: {
                        ...prev.transactionFeeStructure,
                        walletTransferFee: parseFloat(e.target.value),
                      },
                    }))
                  }
                  min="0"
                  max="100"
                  step="0.1"
                  disabled={saveLoading}
                />
              ) : (
                <span className="display-value">
                  {formData.transactionFeeStructure.walletTransferFee}%
                </span>
              )}
              <small>Fee for wallet transfers</small>
            </div>
          </div>
        </div>

        {/* Seller Commission Variations */}
        {editMode && (
          <div className="settings-section">
            <div className="section-header">
              <h2>Seller-Specific Commission Variations</h2>
              <button onClick={addSellerCommissionVariation} className="btn btn-sm btn-secondary">
                + Add Variation
              </button>
            </div>

            <div className="variations-list">
              {formData.sellerCommissionVariations.map((variation, index) => (
                <div key={index} className="variation-item">
                  <input
                    type="text"
                    placeholder="Seller ID (optional)"
                    value={variation.sellerId || ''}
                    onChange={(e) => {
                      const updated = [...formData.sellerCommissionVariations];
                      updated[index].sellerId = e.target.value;
                      setFormData((prev) => ({ ...prev, sellerCommissionVariations: updated }));
                    }}
                    disabled={saveLoading}
                  />
                  <select
                    value={variation.sellerType}
                    onChange={(e) => {
                      const updated = [...formData.sellerCommissionVariations];
                      updated[index].sellerType = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        sellerCommissionVariations: updated,
                      }));
                    }}
                    disabled={saveLoading}
                  >
                    <option value="">Select Seller Type (optional)</option>
                    <option value="INDIVIDUAL">Individual Seller</option>
                    <option value="BUSINESS">Business</option>
                    <option value="PREMIUM">Premium Seller</option>
                    <option value="BRAND">Brand Partner</option>
                  </select>

                  <input
                    type="number"
                    placeholder="Commission %"
                    value={variation.commission}
                    onChange={(e) => {
                      const updated = [...formData.sellerCommissionVariations];
                      updated[index].commission = parseFloat(e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        sellerCommissionVariations: updated,
                      }));
                    }}
                    min="0"
                    max="100"
                    step="0.1"
                    disabled={saveLoading}
                  />

                  <button
                    onClick={() => removeSellerCommissionVariation(index)}
                    className="btn btn-sm btn-danger"
                    disabled={saveLoading}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category-Based Commissions */}
        {editMode && (
          <div className="settings-section">
            <div className="section-header">
              <h2>Category-Based Commission Rates</h2>
              <button onClick={addCategoryCommission} className="btn btn-sm btn-secondary">
                + Add Category
              </button>
            </div>

            <div className="categories-list">
              {formData.categoryCommissions.map((cat, index) => (
                <div key={index} className="category-item">
                  <input
                    type="text"
                    placeholder="Category name"
                    value={cat.category}
                    onChange={(e) => {
                      const updated = [...formData.categoryCommissions];
                      updated[index].category = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        categoryCommissions: updated,
                      }));
                    }}
                    disabled={saveLoading}
                  />

                  <input
                    type="number"
                    placeholder="Commission %"
                    value={cat.commission}
                    onChange={(e) => {
                      const updated = [...formData.categoryCommissions];
                      updated[index].commission = parseFloat(e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        categoryCommissions: updated,
                      }));
                    }}
                    min="0"
                    max="100"
                    step="0.1"
                    disabled={saveLoading}
                  />

                  <button
                    onClick={() => removeCategoryCommission(index)}
                    className="btn btn-sm btn-danger"
                    disabled={saveLoading}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Commission Calculator Preview */}
        <div className="settings-section">
          <h2>Commission History</h2>
          {commissionHistory.length === 0 ? (
            <p>No commission changes recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table>
                <thead><tr><th>Field</th><th>Old value</th><th>New value</th><th>Admin</th><th>Reason</th><th>Date</th></tr></thead>
                <tbody>
                  {commissionHistory.map((entry) => (
                    <tr key={entry._id}>
                      <td>{entry.field}</td>
                      <td>{JSON.stringify(entry.oldValue)}</td>
                      <td>{JSON.stringify(entry.newValue)}</td>
                      <td>{entry.changedBy || 'Unknown'}</td>
                      <td>{entry.reason || '—'}</td>
                      <td>{entry.changedAt ? new Date(entry.changedAt).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Commission Calculator Preview */}
        <div className="settings-section">
          <h2>Commission Calculator (Preview)</h2>
          <CommissionCalculator settings={formData} />
        </div>

        {/* Action Buttons */}
        {editMode && (
          <div className="settings-actions">
            <button
              onClick={handleSaveSettings}
              disabled={saveLoading}
              className="btn btn-primary btn-lg"
            >
              {saveLoading ? 'Saving...' : 'Save Commission Settings'}
            </button>
            <button
              onClick={() => setEditMode(false)}
              disabled={saveLoading}
              className="btn btn-secondary btn-lg"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Commission Calculator Component
 */
function CommissionCalculator({ settings }: { settings: CommissionSettings }) {
  const [orderAmount, setOrderAmount] = useState(10000);

  const calculateCommission = () => {
    const commission = (orderAmount * settings.commissionRate) / 100;
    const tax = (orderAmount * settings.taxRate) / 100;
    const sellerEarnings = orderAmount - commission - tax;

    return {
      orderAmount,
      commission,
      tax,
      sellerEarnings,
      totalCost: orderAmount + settings.deliveryFee,
    };
  };

  const calc = calculateCommission();

  return (
    <div className="commission-calculator">
      <div className="calculator-input">
        <label>Test Order Amount (ETB):</label>
        <input
          type="number"
          value={orderAmount}
          onChange={(e) => setOrderAmount(parseFloat(e.target.value))}
          min="0"
          step="100"
        />
      </div>

      <div className="calculator-output">
        <div className="calc-row">
          <span className="label">Order Subtotal:</span>
          <span className="value">{calc.orderAmount.toLocaleString()} ETB</span>
        </div>
        <div className="calc-row">
          <span className="label">Platform Commission ({settings.commissionRate}%):</span>
          <span className="value">-{calc.commission.toLocaleString()} ETB</span>
        </div>
        <div className="calc-row">
          <span className="label">Tax ({settings.taxRate}%):</span>
          <span className="value">-{calc.tax.toLocaleString()} ETB</span>
        </div>
        <div className="calc-row">
          <span className="label">Delivery Fee:</span>
          <span className="value">+{settings.deliveryFee.toLocaleString()} ETB</span>
        </div>
        <div className="calc-row total">
          <span className="label">Seller Earnings:</span>
          <span className="value">{calc.sellerEarnings.toLocaleString()} ETB</span>
        </div>
        <div className="calc-row total">
          <span className="label">Customer Total:</span>
          <span className="value">{calc.totalCost.toLocaleString()} ETB</span>
        </div>
      </div>
    </div>
  );
}

export default AdminCommissionSettingsPage;
