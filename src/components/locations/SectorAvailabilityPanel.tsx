/**
 * Location × Sector availability.
 *
 * The platform never assumes every sector operates everywhere: availability is
 * configured per location (Delivery owns the mapping; Commerce owns the sector
 * catalogue). Writes require ADMIN and are audit-logged by the backend.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  platformAdminService,
  type SectorAvailability,
  type SectorAvailabilityResponse,
} from '@/services/platformAdmin.service';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';

export function SectorAvailabilityPanel({
  locationId,
  locationName,
}: {
  locationId: string;
  locationName?: string;
}) {
  const [data, setData] = useState<SectorAvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sectorId, setSectorId] = useState('');
  const [sectorName, setSectorName] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await platformAdminService.getSectorAvailability(locationId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sector availability');
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const update = async (row: SectorAvailability, patch: Partial<SectorAvailability>) => {
    setSaving(row.sectorId);
    try {
      await platformAdminService.setSectorAvailability(locationId, row.sectorId, {
        isActive: patch.isActive ?? row.isActive,
        deliveryAvailable: patch.deliveryAvailable ?? row.deliveryAvailable,
        pickupAvailable: patch.pickupAvailable ?? row.pickupAvailable,
        sectorName: patch.sectorName ?? row.sectorName,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update availability');
    } finally {
      setSaving(null);
    }
  };

  const addSector = async () => {
    if (!sectorId.trim()) return;
    setSaving(sectorId);
    try {
      await platformAdminService.setSectorAvailability(locationId, sectorId.trim(), {
        sectorName: sectorName.trim() || sectorId.trim(),
        isActive: true,
        deliveryAvailable: true,
        pickupAvailable: true,
      });
      setSectorId('');
      setSectorName('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add sector');
    } finally {
      setSaving(null);
    }
  };

  const remove = async (row: SectorAvailability) => {
    setSaving(row.sectorId);
    try {
      await platformAdminService.removeSectorAvailability(locationId, row.sectorId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove sector');
    } finally {
      setSaving(null);
    }
  };

return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Sector availability{locationName ? ` — ${locationName}` : ''}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Which sectors operate here, and whether delivery/pickup are available.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={load} loading={loading}>
          Refresh
        </Button>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {data?.summary && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {data.summary.active} enabled · {data.summary.inactive} disabled · {data.summary.deliveryAvailable} with delivery ·{' '}
          {data.summary.pickupAvailable} with pickup
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="text-sm">
          <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Sector id</span>
          <input
            className="h-10 rounded border border-gray-300 bg-white px-2 text-sm dark:border-dark-600 dark:bg-dark-900"
            value={sectorId}
            onChange={(event) => setSectorId(event.target.value)}
            placeholder="e.g. food"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Display name</span>
          <input
            className="h-10 rounded border border-gray-300 bg-white px-2 text-sm dark:border-dark-600 dark:bg-dark-900"
            value={sectorName}
            onChange={(event) => setSectorName(event.target.value)}
            placeholder="Food"
          />
        </label>
        <Button size="sm" onClick={addSector} loading={saving === sectorId} disabled={!sectorId.trim()}>
          Add / enable sector
        </Button>
      </div>

      {loading && !data ? (
        <p className="mt-3 text-sm text-gray-500">Loading…</p>
      ) : (data?.sectors || []).length === 0 ? (
        <div className="mt-3">
          <EmptyState
            title="No sectors configured for this location"
            description="Add a sector above to make it available here. Sectors are never enabled everywhere automatically."
          />
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500 dark:border-dark-600 dark:text-gray-400">
                <th className="py-2 pr-3">Sector</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Delivery</th>
                <th className="py-2 pr-3">Pickup</th>
                <th className="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.sectors || []).map((row) => (
                <tr key={row.sectorId} className="border-b border-gray-100 dark:border-dark-700">
                  <td className="py-2 pr-3">
                    <span className="font-medium">{row.sectorName || row.sectorId}</span>
                    <span className="ml-2 text-xs text-gray-400">{row.sectorId}</span>
                  </td>
                  <td className="py-2 pr-3">
                    <StatusBadge label={row.isActive ? 'active' : 'disabled'} />
                  </td>
                  <td className="py-2 pr-3">
                    <StatusBadge label={row.deliveryAvailable ? 'available' : 'unavailable'} />
                  </td>
                  <td className="py-2 pr-3">
                    <StatusBadge label={row.pickupAvailable ? 'available' : 'unavailable'} />
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={row.isActive ? 'outline' : 'primary'}
                        loading={saving === row.sectorId}
                        onClick={() => update(row, { isActive: !row.isActive })}
                      >
                        {row.isActive ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        loading={saving === row.sectorId}
                        onClick={() => update(row, { deliveryAvailable: !row.deliveryAvailable })}
                      >
                        Delivery
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        loading={saving === row.sectorId}
                        onClick={() => update(row, { pickupAvailable: !row.pickupAvailable })}
                      >
                        Pickup
                      </Button>
                      <Button size="sm" variant="danger" loading={saving === row.sectorId} onClick={() => remove(row)}>
                        Remove
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}