import { useEffect, useState } from 'react';
import { Button } from '@/components/common/Button';
import { SelectField } from '@/components/common/SelectField';
import { TextField } from '@/components/common/TextField';
import {
  locationsService,
  type Location,
} from '@/services/locations.service';

interface LocationFormProps {
  /** Existing location to edit. Pass `undefined` for create mode. */
  initial?: Location;
  /** Pre-selected parent (from context, e.g. "add child" button). */
  parentId?: string;
  /** Parent's type — used to constrain allowed child types. */
  parentType?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

/** Allowed child types for each parent type (matches delivery-service constants). */
const CHILDREN_BY_TYPE: Record<string, string[]> = {
  country: ['region'],
  region: ['city', 'area', 'sector'],
  city: ['town', 'area', 'sector'],
  town: ['area', 'sector'],
  area: ['sector', 'community'],
  sector: ['community', 'village'],
  community: ['village'],
  village: [],
  rural: ['community', 'village'],
  other: ['sector', 'community'],
};

function getSelectableTypes(parentType?: string): string[] {
  if (!parentType) {
    // Root types: locations without a parent
    return ['country', 'region', 'city', 'rural'];
  }
  return CHILDREN_BY_TYPE[parentType] || [];
}

export function LocationForm({
  initial,
  parentId,
  parentType,
  onSuccess,
  onCancel,
}: LocationFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState(initial?.type ?? '');
  const [code, setCode] = useState(initial?.code ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(initial?._id);
  const selectableTypes = getSelectableTypes(parentType);

  // If there's only one selectable type, auto-select it
  useEffect(() => {
    if (!isEditing && selectableTypes.length === 1 && !type) {
      setType(selectableTypes[0]);
    }
  }, [isEditing, selectableTypes, type]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!type) {
      setError('Type is required');
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await locationsService.update(initial!._id, {
          name: name.trim(),
          type,
          code: code.trim() || undefined,
          description: description.trim(),
          isActive,
        });
      } else {
        await locationsService.create({
          name: name.trim(),
          type,
          parentId: parentId || null,
          code: code.trim() || undefined,
          description: description.trim(),
          isActive,
        });
      }
      onSuccess();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to save location';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <TextField
        label="Location Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Harari Region, Addis Ababa"
        required
      />

      <SelectField
        label="Type"
        value={type}
        onChange={(e) => setType(e.target.value)}
        disabled={isEditing || selectableTypes.length <= 1}
        options={selectableTypes.map((t) => ({
          label: t.charAt(0).toUpperCase() + t.slice(1),
          value: t,
        }))}
        required
      />

      {parentType && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Creating as child of <strong>{parentType}</strong>
        </p>
      )}

      <TextField
        label="Code (optional)"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="e.g. ET-HA, AA"
      />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-dark-border bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-dark focus:ring-1 focus:ring-primary-dark dark:border-dark-600 dark:bg-dark-900 dark:text-white"
          placeholder="Optional description of this location"
        />
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-dark-border text-primary-dark focus:ring-primary-dark"
          />
          Active
        </label>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          Inactive locations cannot be used for new orders
        </span>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {isEditing ? 'Update Location' : 'Create Location'}
        </Button>
      </div>
    </form>
  );
}
