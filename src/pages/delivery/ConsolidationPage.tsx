import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsync } from '@/hooks/useAsync';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { SelectField } from '@/components/forms/SelectField';
import { ErrorState } from '@/components/common/ErrorState';
import { shipmentsService, type ConsolidationCandidate } from '@/services/shipments.service';
import { deliveryServicesService } from '@/services/deliveryServices.service';
import { useToast } from '@/hooks/useToast';
import { ApiError } from '@/types/api';
import { locationsService, type Location } from '@/services/locations.service';

export function ConsolidationPage() {
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  // Review filters — every candidate request goes through the backend's own
  // origin/destination/service compatibility query (§18).
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [service, setService] = useState('');
  const isFiltered = !!(origin || destination || service);

  const [locations, setLocations] = useState<Map<string, Location>>(new Map());
  const [locationOptions, setLocationOptions] = useState<{ value: string; label: string }[]>([]);

  const loadLocations = useCallback(async () => {
    try {
      const list = await locationsService.list({ limit: 300 });
      const map = new Map<string, Location>();
      for (const loc of list) map.set(loc._id, loc);
      setLocations(map);
      setLocationOptions(list.map((l) => ({ value: l._id, label: `${l.name} (${l.type})` })));
    } catch {
      // option list is a nice-to-have; candidate names come from the server
    }
  }, []);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const { data: services } = useAsync(
    async () => (await deliveryServicesService.list({ page: 1, limit: 200 }).catch(() => null))?.items ?? [],
    []
  );

  const { data, loading, refetch } = useAsync(
    async () => {
      const res = await shipmentsService.getCandidates({
        originLocationId: origin || undefined,
        destinationLocationId: destination || undefined,
        serviceId: service || undefined,
      });
      return res.candidates ?? [];
    },
    [origin, destination, service]
  );

  const handleConsolidate = async (group: ConsolidationCandidate) => {
    setActionLoading(true);
    setError(null);
    try {
      await shipmentsService.consolidate({
        deliveryIds: group.deliveryIds,
        originLocationId: group.originLocationId,
        destinationLocationId: group.destinationLocationId,
        serviceId: group.serviceId,
      });
      showToast({ type: 'success', message: `Consolidated ${group.deliveryCount} deliveries` });
      refetch();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Consolidation failed';
      setError(message);
      showToast({ type: 'error', message });
    } finally {
      setActionLoading(false);
    }
  };

  const rows = data ?? [];

  return (
    <div>
      <PageHeader
        title="Consolidation"
        description="Group pending deliveries into shipments before dispatch."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-4 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Filters</h3>
          <div className="flex flex-col gap-3">
            <SelectField
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              options={[{ value: '', label: 'All origins' }, ...locationOptions]}
              placeholder="Origin location"
              aria-label="Origin location"
            />
            <SelectField
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              options={[{ value: '', label: 'All destinations' }, ...locationOptions]}
              placeholder="Destination location"
              aria-label="Destination location"
            />
            <SelectField
              value={service}
              onChange={(e) => setService(e.target.value)}
              options={[
                { value: '', label: 'All services' },
                ...(services ?? []).map((s) => ({ value: s._id, label: s.name })),
              ]}
              placeholder="Service"
              aria-label="Service"
            />
            <div className="flex gap-2">
              <Button onClick={() => refetch()} variant="secondary" className="flex-1">
                Refresh
              </Button>
              {isFiltered && (
                <Button
                  onClick={() => { setOrigin(''); setDestination(''); setService(''); }}
                  variant="ghost"
                  className="flex-1"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
            A group only appears when deliveries share the same origin, destination and service and
            are still pending without a shipment.
          </p>
        </Card>

        <div className="flex flex-col gap-4 lg:col-span-3">
          {error ? (
            <ErrorState message={error} onRetry={() => { setError(null); refetch(); }} />
          ) : loading ? (
            <Card className="p-4 text-center">
              <p className="text-sm text-gray-500">Loading consolidation candidates…</p>
            </Card>
          ) : rows.length === 0 ? (
            <Card className="p-4 text-center text-sm text-gray-500">
              {isFiltered
                ? 'No groups match these filters.'
                : 'No pending deliveries eligible for consolidation yet.'}
            </Card>
          ) : (
            rows.map((g) => {
              const originName =
                g.originName ?? locations.get(g.originLocationId)?.name ?? g.originLocationId?.slice(0, 8) ?? '—';
              const destinationName =
                g.destinationName ?? locations.get(g.destinationLocationId)?.name ?? g.destinationLocationId?.slice(0, 8) ?? '—';
              return (
                <Card key={g.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {originName} → {destinationName}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {g.groupName} · {g.deliveryCount} deliveries
                        {g.totalWeight ? ` · ${g.totalWeight} kg` : ''}
                      </p>
                      {g.reason && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{g.reason}</p>}
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleConsolidate(g)}
                      disabled={actionLoading}
                    >
                      Consolidate
                    </Button>
                  </div>
                  <div className="mt-3 border-t border-gray-100 dark:border-dark-800">
                    <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                      {g.deliveryIds.map((id) => (
                        <li key={id}>
                          <button
                            type="button"
                            className="underline hover:text-primary-dark"
                            onClick={() => navigate(`/delivery/deliveries?orderId=${encodeURIComponent(g.orderIds?.[g.deliveryIds.indexOf(id)] ?? id)}`)}
                          >
                            Delivery {id.slice(0, 8)}…
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
