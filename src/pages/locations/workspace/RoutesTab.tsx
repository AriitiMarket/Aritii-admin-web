import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Modal } from '@/components/common/Modal';
import { Pagination } from '@/components/common/Pagination';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { routesService, locationsService, type DeliveryRoute } from '@/services/locations.service';
import { EnhancedRouteForm } from '../components/EnhancedRouteForm';
import { FilterBar } from '@/components/workspace/FilterBar';
import { DataSection, RowActions, ViewToggle, type ViewMode } from '@/components/workspace/DataSection';
import { Facts } from '@/components/workspace/DetailList';
import { RecordDrawer, type DetailTab } from '@/components/workspace/RecordDrawer';
import { NetworkMapPanel } from './NetworkMapPanel';
import { useMapData } from './useMapData';

const LIMIT = 20;
const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'archived', label: 'Archived' },
];

/** Routes tab: origin -> destination connections between locations. */
export function RoutesTab() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [originId, setOriginId] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<DeliveryRoute | null>(null);
  const [detail, setDetail] = useState<DeliveryRoute | null>(null);
  const [detailTab, setDetailTab] = useState('overview');
  const [view, setView] = useState<ViewMode>('list');
  const debouncedSearch = useDebounce(search, 300);

  const { data, loading, error, refetch } = useAsync(
    () => routesService.list({
      page, limit: LIMIT,
      status: status || undefined,
      originId: originId || undefined,
      destinationId: destinationId || undefined,
      search: debouncedSearch || undefined,
    }),
    [page, status, originId, destinationId, debouncedSearch]
  );
  const { data: locations } = useAsync(() => locationsService.list(), []);
  const mapData = useMapData(view === 'map');

  const routes = data?.routes ?? [];
  const isFiltered = !!(search || status || originId || destinationId);
  const reset = () => { setSearch(''); setStatus(''); setOriginId(''); setDestinationId(''); setPage(1); };

  const locationName = (id?: string) => (locations ?? []).find((l) => l._id === id)?.name ?? '—';
  const navigateToLocation = (loc: { _id: string }) => navigate(`/locations/${loc._id}`);
  const locationOptions = [
    { value: '', label: 'All' },
    ...(locations ?? []).map((l) => ({ value: l._id, label: l.name })),
  ];

  const columns: Column<DeliveryRoute>[] = [
    { key: 'name', header: 'Route', render: (r) => <span className="font-medium text-gray-800 dark:text-gray-100">{r.name}</span> },
    { key: 'origin', header: 'Origin', render: (r) => locationName(r.originLocationId) },
    { key: 'destination', header: 'Destination', render: (r) => locationName(r.destinationLocationId) },
    { key: 'distance', header: 'Distance', render: (r) => (r.distanceKm != null ? `${r.distanceKm} km` : '—') },
    { key: 'eta', header: 'ETA', render: (r) => (r.estimatedDurationMinutes != null ? `${r.estimatedDurationMinutes} min` : '—') },
    { key: 'provider', header: 'Provider', render: (r) => (r.providerId ? 'Assigned' : '—') },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge label={r.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <RowActions
          onView={() => { setDetail(r); setDetailTab('overview'); }}
          onEdit={() => setEditing(r)}
        />
      ),
    },
  ];

const r = detail;
  const detailTabs: DetailTab[] = r
    ? [
      {
        id: 'overview',
        label: 'Overview',
        content: (
          <Facts items={[
            ['Origin', locationName(r.originLocationId)],
            ['Destination', locationName(r.destinationLocationId)],
            ['Status', r.status],
            ['Distance', r.distanceKm != null ? `${r.distanceKm} km` : '—'],
            ['ETA', r.estimatedDurationMinutes != null ? `${r.estimatedDurationMinutes} min` : '—'],
            ['Code', r.code ?? '—'],
          ]} />
        ),
      },
      {
        id: 'stops',
        label: 'Stops',
        content: (
          <Facts items={[
            ['Waypoints', r.waypoints?.length ?? 0],
            ['Direct route', (r.waypoints?.length ?? 0) === 0 ? 'Yes' : 'No'],
          ]} />
        ),
      },
      {
        id: 'capacity',
        label: 'Capacity',
        content: (
          <Facts items={[
            ['Max capacity', r.maxCapacity ?? '—'],
            ['Priority', r.priority ?? '—'],
            ['Provider', r.providerId ? 'Assigned' : '—'],
          ]} />
        ),
      },
      {
        id: 'activity',
        label: 'Activity',
        content: (
          <p className="text-sm text-gray-500">
            Last updated: {r.updatedAt ? new Date(r.updatedAt).toLocaleString() : '—'}
          </p>
        ),
      },
    ]
    : [];

  return (
    <>
      <FilterBar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search routes…"
        isFiltered={isFiltered}
        onReset={reset}
        resultSummary={data ? `${data.total} route${data.total === 1 ? '' : 's'}` : undefined}
        actions={
          <>
            <ViewToggle mode={view} onChange={setView} showMap />
            <Button variant="primary" onClick={() => setCreating(true)}>Add Route</Button>
          </>
        }
        filters={[
          { key: 'status', label: 'Status', value: status, onChange: (v) => { setStatus(v); setPage(1); }, options: STATUS_OPTIONS },
          { key: 'origin', label: 'Origin', value: originId, onChange: (v) => { setOriginId(v); setPage(1); }, options: locationOptions },
          { key: 'destination', label: 'Destination', value: destinationId, onChange: (v) => { setDestinationId(v); setPage(1); }, options: locationOptions },
        ]}
      />

      {view === 'map' ? (
        <DataSection error={mapData.error} onRetry={mapData.refetch}>
          <NetworkMapPanel
            locations={mapData.locations}
            zones={mapData.zones}
            routes={mapData.routes}
            onRouteClick={(route) => { setDetail(route); setDetailTab('overview'); }}
            onLocationClick={(loc) => navigateToLocation(loc)}
          />
        </DataSection>
      ) : (
        <DataSection
          error={error}
          onRetry={refetch}
          isEmpty={!loading && routes.length === 0}
          emptyTitle={isFiltered ? 'No routes match these filters' : 'No routes yet'}
          emptyDescription={isFiltered ? 'Try widening or resetting the filters above.' : 'Connect two locations to create a delivery route.'}
          emptyAction={isFiltered ? undefined : { label: 'Add Route', onClick: () => setCreating(true) }}
        >
          <DataTable columns={columns} rows={routes} rowKey={(x) => x._id} loading={loading} emptyTitle="No routes found" />
          <Pagination className="mt-4" page={page} totalPages={data?.totalPages ?? 1} total={data?.total} onPageChange={setPage} />
        </DataSection>
      )}

      {creating && (
        <Modal open onClose={() => setCreating(false)} title="Add Route" size="lg">
          <EnhancedRouteForm onSuccess={() => { setCreating(false); refetch(); }} onCancel={() => setCreating(false)} />
        </Modal>
      )}
      {editing && (
        <Modal open onClose={() => setEditing(null)} title={`Edit ${editing.name}`} size="lg">
          <EnhancedRouteForm initial={editing} onSuccess={() => { setEditing(null); refetch(); }} onCancel={() => setEditing(null)} />
        </Modal>
      )}

      <RecordDrawer
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.name ?? ''}
        subtitle={detail ? `${locationName(detail.originLocationId)} → ${locationName(detail.destinationLocationId)}` : undefined}
        statusLabel={detail?.status}
        actions={<Button variant="outline" size="sm" onClick={() => detail && setEditing(detail)}>Edit</Button>}
        summary={[
          { label: 'Distance', value: detail?.distanceKm != null ? `${detail.distanceKm} km` : '—' },
          { label: 'ETA', value: detail?.estimatedDurationMinutes != null ? `${detail.estimatedDurationMinutes} min` : '—' },
          { label: 'Waypoints', value: detail?.waypoints?.length ?? 0 },
        ]}
        tabs={detailTabs}
        activeTab={detailTab}
        onTabChange={setDetailTab}
      />
    </>
  );
}
