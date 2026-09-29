import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Pagination } from '@/components/common/Pagination';
import { Tabs } from '@/components/common/Tabs';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { FilterBar } from '@/components/workspace/FilterBar';
import { DataSection, RowActions } from '@/components/workspace/DataSection';
import { locationsService, zonesService } from '@/services/locations.service';
import { RidersTab } from '@/pages/delivery/tabs/RidersTab';
import {
  providersService,
  PROVIDER_TYPES,
  PROVIDER_TYPE_LABELS,
  PROVIDER_STATUS_OPTIONS,
  AVAILABILITY_OPTIONS,
  type Provider,
} from '@/services/providers.service';
import { ProviderForm } from './ProviderForm';
import { ProviderDetailDrawer } from './ProviderDetailDrawer';

const LIMIT = 20;

type Tab = 'providers' | 'riders';

const TABS: { id: Tab; label: string }[] = [
  { id: 'providers', label: 'Providers' },
  { id: 'riders', label: 'Riders' },
];

/**
 * Delivery Providers — the ONE workspace for everyone who performs deliveries.
 *
 * Riders, delivery businesses and logistics partners are the same entity here,
 * distinguished only by `providerType`. There is no separate Riders/Actors
 * module, and the same providers are what the order-assignment flow picks from.
 *
 * Two views over that same list: "Providers" is the full management table
 * (create, edit, zones/routes, detail drawer); "Riders" is the rider-focused
 * list with bulk status changes. The active tab lives in `?tab=`.
 */
export function ProvidersPage() {
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [providerType, setProviderType] = useState('');
  const [locationId, setLocationId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [isOnline, setIsOnline] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Provider | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: Tab = searchParams.get('tab') === 'riders' ? 'riders' : 'providers';
  // Status lives in `?status=` so deep links land pre-filtered — notably the
  // legacy /riders/pending redirect which sends ?status=pending.
  const status = searchParams.get('status') ?? '';
  const debouncedSearch = useDebounce(search, 300);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const selectTab = (id: Tab) => setParam('tab', id === 'providers' ? '' : id);
  const setStatus = (value: string) => {
    setPage(1);
    setParam('status', value);
  };

  const { data, loading, error, refetch } = useAsync(
    () => providersService.list({
      page, limit: LIMIT, search: debouncedSearch,
      status: status || undefined,
      providerType: providerType || undefined,
      sectorId: locationId || undefined,
      zoneId: zoneId || undefined,
      isOnline: isOnline || undefined,
    }),
    [page, debouncedSearch, status, providerType, locationId, zoneId, isOnline]
  );

  // Filter option sources reuse the existing Locations module data.
  const { data: locations } = useAsync(() => locationsService.list(), []);
  const { data: zones } = useAsync(() => zonesService.list({ page: 1, limit: 200 }), []);

  const providers = data?.items ?? [];
  const isFiltered = !!(search || status || providerType || locationId || zoneId || isOnline);
  const reset = () => {
    setSearch(''); setStatus(''); setProviderType('');
    setLocationId(''); setZoneId(''); setIsOnline(''); setPage(1);
  };

  // Approval is a first-class row action: it used to be reachable only by
  // opening the detail drawer of a provider whose status happened to be
  // "pending", which made the review queue look like a read-only list.
  const approveProvider = async (provider: Provider) => {
    setApprovingId(provider._id);
    try {
      await providersService.approve(provider._id);
      showToast({
        type: 'success',
        title: 'Provider approved',
        message: `${provider.name} can now be assigned to deliveries.`,
      });
      refetch();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Could not approve provider',
        message: err instanceof Error ? err.message : 'Try again in a moment.',
      });
    } finally {
      setApprovingId(null);
    }
  };

  const columns: Column<Provider>[] = [
    {
      key: 'name',
      header: 'Provider',
      render: (p) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-gray-100">{p.name}</p>
          <p className="text-xs text-gray-500">{p.phone ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (p) => (
        <span className="text-sm text-gray-700 dark:text-gray-200">
          {PROVIDER_TYPE_LABELS[p.providerType] ?? p.providerType}
        </span>
      ),
    },
    { key: 'zones', header: 'Zones', accessor: (p) => p.zoneIds?.length ?? 0 },
    { key: 'active', header: 'Active Deliveries', accessor: (p) => p.activeDeliveries ?? 0 },
    {
      key: 'availability',
      header: 'Availability',
      render: (p) => (
        <StatusBadge
          label={p.availability?.isOnline ? 'Online' : 'Offline'}
          variant={p.availability?.isOnline ? 'success' : 'neutral'}
        />
      ),
    },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge label={p.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (p) => (
        <div className="flex flex-wrap items-center gap-3">
          {p.status === 'pending' && (
            <button
              type="button"
              disabled={approvingId === p._id}
              onClick={() => approveProvider(p)}
              className="text-sm font-semibold text-green-700 hover:underline disabled:opacity-60 dark:text-green-400"
            >
              {approvingId === p._id ? 'Approving…' : 'Approve'}
            </button>
          )}
          <RowActions onView={() => setDetailId(p._id)} onEdit={() => setEditing(p)} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Delivery Providers"
        description="Manage the people or delivery businesses that perform deliveries for Aritii Market."
      />

      <div className="mb-4">
        <Tabs
          activeTab={tab}
          onChange={(id) => selectTab(id as Tab)}
          tabs={TABS.map(({ id, label }) => ({ value: id, label }))}
        />
      </div>

      <div role="tabpanel">
        {tab === 'riders' ? (
          <RidersTab />
        ) : (
          <>
            <FilterBar
              searchValue={search}
              onSearchChange={(v) => { setSearch(v); setPage(1); }}
              searchPlaceholder="Search providers…"
              isFiltered={isFiltered}
              onReset={reset}
              resultSummary={data ? `${data.total} provider${data.total === 1 ? '' : 's'}` : undefined}
              actions={
                <Button variant="primary" onClick={() => setCreating(true)}>
                  Add Delivery Provider
                </Button>
              }
              filters={[
                { key: 'status', label: 'Status', value: status, onChange: (v) => { setStatus(v); setPage(1); }, options: PROVIDER_STATUS_OPTIONS },
                {
                  key: 'type', label: 'Type', value: providerType,
                  onChange: (v) => { setProviderType(v); setPage(1); },
                  options: [{ value: '', label: 'All' }, ...PROVIDER_TYPES],
                },
                {
                  key: 'location', label: 'Location', value: locationId,
                  onChange: (v) => { setLocationId(v); setPage(1); },
                  options: [{ value: '', label: 'All' }, ...(locations ?? []).map((l) => ({ value: l._id, label: l.name }))],
                },
                {
                  key: 'zone', label: 'Zone', value: zoneId,
                  onChange: (v) => { setZoneId(v); setPage(1); },
                  options: [{ value: '', label: 'All' }, ...(zones?.zones ?? []).map((z) => ({ value: z._id, label: z.name }))],
                },
                { key: 'availability', label: 'Availability', value: isOnline, onChange: (v) => { setIsOnline(v); setPage(1); }, options: AVAILABILITY_OPTIONS },
              ]}
            />

            <DataSection
              error={error}
              onRetry={refetch}
              isEmpty={!loading && providers.length === 0}
              emptyTitle={isFiltered ? 'No providers match these filters' : 'No delivery providers yet'}
              emptyDescription={isFiltered ? 'Try widening or resetting the filters above.' : 'Add the people or businesses that will perform deliveries.'}
              emptyAction={isFiltered ? undefined : { label: 'Add Delivery Provider', onClick: () => setCreating(true) }}
            >
              <DataTable columns={columns} rows={providers} rowKey={(p) => p._id} loading={loading} emptyTitle="No providers found" />
              <Pagination className="mt-4" page={page} totalPages={data?.totalPages ?? 1} total={data?.total} onPageChange={setPage} />
            </DataSection>
          </>
        )}
      </div>

      <ProviderForm open={creating} onClose={() => setCreating(false)} onSaved={() => { setCreating(false); refetch(); }} />
      <ProviderForm open={!!editing} initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refetch(); }} />

      <ProviderDetailDrawer
        providerId={detailId}
        onClose={() => setDetailId(null)}
        onChanged={refetch}
      />
    </div>
  );
}
