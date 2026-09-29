import { useEffect, useState } from 'react';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { TextField } from '@/components/forms/TextField';
import { SelectField } from '@/components/forms/SelectField';
import { useAsync } from '@/hooks/useAsync';
import { zonesService } from '@/services/locations.service';
import { ApiError } from '@/types/api';
import {
  DELIVERY_SERVICE_STATUSES,
  DELIVERY_SERVICE_TYPES,
  deliveryServicesService,
  type DeliveryService,
  type DeliveryServiceStatus,
} from '@/services/deliveryServices.service';

interface Draft {
  name: string;
  code: string;
  description: string;
  serviceType: string;
  status: DeliveryServiceStatus;
  baseFee: string;
  perKmFee: string;
  maxWeightKg: string;
  estimatedDurationMinutes: string;
  coverageZones: string[];
}

const EMPTY: Draft = {
  name: '',
  code: '',
  description: '',
  serviceType: 'standard',
  status: 'active',
  baseFee: '50',
  perKmFee: '10',
  maxWeightKg: '50',
  estimatedDurationMinutes: '60',
  coverageZones: [],
};

/**
 * Add / Edit a delivery service (catalog row).
 *
 * Covers everything the catalog exposes: name/code, type, status, pricing,
 * capacity, duration and zone coverage. Codes must be unique — the backend
 * answers 409 and the message is shown inline.
 */
export function DeliveryServiceForm({
  open,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean;
  initial?: DeliveryService | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: allZones } = useAsync(() => zonesService.list({ page: 1, limit: 200 }), [open]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setDraft(
      initial
        ? {
            name: initial.name ?? '',
            code: initial.code ?? '',
            description: initial.description ?? '',
            serviceType: initial.serviceType || 'standard',
            status: initial.status ?? 'active',
            baseFee: String(initial.baseFee ?? 0),
            perKmFee: String(initial.perKmFee ?? 0),
            maxWeightKg: String(initial.maxWeightKg ?? 50),
            estimatedDurationMinutes: String(initial.estimatedDurationMinutes ?? 60),
            coverageZones: initial.coverageZones ?? [],
          }
        : EMPTY
    );
  }, [open, initial]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const toggleZone = (id: string) =>
    setDraft((d) => ({
      ...d,
      coverageZones: d.coverageZones.includes(id)
        ? d.coverageZones.filter((z) => z !== id)
        : [...d.coverageZones, id],
    }));

  const save = async () => {
    const name = draft.name.trim();
    const code = draft.code.trim().toUpperCase();
    if (!name || !code) {
      setError('Name and code are required');
      return;
    }
    const payload = {
      name,
      code,
      description: draft.description.trim() || undefined,
      serviceType: draft.serviceType,
      status: draft.status,
      baseFee: Number(draft.baseFee) || 0,
      perKmFee: Number(draft.perKmFee) || 0,
      maxWeightKg: Number(draft.maxWeightKg) || 0,
      estimatedDurationMinutes: Number(draft.estimatedDurationMinutes) || 0,
      coverageZones: draft.coverageZones,
    };
    setSaving(true);
    setError(null);
    try {
      if (initial) await deliveryServicesService.update(initial._id, payload);
      else await deliveryServicesService.create(payload);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the delivery service');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? `Edit ${initial.name}` : 'Add Delivery Service'}
      size="lg"
    >
      <div className="space-y-5">
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Basics
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Name"
              value={draft.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Local Delivery"
            />
            <TextField
              label="Code"
              value={draft.code}
              onChange={(e) => set('code', e.target.value)}
              placeholder="SVC-LOCAL"
              hint="Unique — shown on assignments and orders."
            />
            <SelectField
              label="Type"
              value={draft.serviceType}
              onChange={(e) => set('serviceType', e.target.value)}
              options={[...DELIVERY_SERVICE_TYPES]}
            />
            <SelectField
              label="Status"
              value={draft.status}
              onChange={(e) => set('status', e.target.value as DeliveryServiceStatus)}
              options={DELIVERY_SERVICE_STATUSES}
            />
          </div>
          <div className="mt-3">
            <label
              htmlFor="ds-description"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Description
            </label>
            <textarea
              id="ds-description"
              rows={2}
              value={draft.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="What this service covers"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-dark dark:border-dark-600 dark:bg-dark-900 dark:text-white"
            />
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Pricing &amp; Limits
          </h3>
          <div className="grid gap-3 sm:grid-cols-4">
            <TextField
              label="Base fee"
              type="number"
              min={0}
              value={draft.baseFee}
              onChange={(e) => set('baseFee', e.target.value)}
            />
            <TextField
              label="Per km fee"
              type="number"
              min={0}
              value={draft.perKmFee}
              onChange={(e) => set('perKmFee', e.target.value)}
            />
            <TextField
              label="Max weight (kg)"
              type="number"
              min={0}
              value={draft.maxWeightKg}
              onChange={(e) => set('maxWeightKg', e.target.value)}
            />
            <TextField
              label="Est. duration (min)"
              type="number"
              min={0}
              value={draft.estimatedDurationMinutes}
              onChange={(e) => set('estimatedDurationMinutes', e.target.value)}
            />
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Zone Coverage
          </h3>
          {(allZones?.zones ?? []).length === 0 ? (
            <p className="text-sm text-gray-500">No zones yet — add zones first to set coverage.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(allZones?.zones ?? []).map((z) => (
                <label
                  key={z._id}
                  className="flex cursor-pointer items-center gap-2 rounded-full border border-gray-300 px-3 py-1.5 text-xs dark:border-dark-600"
                >
                  <input
                    type="checkbox"
                    checked={draft.coverageZones.includes(z._id)}
                    onChange={() => toggleZone(z._id)}
                  />
                  {z.name}
                </label>
              ))}
            </div>
          )}
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void save()} loading={saving}>
            {initial ? 'Save changes' : 'Create service'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
