import { useEffect, useState } from 'react';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { DeliveryRoute } from '@/services/locations.service';
import { providersService, type ProviderDetail } from '@/services/providers.service';
import { ApiError } from '@/types/api';

/**
 * Assign / remove routes for a provider.
 *
 * Reuses the existing Routes module's data rather than introducing another
 * route-management system. Note a route carries a single provider, so
 * assigning it here moves it away from any previously assigned provider.
 */
export function AssignRoutesModal({
  open,
  provider,
  routes,
  onClose,
  onSaved,
}: {
  open: boolean;
  provider: ProviderDetail;
  routes: DeliveryRoute[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelected((provider.routes ?? []).map((r) => r._id));
    setError(null);
  }, [open, provider.routes]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await providersService.assignRoutes(provider._id, selected);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not assign routes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Assign Routes" size="lg">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Choose which routes <span className="font-medium">{provider.name}</span> can operate.
          A route can only belong to one provider.
        </p>

        {routes.length === 0 ? (
          <p className="text-sm text-gray-500">
            No routes exist yet. Create one in Locations &amp; Expansion first.
          </p>
        ) : (
          <ul className="max-h-64 space-y-1 overflow-y-auto">
            {routes.map((r) => (
              <li key={r._id}>
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-gray-100 px-3 py-2 text-sm dark:border-dark-600">
                  <span className="flex items-center gap-2">
                    <input type="checkbox" checked={selected.includes(r._id)} onChange={() => toggle(r._id)} />
                    <span className="font-medium text-gray-800 dark:text-gray-100">{r.name}</span>
                    <span className="text-xs text-gray-500">
                      {r.distanceKm != null ? `${r.distanceKm} km` : '—'}
                    </span>
                  </span>
                  <StatusBadge label={r.status} />
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
          <p className="text-xs text-gray-500">{selected.length} route(s) selected</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button variant="primary" onClick={save} loading={saving}>Save Routes</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
