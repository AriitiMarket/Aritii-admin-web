import { useEffect, useState } from 'react';
import { Button } from '@/components/common/Button';
import { TextField } from '@/components/forms/TextField';
import { SelectField } from '@/components/forms/SelectField';
import { Modal } from '@/components/common/Modal';
import { locationsService, zonesService, type Zone } from '@/services/locations.service';
import { portsService } from '@/services/ports.service';
import { useAsync } from '@/hooks/useAsync';
import { ApiError } from '@/types/api';
import {
  PROVIDER_TYPES,
  providersService,
  type Provider,
  type ProviderType,
} from '@/services/providers.service';

const VEHICLES = [
  { value: '', label: 'Not specified' },
  { value: 'bicycle', label: 'Bicycle' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'car', label: 'Car' },
  { value: 'van', label: 'Van' },
  { value: 'truck', label: 'Truck' },
  { value: 'foot', label: 'On foot' },
];

interface Draft {
  name: string;
  phone: string;
  email: string;
  providerType: ProviderType;
  actorType: string;
  vehicleType: string;
  plateNumber: string;
  maxCapacityKg: string;
  cityId: string;
  portId: string;
  zoneIds: string[];
}

const EMPTY: Draft = {
  name: '', phone: '', email: '',
  providerType: 'individual_rider', actorType: 'rider',
  vehicleType: 'motorcycle', plateNumber: '', maxCapacityKg: '10',
  cityId: '', portId: '', zoneIds: [],
};

/**
 * Add / Edit Delivery Provider — INCLUDING its initial operating location
 * (City / Zone / Port) for an admin-created provider (§4).
 *
 * What this form deliberately does NOT contain:
 *   - a STATUS selector — every provider starts `pending` (both registration
 *     paths share one lifecycle: PENDING -> approve/reject); account status
 *     changes go through their own audited actions;
 *   - an "Available now" switch — availability is the provider's own, never
 *     the admin's (§7).
 *
 * Only zones the admin can actually assign are offered (active + serviceable),
 * matching the backend rule so the form cannot submit an invalid assignment.
 * Routes are assigned from the provider's detail workspace.
 */
export function ProviderForm({
  open,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean;
  initial?: Provider | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: ports } = useAsync(() => portsService.list({ limit: 200 }), [open]);
  const { data: allZones } = useAsync(() => zonesService.list({ page: 1, limit: 200 }), [open]);
  const { data: cities } = useAsync(
    () => locationsService.list({ type: 'city', status: 'all', page: 1, limit: 200 }),
    [open]
  );

  useEffect(() => {
    if (!open) return;
    setError(null);
    setDraft(
      initial
        ? {
            name: initial.name ?? '',
            phone: initial.phone ?? '',
            email: initial.email ?? '',
            providerType: initial.providerType ?? 'individual_rider',
            actorType: initial.actorType ?? 'rider',
            vehicleType: initial.vehicleType ?? 'motorcycle',
            plateNumber: initial.plateNumber ?? '',
            maxCapacityKg: String(initial.maxCapacityKg ?? 10),
            cityId: initial.cityId ?? '',
            portId: initial.portId ?? '',
            zoneIds: initial.zoneIds ?? [],
          }
        : EMPTY
    );
  }, [open, initial]);

  /** Only active + serviceable zones are assignable. */
  const assignableZones: Zone[] = (allZones?.zones ?? []).filter(
    (z) => z.status === 'active' && z.deliveryRules?.serviceable !== false
  );

  const toggleZone = (id: string) => {
    setDraft((d) => ({
      ...d,
      zoneIds: d.zoneIds.includes(id) ? d.zoneIds.filter((z) => z !== id) : [...d.zoneIds, id],
    }));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      // Location only — City / Zone / Port. NO status / availability fields:
      // the backend strips them anyway, and account status has its own actions.
      const payload = {
        name: draft.name,
        phone: draft.phone,
        email: draft.email || null,
        providerType: draft.providerType,
        actorType: draft.actorType,
        vehicleType: draft.vehicleType,
        plateNumber: draft.plateNumber,
        maxCapacityKg: Number(draft.maxCapacityKg) || 10,
        cityId: draft.cityId || null,
        portId: draft.portId || null,
        zoneIds: draft.zoneIds,
        zoneId: draft.zoneIds[0] ?? null,
      };
      if (initial) {
        await providersService.update(initial._id, payload);
      } else {
        await providersService.create(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the provider');
    } finally {
      setSaving(false);
    }
  };

  const portOptions = [
    { value: '', label: '—' },
    ...(ports?.ports ?? []).map((pt) => ({ value: pt._id, label: pt.name })),
  ];

  return (
    <Modal open={open} onClose={onClose} title={initial ? `Edit ${initial.name}` : 'Add Delivery Provider'} size="lg">
      <div className="space-y-5">
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Basic Information</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <TextField label="Phone" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
            <TextField label="Email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
            <SelectField
              label="Provider Type"
              value={draft.providerType}
              onChange={(e) => setDraft({ ...draft, providerType: e.target.value as ProviderType })}
              options={PROVIDER_TYPES}
            />
            <SelectField
              label="Transport Role"
              value={draft.actorType}
              onChange={(e) => setDraft({ ...draft, actorType: e.target.value })}
              options={[
                { value: 'rider', label: 'Rider' },
                { value: 'driver', label: 'Driver' },
                { value: 'courier', label: 'Courier' },
                { value: 'pickup_agent', label: 'Pickup Agent' },
              ]}
            />
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Vehicle</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <SelectField label="Vehicle" value={draft.vehicleType} onChange={(e) => setDraft({ ...draft, vehicleType: e.target.value })} options={VEHICLES} />
            <TextField label="Plate number" value={draft.plateNumber} onChange={(e) => setDraft({ ...draft, plateNumber: e.target.value })} />
            <TextField label="Capacity (kg)" type="number" value={draft.maxCapacityKg} onChange={(e) => setDraft({ ...draft, maxCapacityKg: e.target.value })} />
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Operating location — City / Zone / Port
          </h3>
          <p className="mb-2 text-xs text-gray-500">
            Where this provider normally operates. Chosen once here (or on the
            application, for a self-applied provider) — not re-assigned per
            delivery. Only active, serviceable zones can be chosen; routes are
            assigned from the provider&apos;s detail workspace.
          </p>
          <div className="mb-3 grid gap-3 sm:grid-cols-2">
            <SelectField
              label="City"
              value={draft.cityId}
              onChange={(e) => setDraft({ ...draft, cityId: e.target.value })}
              options={[
                { value: '', label: '—' },
                ...(cities ?? []).map((c) => ({ value: c._id, label: c.name })),
              ]}
            />
            <SelectField label="Port" value={draft.portId} onChange={(e) => setDraft({ ...draft, portId: e.target.value })} options={portOptions} />
          </div>
          {assignableZones.length === 0 ? (
            <p className="text-sm text-gray-500">No active serviceable zones available yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {assignableZones.map((z) => (
                <label
                  key={z._id}
                  className="flex cursor-pointer items-center gap-2 rounded-full border border-gray-300 px-3 py-1.5 text-xs dark:border-dark-600"
                >
                  <input type="checkbox" checked={draft.zoneIds.includes(z._id)} onChange={() => toggleZone(z._id)} />
                  {z.name}
                </label>
              ))}
            </div>
          )}
        </section>

        {/* No "Availability & Status" section: account status changes through
            the audited Approve/Reject/Activate/Deactivate actions, and
            availability is the provider's own switch (§7, §19). */}

        {error && (
          <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={save} loading={saving} disabled={!draft.name || !draft.phone}>
            {initial ? 'Save Changes' : 'Create Provider'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
