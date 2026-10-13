// Enhanced Zone Form Component

import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { SelectField } from '@/components/forms/SelectField';
import { TextField } from '@/components/forms/TextField';
import { zonesService, type Zone } from '@/services/locations.service';
import type { ZoneCoverage, DeliveryRules, OperationalRules } from '../types';

interface EnhancedZoneFormProps {
  initial?: Zone;
  /** Locations the zone can cover. Loaded by the tab and passed in. */
  locations: { _id: string; name: string; type: string; code?: string | null }[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function EnhancedZoneForm({
  initial,
  locations,
  onSuccess,
  onCancel,
}: EnhancedZoneFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [code, setCode] = useState(initial?.code ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [status, setStatus] = useState(initial?.status ?? 'active');
  const [selectedLocations, setSelectedLocations] = useState<string[]>(initial?.locationIds || []);
  
  // Coverage
  const [radiusKm, setRadiusKm] = useState(initial?.coverage?.radiusKm?.toString() ?? '');
  
  // Delivery Rules
  const [serviceable, setServiceable] = useState(initial?.deliveryRules?.serviceable ?? true);
  const [deliveryFee, setDeliveryFee] = useState(initial?.deliveryRules?.deliveryFee?.toString() ?? '');
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(initial?.deliveryRules?.freeDeliveryThreshold?.toString() ?? '');
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState(initial?.deliveryRules?.estimatedDeliveryTime ?? '');
  const [minimumOrder, setMinimumOrder] = useState(initial?.deliveryRules?.minimumOrder?.toString() ?? '');
  const [codAvailable, setCodAvailable] = useState(initial?.deliveryRules?.codAvailable ?? true);
  const [pickupAvailable, setPickupAvailable] = useState(initial?.deliveryRules?.pickupAvailable ?? false);
  
  // Operational Rules
  const [priority, setPriority] = useState(initial?.priority?.toString() ?? '5');
  const [portId, setPortId] = useState(initial?.portId ?? '');
  
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(initial?._id);

  const toggleLocation = (locId: string) => {
    setSelectedLocations((prev) =>
      prev.includes(locId) ? prev.filter((id) => id !== locId) : [...prev, locId]
    );
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!code.trim()) {
      setError('Code is required');
      return;
    }

    setSaving(true);
    try {
      const coverage: ZoneCoverage = {
        radiusKm: radiusKm ? parseFloat(radiusKm) : undefined,
      };

      const deliveryRules: DeliveryRules = {
        serviceable,
        deliveryFee: deliveryFee ? parseFloat(deliveryFee) : 0,
        freeDeliveryThreshold: freeDeliveryThreshold ? parseFloat(freeDeliveryThreshold) : undefined,
        estimatedDeliveryTime: estimatedDeliveryTime || '30-45 min',
        minimumOrder: minimumOrder ? parseFloat(minimumOrder) : undefined,
        codAvailable,
        pickupAvailable,
      };

      const operationalRules: OperationalRules = {
        priority: priority ? parseInt(priority) : 5,
        portId: portId || undefined,
      };

      const zoneData = {
        name: name.trim(),
        code: code.trim(),
        description: description.trim(),
        status,
        locationIds: selectedLocations,
        coverage: coverage as any,
        deliveryRules,
        operationalRules,
      };

      if (isEditing) {
        await zonesService.update(initial!._id, zoneData);
      } else {
        await zonesService.create(zoneData);
      }
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save zone';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold dark:text-white">Basic Information</h3>
        
        <TextField
          label="Zone Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Harar Central Zone"
          required
        />

        <TextField
          label="Zone Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. HZ-001"
          required
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
            placeholder="Optional description of this zone"
          />
        </div>

        <SelectField
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'suspended', label: 'Suspended' },
          ]}
        />
      </div>

      {/* Coverage */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold dark:text-white">Coverage</h3>
        
        <TextField
          label="Radius (km)"
          value={radiusKm}
          onChange={(e) => setRadiusKm(e.target.value)}
          placeholder="e.g. 5"
          type="number"
        />

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Coverage Locations (Cities)
          </label>
          <div className="max-h-48 overflow-y-auto rounded-md border border-gray-200 p-3 dark:border-dark-600">
            {locations.length === 0 ? (
              <p className="text-sm text-gray-500">No cities available</p>
            ) : (
              locations.map((loc) => (
                <label
                  key={loc._id}
                  className="flex items-center gap-2 py-1 text-sm hover:bg-gray-50 dark:hover:bg-dark-800"
                >
                  <input
                    type="checkbox"
                    checked={selectedLocations.includes(loc._id)}
                    onChange={() => toggleLocation(loc._id)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-gray-800 dark:text-gray-100">{loc.name}</span>
                  {loc.code && <span className="text-xs text-gray-400">({loc.code})</span>}
                </label>
              ))
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {selectedLocations.length} location{selectedLocations.length === 1 ? '' : 's'} selected
          </p>
        </div>
      </div>

      {/* Delivery Rules */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold dark:text-white">Delivery Rules</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={serviceable}
              onChange={(e) => setServiceable(e.target.checked)}
              className="h-4 w-4 rounded border-dark-border text-primary-dark focus:ring-primary-dark"
            />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Serviceable</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={codAvailable}
              onChange={(e) => setCodAvailable(e.target.checked)}
              className="h-4 w-4 rounded border-dark-border text-primary-dark focus:ring-primary-dark"
            />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">COD Available</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={pickupAvailable}
              onChange={(e) => setPickupAvailable(e.target.checked)}
              className="h-4 w-4 rounded border-dark-border text-primary-dark focus:ring-primary-dark"
            />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Pickup Available</label>
          </div>
        </div>

        <TextField
          label="Delivery Fee (ETB)"
          value={deliveryFee}
          onChange={(e) => setDeliveryFee(e.target.value)}
          placeholder="e.g. 50"
          type="number"
        />

        <TextField
          label="Free Delivery Threshold (ETB)"
          value={freeDeliveryThreshold}
          onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
          placeholder="e.g. 200"
          type="number"
        />

        <TextField
          label="Estimated Delivery Time"
          value={estimatedDeliveryTime}
          onChange={(e) => setEstimatedDeliveryTime(e.target.value)}
          placeholder="e.g. 30-45 minutes"
        />

        <TextField
          label="Minimum Order (ETB)"
          value={minimumOrder}
          onChange={(e) => setMinimumOrder(e.target.value)}
          placeholder="e.g. 100"
          type="number"
        />
      </div>

      {/* Operational Rules */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold dark:text-white">Operational Rules</h3>
        
        <TextField
          label="Priority (1-10)"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          placeholder="e.g. 5"
          type="number"
          min="1"
          max="10"
        />

        <SelectField
          label="Port"
          value={portId}
          onChange={(e) => setPortId(e.target.value)}
          options={[
            { value: '', label: 'No Port' },
            // Will be populated with actual ports
          ]}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-dark-600">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {isEditing ? 'Update Zone' : 'Create Zone'}
        </Button>
      </div>
    </form>
  );
}