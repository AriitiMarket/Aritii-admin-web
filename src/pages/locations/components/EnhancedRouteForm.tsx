// Enhanced Route Form Component

import { useState, useEffect } from 'react';
import { Button } from '@/components/common/Button';
import { SelectField } from '@/components/forms/SelectField';
import { TextField } from '@/components/forms/TextField';
import { locationsService, routesService, type DeliveryRoute } from '@/services/locations.service';

interface EnhancedRouteFormProps {
  initial?: DeliveryRoute;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EnhancedRouteForm({
  initial,
  onSuccess,
  onCancel,
}: EnhancedRouteFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [code, setCode] = useState(initial?.code ?? '');
  const [originLocationId, setOriginLocationId] = useState(initial?.originLocationId ?? '');
  const [destinationLocationId, setDestinationLocationId] = useState(initial?.destinationLocationId ?? '');
  const [status, setStatus] = useState(initial?.status ?? 'active');
  const [distanceKm, setDistanceKm] = useState(initial?.distanceKm?.toString() ?? initial?.distance?.toString() ?? '');
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState(initial?.estimatedDurationMinutes?.toString() ?? initial?.estimatedDuration?.toString() ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [priority, setPriority] = useState(initial?.priority?.toString() ?? '5');
  const [maxCapacity, setMaxCapacity] = useState(initial?.maxCapacity?.toString() ?? '');
  
  const [locations, setLocations] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(initial?._id);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const locs = await locationsService.list();
      setLocations(locs);
    } catch (err) {
      console.error('Failed to load locations:', err);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!originLocationId) {
      setError('Origin location is required');
      return;
    }

    if (!destinationLocationId) {
      setError('Destination location is required');
      return;
    }

    setSaving(true);
    try {
      const routeData = {
        name: name.trim(),
        code: code.trim() || undefined,
        originLocationId,
        destinationLocationId,
        status,
        distanceKm: distanceKm ? parseFloat(distanceKm) : undefined,
        estimatedDurationMinutes: estimatedDurationMinutes ? parseInt(estimatedDurationMinutes) : undefined,
        description: description.trim(),
        priority: priority ? parseInt(priority) : 5,
        maxCapacity: maxCapacity ? parseInt(maxCapacity) : undefined,
      };

      if (isEditing) {
        await routesService.update(initial!._id, routeData);
      } else {
        await routesService.create(routeData);
      }
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save route';
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

      {/* Route Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold dark:text-white">Route Information</h3>
        
        <TextField
          label="Route Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Harar to Babile"
          required
        />

        <TextField
          label="Route Code (optional)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. HR-B01"
        />

        <SelectField
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'suspended', label: 'Suspended' },
            { value: 'archived', label: 'Archived' },
          ]}
        />
      </div>

      {/* Geographic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold dark:text-white">Geographic Information</h3>
        
        <SelectField
          label="Origin Location"
          value={originLocationId}
          onChange={(e) => setOriginLocationId(e.target.value)}
          options={[
            { value: '', label: 'Select Origin' },
            ...locations.map((loc) => ({ value: loc._id, label: loc.name })),
          ]}
          required
        />

        <SelectField
          label="Destination Location"
          value={destinationLocationId}
          onChange={(e) => setDestinationLocationId(e.target.value)}
          options={[
            { value: '', label: 'Select Destination' },
            ...locations.map((loc) => ({ value: loc._id, label: loc.name })),
          ]}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Distance (km)"
            value={distanceKm}
            onChange={(e) => setDistanceKm(e.target.value)}
            placeholder="e.g. 35"
            type="number"
          />
          <TextField
            label="Estimated Duration (minutes)"
            value={estimatedDurationMinutes}
            onChange={(e) => setEstimatedDurationMinutes(e.target.value)}
            placeholder="e.g. 60"
            type="number"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-dark-border bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-dark focus:ring-1 focus:ring-primary-dark dark:border-dark-600 dark:bg-dark-900 dark:text-white"
            placeholder="Optional description of this route"
          />
        </div>
      </div>

      {/* Operations */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold dark:text-white">Operations</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Priority (1-10)"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            placeholder="e.g. 5"
            type="number"
            min="1"
            max="10"
          />
          <TextField
            label="Max Capacity"
            value={maxCapacity}
            onChange={(e) => setMaxCapacity(e.target.value)}
            placeholder="e.g. 50"
            type="number"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-dark-600">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {isEditing ? 'Update Route' : 'Create Route'}
        </Button>
      </div>
    </form>
  );
}