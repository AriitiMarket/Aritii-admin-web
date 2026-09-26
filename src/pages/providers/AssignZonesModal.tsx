import { useEffect, useState } from 'react';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { Zone } from '@/services/locations.service';
import { providersService, type ProviderDetail } from '@/services/providers.service';
import { ApiError } from '@/types/api';

/**
 * Assign / remove delivery zones for a provider.
 *
 * Only ACTIVE + SERVICEABLE zones are offered, mirroring the backend rule, so
 * the admin is never shown a choice the server will reject. Zones come from the
 * existing Zones module — no second zone-management system here.
 */
export function AssignZonesModal({
  open,
  provider,
  zones,
  onClose,
  onSaved,
}: {
  open: boolean;
  provider: ProviderDetail;
  zones: Zone[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelected(provider.zoneIds ?? []);
    setError(null);
  }, [open, provider.zoneIds]);

  const assignable = zones.filter((z) => z.status === 'active' && z.deliveryRules?.serviceable !== false);
  // Zones already assigned stay selectable even if they later went inactive,
  // so an admin can always REMOVE them.
  const alreadyAssigned = provider.zones ?? [];
  const options = [
    ...alreadyAssigned.filter((z) => !assignable.some((a) => a._id === z._id)),
    ...assignable,
  ];

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((z) => z !== id) : [...prev, id]));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await providersService.assignZones(provider._id, selected);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not assign zones');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Assign Delivery Zones" size="lg">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Choose where <span className="font-medium">{provider.name}</span> can operate.
          Only active, serviceable zones are available.
        </p>

        {options.length === 0 ? (
          <p className="text-sm text-gray-500">
            No active serviceable zones exist yet. Create one in Locations &amp; Expansion first.
          </p>
        ) : (
          <ul className="max-h-64 space-y-1 overflow-y-auto">
            {options.map((z) => (
              <li key={z._id}>
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-gray-100 px-3 py-2 text-sm dark:border-dark-600">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected.includes(z._id)}
                      onChange={() => toggle(z._id)}
                    />
                    <span className="font-medium text-gray-800 dark:text-gray-100">{z.name}</span>
                    <span className="text-xs text-gray-500">{z.code}</span>
                  </span>
                  {z.status !== 'active' || z.deliveryRules?.serviceable === false ? (
                    <StatusBadge label={z.status !== 'active' ? z.status : 'Not serviceable'} variant="neutral" />
                  ) : (
                    <StatusBadge label="Assignable" variant="success" />
                  )}
                </label>
              </li>
            ))}
          </ul>
        )}

        {error && (
          <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">{selected.length} zone(s) selected</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button variant="primary" onClick={save} loading={saving}>Save Zones</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
