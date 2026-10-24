// Enhanced Location Form Component

import { useState, useEffect } from 'react';
import { Button } from '@/components/common/Button';
import { SelectField } from '@/components/forms/SelectField';
import { TextField } from '@/components/forms/TextField';
import { locationsService } from '@/services/locations.service';
import type { Location, LocationServiceability, PortInfo, ExpansionStatus } from '../types';

interface EnhancedLocationFormProps {
  initial?: Location;
  parentId?: string;
  parentType?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const CHILDREN_BY_TYPE: Record<string, string[]> = {
  // MVP geography: Region (optional) -> City. Zone and Port are separate models.
  country: ['region', 'city', 'other'],
  region: ['city', 'other'],
  city: ['other'],
  other: [],
};

function getSelectableTypes(parentType?: string): string[] {
  if (!parentType) {
    return ['country', 'region', 'city', 'rural'];
  }
  return CHILDREN_BY_TYPE[parentType] || [];
}

export function EnhancedLocationForm({
  initial,
  parentId,
  parentType,
  onSuccess,
  onCancel,
}: EnhancedLocationFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [localName, setLocalName] = useState(initial?.localName ?? '');
  const [type, setType] = useState(initial?.type ?? '');
  const [code, setCode] = useState(initial?.code ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [latitude, setLatitude] = useState(initial?.coordinates?.coordinates?.[1]?.toString() ?? '');
  const [longitude, setLongitude] = useState(initial?.coordinates?.coordinates?.[0]?.toString() ?? '');
  
  // Serviceability
  const [serviceable, setServiceable] = useState(initial?.serviceability?.serviceable ?? false);
  const [deliveryAvailable, setDeliveryAvailable] = useState(initial?.serviceability?.deliveryAvailable ?? false);
  const [pickupAvailable, setPickupAvailable] = useState(initial?.serviceability?.pickupAvailable ?? false);
  const [codAvailable, setCodAvailable] = useState(initial?.serviceability?.codAvailable ?? false);
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState(initial?.serviceability?.estimatedDeliveryTime ?? '');
  const [deliveryFee, setDeliveryFee] = useState(initial?.serviceability?.deliveryFee?.toString() ?? '');
  
  // Port
  const [isPort, setIsPort] = useState(initial?.port?.isPort ?? false);
  const [portName, setPortName] = useState(initial?.port?.portName ?? '');
  const [portCode, setPortCode] = useState(initial?.port?.portCode ?? '');
  const [portAddress, setPortAddress] = useState(initial?.port?.portAddress ?? '');
  const [portPhone, setPortPhone] = useState(initial?.port?.contactInfo?.phone ?? '');
  
  // Expansion
  const [expansionStatus, setExpansionStatus] = useState<ExpansionStatus>(initial?.expansionStatus ?? 'active');
  
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(initial?._id);
  const selectableTypes = getSelectableTypes(parentType);

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
      const serviceability: LocationServiceability = {
        serviceable,
        deliveryAvailable,
        pickupAvailable,
        codAvailable,
        estimatedDeliveryTime: estimatedDeliveryTime || undefined,
        deliveryFee: deliveryFee ? parseFloat(deliveryFee) : undefined,
      };

      const port: PortInfo = {
        isPort,
        portName: isPort ? portName : undefined,
        portCode: isPort ? portCode : undefined,
        portAddress: isPort ? portAddress : undefined,
        contactInfo: isPort ? { phone: portPhone } : undefined,
        operatingStatus: isPort ? 'active' : 'inactive',
      };

      const coordinates = latitude && longitude ? {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      } : undefined;

      const locationData = {
        name: name.trim(),
        localName: localName.trim() || undefined,
        type,
        code: code.trim() || undefined,
        description: description.trim(),
        isActive,
        coordinates,
        serviceability,
        port,
        expansionStatus,
      };

      if (isEditing) {
        await locationsService.update(initial!._id, locationData as any);
      } else {
        await locationsService.create({
          ...locationData,
          parentId: parentId || null,
        } as any);
      }
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save location';
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
          label="Location Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Harar, Addis Ababa"
          required
        />

        <TextField
          label="Local Name (optional)"
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          placeholder="e.g. ሐረር"
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
      </div>

      {/* Geographic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold dark:text-white">Geographic Information</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Latitude"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="e.g. 9.3125"
            type="number"
            step="any"
          />
          <TextField
            label="Longitude"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="e.g. 42.1180"
            type="number"
            step="any"
          />
        </div>
      </div>

      {/* Service Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold dark:text-white">Service Configuration</h3>
        
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
              checked={deliveryAvailable}
              onChange={(e) => setDeliveryAvailable(e.target.checked)}
              className="h-4 w-4 rounded border-dark-border text-primary-dark focus:ring-primary-dark"
            />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Delivery Available</label>
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
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={codAvailable}
              onChange={(e) => setCodAvailable(e.target.checked)}
              className="h-4 w-4 rounded border-dark-border text-primary-dark focus:ring-primary-dark"
            />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">COD Available</label>
          </div>
        </div>

        <TextField
          label="Estimated Delivery Time"
          value={estimatedDeliveryTime}
          onChange={(e) => setEstimatedDeliveryTime(e.target.value)}
          placeholder="e.g. 30-45 minutes"
        />

        <TextField
          label="Delivery Fee (ETB)"
          value={deliveryFee}
          onChange={(e) => setDeliveryFee(e.target.value)}
          placeholder="e.g. 50"
          type="number"
        />
      </div>

      {/* Port Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold dark:text-white">Port Configuration (Categorisation)</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Note: Active logistics dispatch and collection hubs are managed in the dedicated <strong>Ports</strong> workspace tab. Setting port metadata here classifies this location node.
        </p>
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isPort}
            onChange={(e) => setIsPort(e.target.checked)}
            className="h-4 w-4 rounded border-dark-border text-primary-dark focus:ring-primary-dark"
          />
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Is Port</label>
        </div>

        {isPort && (
          <div className="space-y-4 pl-4 border-l-2 border-gray-200 dark:border-dark-600">
            <TextField
              label="Port Name"
              value={portName}
              onChange={(e) => setPortName(e.target.value)}
              placeholder="e.g. Harar Central Port"
            />
            <TextField
              label="Port Code"
              value={portCode}
              onChange={(e) => setPortCode(e.target.value)}
              placeholder="e.g. HHC-001"
            />
            <TextField
              label="Port Address"
              value={portAddress}
              onChange={(e) => setPortAddress(e.target.value)}
              placeholder="Physical address"
            />
            <TextField
              label="Contact Phone"
              value={portPhone}
              onChange={(e) => setPortPhone(e.target.value)}
              placeholder="e.g. +251 911 123 456"
            />
          </div>
        )}
      </div>

      {/* Expansion Status */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold dark:text-white">Expansion Status</h3>
        
        <SelectField
          label="Status"
          value={expansionStatus}
          onChange={(e) => setExpansionStatus(e.target.value as ExpansionStatus)}
          options={[
            { value: 'planned', label: 'Planned' },
            { value: 'preparing', label: 'Preparing' },
            { value: 'testing', label: 'Testing' },
            { value: 'active', label: 'Active' },
            { value: 'suspended', label: 'Suspended' },
            { value: 'closed', label: 'Closed' },
          ]}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-dark-600">
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