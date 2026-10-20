import { useState, useEffect, type FormEvent } from 'react';
import promotionService, {
  type Promotion,
  type PromotionPayload,
} from '@/services/promotion.service';

/** The editable promotion fields; the extra keys are only set while editing. */
export interface PromotionFormData extends Omit<PromotionPayload, '_id'> {
  _id?: string;
  totalUsed?: number;
}

/**
 * ADMIN PROMOTIONS & EVENTS PAGE - Manage promotions and events
 */
export function AdminPromotionsEventsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('promotions');
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState<PromotionFormData>({
    name: '',
    code: '',
    description: '',
    discount: { type: 'percentage', value: 0 },
    minPurchase: 0,
    maxUses: null,
    usagePerUser: 1,
    validFrom: '',
    validUntil: '',
    applicableCategories: [],
    terms: '',
  });

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      setError(null);
      const { promotions: data } = await promotionService.getAll();
      setPromotions(data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message || 'Failed to load promotions'
          : 'Failed to load promotions'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setActionLoading(true);
      const payload = {
        ...formData,
        validFrom: new Date(formData.validFrom).toISOString(),
        validUntil: new Date(formData.validUntil).toISOString(),
      };

      if (editingPromotion) {
        await promotionService.update(editingPromotion._id, payload);
        setPromotions((prev) =>
          prev.map((p) => (p._id === editingPromotion._id ? { ...p, ...payload } : p))
        );
      } else {
        const result = await promotionService.create(payload);
        setPromotions((prev) => [result, ...prev]);
      }

      resetForm();
      setShowForm(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message || 'Failed to save promotion'
          : 'Failed to save promotion'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (promoId: string) => {
    if (!window.confirm('Delete this promotion?')) return;

    try {
      setActionLoading(true);
      await promotionService.remove(promoId);
      setPromotions((prev) => prev.filter((p) => p._id !== promoId));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message || 'Failed to delete promotion'
          : 'Failed to delete promotion'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (promo: Promotion) => {
    setEditingPromotion(promo);
    setFormData({
      ...promo,
      validFrom: new Date(promo.validFrom).toISOString().split('T')[0],
      validUntil: new Date(promo.validUntil).toISOString().split('T')[0],
    });
    setShowForm(true);
  };

  const validateForm = () => {
    if (!formData.name || !formData.code) {
      setError('Name and code are required');
      return false;
    }
    if (!formData.validFrom || !formData.validUntil) {
      setError('Valid from and until dates are required');
      return false;
    }
    if (new Date(formData.validFrom) >= new Date(formData.validUntil)) {
      setError('End date must be after start date');
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      discount: { type: 'percentage', value: 0 },
      minPurchase: 0,
      maxUses: null,
      usagePerUser: 1,
      validFrom: '',
      validUntil: '',
      applicableCategories: [],
      terms: '',
    });
    setEditingPromotion(null);
  };

  const getPromotionStatus = (promo: Promotion) => {
    const now = new Date();
    const start = new Date(promo.validFrom);
    const end = new Date(promo.validUntil);
    if (now < start) return 'upcoming';
    if (now > end) return 'expired';
    return 'active';
  };

  if (loading) {
    return <div className="loading-state"><p>Loading...</p></div>;
  }

  return (
    <div className="admin-promotions-page">
      <div className="page-header">
        <h1>Promotions & Events</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="btn btn-primary"
        >
          {showForm ? 'Cancel' : '+ New Promotion'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error" onClick={() => setError(null)}>
          {error} ✕
        </div>
      )}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'promotions' ? 'active' : ''}`}
          onClick={() => setActiveTab('promotions')}
        >
          Promotions ({promotions.length})
        </button>
        <button
          className={`tab ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          Events (0)
        </button>
      </div>

      {showForm && (
        <PromotionForm
          data={formData}
          onChange={(field, value) =>
            setFormData((prev) => ({ ...prev, [field]: value }))
          }
          onSubmit={handleCreate}
          onCancel={() => {
            setShowForm(false);
            resetForm();
          }}
          loading={actionLoading}
          isEditing={!!editingPromotion}
        />
      )}

      {activeTab === 'promotions' && (
        <div className="promotions-table">
          {promotions.length === 0 ? (
            <div className="empty-state">
              <p>No promotions yet. Create one to get started.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Discount</th>
                  <th>Validity</th>
                  <th>Status</th>
                  <th>Usage</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map((promo) => {
                  const status = getPromotionStatus(promo);
                  return (
                    <tr key={promo._id}>
                      <td>
                        <code className="code-cell">{promo.code}</code>
                      </td>
                      <td>{promo.name}</td>
                      <td>
                        {promo.discount.type === 'percentage'
                          ? `${promo.discount.value}%`
                          : `$${promo.discount.value}`}
                      </td>
                      <td>
                        <small>
                          {new Date(promo.validFrom).toLocaleDateString()} -
                          {' '}
                          {new Date(promo.validUntil).toLocaleDateString()}
                        </small>
                      </td>
                      <td>
                        <span className={`status-badge status-${
                          status === 'active' ? 'success' :
                          status === 'upcoming' ? 'warning' : 'secondary'
                        }`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <small>
                          {promo.maxUses ? `${promo.totalUsed || 0}/${promo.maxUses}` : 'Unlimited'}
                        </small>
                      </td>
                      <td>
                        <button
                          onClick={() => handleEdit(promo)}
                          disabled={actionLoading}
                          className="btn btn-sm btn-secondary"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(promo._id)}
                          disabled={actionLoading}
                          className="btn btn-sm btn-danger"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'events' && (
        <div className="empty-state">
          <p>Events management coming soon</p>
        </div>
      )}
    </div>
  );
}

/**
 * Promotion Form Component
 */
function PromotionForm({
  data,
  onChange,
  onSubmit,
  onCancel,
  loading,
  isEditing,
}: {
  data: PromotionFormData;
  onChange: (field: string, value: unknown) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  loading: boolean;
  isEditing: boolean;
}) {
  return (
    <div className="form-card promotion-form">
      <h2>{isEditing ? 'Edit Promotion' : 'New Promotion'}</h2>

      <form onSubmit={onSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Promo Code *</label>
            <input
              type="text"
              value={data.code}
              onChange={(e) => onChange('code', e.target.value.toUpperCase())}
              placeholder="SUMMER20"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => onChange('name', e.target.value)}
              placeholder="Summer Sale 20% Off"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            value={data.description}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="Promotion description..."
            rows={3}
            disabled={loading}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Discount Type *</label>
            <select
              value={data.discount.type}
              onChange={(e) =>
                onChange('discount', { ...data.discount, type: e.target.value })
              }
              disabled={loading}
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
          <div className="form-group">
            <label>Discount Value *</label>
            <input
              type="number"
              value={data.discount.value}
              onChange={(e) =>
                onChange('discount', {
                  ...data.discount,
                  value: parseFloat(e.target.value),
                })
              }
              placeholder="20"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Minimum Purchase</label>
            <input
              type="number"
              value={data.minPurchase}
              onChange={(e) => onChange('minPurchase', parseFloat(e.target.value))}
              placeholder="0"
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Max Uses</label>
            <input
              type="number"
              value={data.maxUses || ''}
              onChange={(e) => onChange('maxUses', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Leave empty for unlimited"
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Uses Per User</label>
            <input
              type="number"
              value={data.usagePerUser}
              onChange={(e) => onChange('usagePerUser', parseInt(e.target.value))}
              placeholder="1"
              min="1"
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Valid From *</label>
            <input
              type="date"
              value={data.validFrom}
              onChange={(e) => onChange('validFrom', e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Valid Until *</label>
            <input
              type="date"
              value={data.validUntil}
              onChange={(e) => onChange('validUntil', e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Terms & Conditions</label>
          <textarea
            value={data.terms}
            onChange={(e) => onChange('terms', e.target.value)}
            placeholder="Terms and conditions..."
            rows={4}
            disabled={loading}
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Saving...' : 'Save Promotion'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminPromotionsEventsPage;
