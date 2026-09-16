/**
 * HierarchyNodeModal — Modal for creating or editing hierarchy nodes.
 *
 * Features:
 * - Create new node with parent context
 * - Edit existing node properties
 * - Validation
 * - Error handling
 */

import { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { TextField } from '@/components/forms/TextField';
import { Button } from '@/components/common/Button';
import type { HierarchyNodeData } from '@/services/hierarchyManager.service';

const LEVEL_NAMES: Record<string, string> = {
  region: 'Region',
  city: 'City',
  area: 'Area',
  sector: 'Sector',
  business: 'Business',
  shop: 'Shop',
};

export interface HierarchyNodeModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  node?: HierarchyNodeData;
  parentNode?: HierarchyNodeData;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
  loading?: boolean;
  error?: string;
}

export function HierarchyNodeModal({
  open,
  mode,
  node,
  parentNode,
  onSave,
  onClose,
  loading = false,
  error,
}: HierarchyNodeModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    isActive: true,
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && node) {
      setFormData({
        name: node.name,
        code: node.code || '',
        description: node.description || '',
        isActive: node.isActive,
      });
    } else if (mode === 'create') {
      setFormData({
        name: '',
        code: '',
        description: '',
        isActive: true,
      });
    }
    setValidationErrors({});
  }, [open, mode, node]);

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!formData.name || formData.name.trim().length === 0) {
      errors.name = 'Name is required';
    }

    if (formData.name && formData.name.length > 100) {
      errors.name = 'Name must be less than 100 characters';
    }

    if (formData.code && formData.code.length > 20) {
      errors.code = 'Code must be less than 20 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const payload =
        mode === 'create' && parentNode
          ? {
              name: formData.name,
              type: getChildType(parentNode.type),
              parentId: parentNode.id,
              code: formData.code || undefined,
              description: formData.description || undefined,
            }
          : {
              name: formData.name,
              code: formData.code || undefined,
              description: formData.description || undefined,
              isActive: formData.isActive,
            };

      await onSave(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const getChildType = (parentType: string): string => {
    const typeMap: Record<string, string> = {
      region: 'city',
      city: 'area',
      area: 'sector',
      sector: 'business',
      business: 'shop',
    };
    return typeMap[parentType] || 'region';
  };

  const title =
    mode === 'create'
      ? `Create ${parentNode ? LEVEL_NAMES[getChildType(parentNode.type)] : 'Region'}`
      : `Edit ${node ? LEVEL_NAMES[node.type] : 'Node'}`;

  const subtitle =
    mode === 'create' && parentNode
      ? `Under ${LEVEL_NAMES[parentNode.type]}: ${parentNode.name}`
      : node
        ? `ID: ${node.id}`
        : '';

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        {error && (
          <div className="rounded bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded bg-blue-50 p-3 text-sm text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            Processing...
          </div>
        )}

        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}

        {/* Name */}
        <TextField
          label="Name"
          value={formData.name}
          onChange={(val) => {
            setFormData((prev) => ({ ...prev, name: val }));
            if (validationErrors.name) {
              setValidationErrors((prev) => {
                const next = { ...prev };
                delete next.name;
                return next;
              });
            }
          }}
          placeholder="e.g., East Africa, Nairobi, Quick Commerce"
          error={validationErrors.name}
          disabled={saving}
        />

        {/* Code */}
        <TextField
          label="Code (optional)"
          value={formData.code}
          onChange={(val) => {
            setFormData((prev) => ({ ...prev, code: val }));
            if (validationErrors.code) {
              setValidationErrors((prev) => {
                const next = { ...prev };
                delete next.code;
                return next;
              });
            }
          }}
          placeholder="e.g., EA, NBO"
          error={validationErrors.code}
          disabled={saving}
        />

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description (optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Add notes or context..."
            disabled={saving}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-dark-600 dark:bg-dark-800 dark:text-white"
            rows={3}
          />
        </div>

        {/* Active toggle (edit mode only) */}
        {mode === 'edit' && (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
              }
              disabled={saving}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Active
            </span>
          </label>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            loading={saving}
          >
            {mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
