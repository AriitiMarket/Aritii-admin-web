import { useState } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Modal } from '@/components/common/Modal';
import { Pagination } from '@/components/common/Pagination';
import { TextField } from '@/components/forms/TextField';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { hubsService, type Hub } from '@/services/hubs.service';
import { locationsService } from '@/services/locations.service';
import { FilterBar } from '@/components/workspace/FilterBar';
import { DataSection, RowActions } from '@/components/workspace/DataSection';
import { Facts } from '@/components/workspace/DetailList';
import { RecordDrawer, type DetailTab } from '@/components/workspace/RecordDrawer';

const LIMIT = 20;
const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];

interface HubDraft {
  id?: string;
  name: string;
  locationId: string;
  capacity: string;
  contactPhone: string;
  contactEmail: string;
  description: string;
}

const EMPTY: HubDraft = {
  name: '', locationId: '', capacity: '', contactPhone: '', contactEmail: '', description: '',
};

/** Hubs tab: physical/logistical sites and their real zone/route/provider counts. */
export function HubsTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [locationId, setLocationId] = useState('');
  const [detail, setDetail] = useState<Hub | null>(null);
  const [detailTab, setDetailTab] = useState('overview');
  const [draft, setDraft] = useState<HubDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const { data, loading, error, refetch } = useAsync(
    () => hubsService.list({
      page, limit: LIMIT,
      status: status || undefined,
      locationId: locationId || undefined,
      search: debouncedSearch || undefined,
    }),
    [page, status, locationId, debouncedSearch]
  );
  const { data: locations } = useAsync(() => locationsService.list(), []);
  const { data: stats } = useAsync(() => hubsService.getStats(), []);

  const hubs = data?.hubs ?? [];
  const isFiltered = !!(search || status || locationId);
  const reset = () => { setSearch(''); setStatus(''); setLocationId(''); setPage(1); };

  const openEdit = (hub: Hub) => setDraft({
    id: hub._id,
    name: hub.name,
    locationId: hub.locationId,
    capacity: hub.capacity != null ? String(hub.capacity) : '',
    contactPhone: hub.contactPhone ?? '',
    contactEmail: hub.contactEmail ?? '',
    description: hub.description ?? '',
  });

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: draft.name,
        locationId: draft.locationId,
        description: draft.description,
        contactPhone: draft.contactPhone,
        contactEmail: draft.contactEmail,
        capacity: draft.capacity === '' ? undefined : Number(draft.capacity),
      };
      if (draft.id) await hubsService.update(draft.id, payload as unknown as Record<string, unknown>);
      else await hubsService.create(payload);
      setDraft(null);
      refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save the hub');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Hub>[] = [
    { key: 'name', header: 'Hub', render: (r) => <span className="font-medium text-gray-800 dark:text-gray-100">{r.name}</span> },
    { key: 'location', header: 'Location', render: (r) => r.locationName ?? '—' },
    { key: 'zones', header: 'Zones', accessor: (r) => r.zoneCount },
    { key: 'routes', header: 'Routes', accessor: (r) => r.routeCount },
    { key: 'providers', header: 'Providers', accessor: (r) => r.providerCount },
    { key: 'capacity', header: 'Capacity', render: (r) => `${r.currentLoad ?? 0} / ${r.capacity ?? '—'}` },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge label={r.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <RowActions
          onView={() => { setDetail(r); setDetailTab('overview'); }}
          onEdit={() => openEdit(r)}
        />
      ),
    },
  ];

const h = detail;
  const detailTabs: DetailTab[] = h
    ? [
      {
        id: 'overview',
        label: 'Overview',
        content: (
          <Facts items={[
            ['Location', h.locationName ?? '—'],
            ['Status', h.status],
            ['Description', h.description || '—'],
            ['Capacity', h.capacity ?? '—'],
            ['Current load', h.currentLoad ?? 0],
            ['Contact', h.contactPhone || h.contactEmail || '—'],
          ]} />
        ),
      },
      {
        id: 'capacity',
        label: 'Capacity',
        content: (
          <Facts items={[
            ['Capacity', h.capacity ?? '—'],
            ['Current load', h.currentLoad ?? 0],
            ['Utilisation', h.capacity ? `${Math.round(((h.currentLoad ?? 0) / h.capacity) * 100)}%` : '—'],
          ]} />
        ),
      },
      {
        id: 'network',
        label: 'Zones & Routes',
        content: (
          <Facts items={[
            ['Zones served', h.zoneCount],
            ['Routes', h.routeCount],
            ['Providers', h.providerCount],
          ]} />
        ),
      },
      {
        id: 'activity',
        label: 'Activity',
        content: (
          <p className="text-sm text-gray-500">
            Last updated: {h.updatedAt ? new Date(h.updatedAt).toLocaleString() : '—'}
          </p>
        ),
      },
    ]
    : [];

  return (
    <>
      {stats && (
        <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Total Hubs', value: stats.totalHubs },
            { label: 'Active', value: stats.activeHubs },
            { label: 'Total Capacity', value: stats.totalCapacity },
            { label: 'Current Load', value: stats.currentLoad },
          ].map((c) => (
            <Card key={c.label} className="p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">{c.label}</p>
              <p className="mt-1 text-xl font-bold text-gray-800 dark:text-gray-100">{c.value}</p>
            </Card>
          ))}
        </div>
      )}

      <FilterBar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search hubs…"
        isFiltered={isFiltered}
        onReset={reset}
        resultSummary={data ? `${data.total} hub${data.total === 1 ? '' : 's'}` : undefined}
        actions={<Button variant="primary" onClick={() => { setFormError(null); setDraft(EMPTY); }}>Add Hub</Button>}
        filters={[
          { key: 'status', label: 'Status', value: status, onChange: (v) => { setStatus(v); setPage(1); }, options: STATUS_OPTIONS },
          {
            key: 'location',
            label: 'Location',
            value: locationId,
            onChange: (v) => { setLocationId(v); setPage(1); },
            options: [{ value: '', label: 'All' }, ...(locations ?? []).map((l) => ({ value: l._id, label: l.name }))],
          },
        ]}
      />

      <DataSection
        error={error}
        onRetry={refetch}
        isEmpty={!loading && hubs.length === 0}
        emptyTitle={isFiltered ? 'No hubs match these filters' : 'No hubs yet'}
        emptyDescription={isFiltered ? 'Try widening or resetting the filters above.' : 'Add a hub to give the network a physical collection and dispatch point.'}
        emptyAction={isFiltered ? undefined : { label: 'Add Hub', onClick: () => setDraft(EMPTY) }}
      >
        <DataTable columns={columns} rows={hubs} rowKey={(r) => r._id} loading={loading} emptyTitle="No hubs found" />
        <Pagination className="mt-4" page={page} totalPages={data?.totalPages ?? 1} total={data?.total} onPageChange={setPage} />
      </DataSection>

      {draft && (
        <Modal open onClose={() => setDraft(null)} title={draft.id ? 'Edit Hub' : 'Add Hub'} size="lg">
          <div className="space-y-3">
            <TextField label="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">Location</span>
              <select
                value={draft.locationId}
                onChange={(e) => setDraft({ ...draft, locationId: e.target.value })}
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-dark-600 dark:bg-dark-900"
              >
                <option value="">Select a location</option>
                {(locations ?? []).map((l) => (
                  <option key={l._id} value={l._id}>{l.name}</option>
                ))}
              </select>
            </label>
            <TextField label="Capacity" type="number" value={draft.capacity} onChange={(e) => setDraft({ ...draft, capacity: e.target.value })} />
            <TextField label="Contact phone" value={draft.contactPhone} onChange={(e) => setDraft({ ...draft, contactPhone: e.target.value })} />
            <TextField label="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setDraft(null)} disabled={saving}>Cancel</Button>
              <Button variant="primary" onClick={save} loading={saving} disabled={!draft.name || !draft.locationId}>
                {draft.id ? 'Save Changes' : 'Create Hub'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <RecordDrawer
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.name ?? ''}
        subtitle={detail?.locationName ?? undefined}
        statusLabel={detail?.status}
        actions={<Button variant="outline" size="sm" onClick={() => detail && openEdit(detail)}>Edit</Button>}
        summary={[
          { label: 'Zones', value: detail?.zoneCount ?? 0 },
          { label: 'Routes', value: detail?.routeCount ?? 0 },
          { label: 'Providers', value: detail?.providerCount ?? 0 },
        ]}
        tabs={detailTabs}
        activeTab={detailTab}
        onTabChange={setDetailTab}
      />
    </>
  );
}
