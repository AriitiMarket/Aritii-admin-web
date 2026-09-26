import { useState } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Modal } from '@/components/common/Modal';
import { Pagination } from '@/components/common/Pagination';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { zonesService, locationsService, type Zone } from '@/services/locations.service';
import { EnhancedZoneForm } from '../components/EnhancedZoneForm';
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
];
const SERVICEABILITY_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'serviceable', label: 'Serviceable' },
  { value: 'non-serviceable', label: 'Not serviceable' },
];

/** Delivery Zones tab. */
export function ZonesTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [serviceability, setServiceability] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Zone | null>(null);
  const [detail, setDetail] = useState<Zone | null>(null);
  const [detailTab, setDetailTab] = useState('overview');
  const [view, setView] = useState<ViewMode>('list');
  const debouncedSearch = useDebounce(search, 300);

  const { data, loading, error, refetch } = useAsync(
    () => zonesService.list({ page, limit: LIMIT, status: status || undefined, search: debouncedSearch || undefined }),
    [page, status, debouncedSearch]
  );

  // The zone form needs the full location list to offer for coverage.
  const { data: allLocations } = useAsync(() => locationsService.list(), []);
  // The map needs every zone, not just the current page of the table.
  const mapData = useMapData(view === 'map');

  const zones = data?.zones ?? [];
  const isFiltered = !!(search || status || serviceability);
  const reset = () => { setSearch(''); setStatus(''); setServiceability(''); setPage(1); };

  const toggleStatus = async (zone: Zone) => {
    if (zone.status === 'active') await zonesService.deactivate(zone._id);
    else await zonesService.activate(zone._id);
    refetch();
  };

  const columns: Column<Zone>[] = [
    {
      key: 'name',
      header: 'Zone',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-gray-100">{r.name}</p>
          <p className="text-xs text-gray-400">({r.code})</p>
        </div>
      ),
    },
    { key: 'locations', header: 'Locations', accessor: (r) => r.locationIds?.length ?? 0 },
    { key: 'hub', header: 'Hub', render: (r) => (r.hubId ? 'Assigned' : '—') },
    { key: 'coverage', header: 'Coverage', render: (r) => (r.coverage?.radiusKm ? `${r.coverage.radiusKm} km` : '—') },
    {
      key: 'serviceable',
      header: 'Serviceability',
      render: (r) => (
        <StatusBadge
          label={r.deliveryRules?.serviceable ? 'Serviceable' : 'Not serviceable'}
          variant={r.deliveryRules?.serviceable ? 'success' : 'neutral'}
        />
      ),
    },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge label={r.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <RowActions
          onView={() => { setDetail(r); setDetailTab('overview'); }}
          onEdit={() => setEditing(r)}
          onManage={() => void toggleStatus(r)}
        />
      ),
    },
  ];

const z = detail;
  const rules = z?.deliveryRules;
  const detailTabs: DetailTab[] = z
    ? [
      {
        id: 'overview',
        label: 'Overview',
        content: (
          <Facts items={[
            ['Code', z.code],
            ['Status', z.status],
            ['Description', z.description || '—'],
            ['Locations', z.locationIds?.length ?? 0],
            ['Priority', z.priority],
            ['Hub', z.hubId ? 'Assigned' : '—'],
          ]} />
        ),
      },
      {
        id: 'coverage',
        label: 'Coverage',
        content: (
          <Facts items={[
            ['Radius', z.coverage?.radiusKm ? `${z.coverage.radiusKm} km` : '—'],
            ['Included areas', z.coverage?.includedAreas?.join(', ') || '—'],
            ['Excluded areas', z.coverage?.excludedAreas?.join(', ') || '—'],
          ]} />
        ),
      },
      {
        id: 'rules',
        label: 'Delivery Rules',
        content: (
          <Facts items={[
            ['Serviceable', String(rules?.serviceable ?? false)],
            ['Delivery fee', rules?.deliveryFee ?? '—'],
            ['Free delivery over', rules?.freeDeliveryThreshold ?? '—'],
            ['Estimated time', rules?.estimatedDeliveryTime ?? '—'],
            ['COD available', String(rules?.codAvailable ?? false)],
            ['Pickup available', String(rules?.pickupAvailable ?? false)],
          ]} />
        ),
      },
      {
        id: 'activity',
        label: 'Activity',
        content: (
          <p className="text-sm text-gray-500">
            Last updated: {z.updatedAt ? new Date(z.updatedAt).toLocaleString() : '—'}
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
        searchPlaceholder="Search zones…"
        isFiltered={isFiltered}
        onReset={reset}
        resultSummary={data ? `${data.total} zone${data.total === 1 ? '' : 's'}` : undefined}
        actions={
          <>
            <ViewToggle mode={view} onChange={setView} showMap />
            <Button variant="primary" onClick={() => setCreating(true)}>Add Zone</Button>
          </>
        }
        filters={[
          { key: 'status', label: 'Status', value: status, onChange: (v) => { setStatus(v); setPage(1); }, options: STATUS_OPTIONS },
          { key: 'serviceability', label: 'Serviceability', value: serviceability, onChange: (v) => { setServiceability(v); setPage(1); }, options: SERVICEABILITY_OPTIONS },
        ]}
      />

      {view === 'map' ? (
        <DataSection error={mapData.error} onRetry={mapData.refetch}>
          <NetworkMapPanel
            locations={mapData.locations}
            zones={mapData.zones}
            routes={mapData.routes}
            onZoneClick={(zone) => { setDetail(zone); setDetailTab('overview'); }}
          />
        </DataSection>
      ) : (
        <DataSection
          error={error}
          onRetry={refetch}
          isEmpty={!loading && zones.length === 0}
          emptyTitle={isFiltered ? 'No zones match these filters' : 'No delivery zones yet'}
          emptyDescription={isFiltered ? 'Try widening or resetting the filters above.' : 'Create a zone to group locations into a deliverable area.'}
          emptyAction={isFiltered ? undefined : { label: 'Add Zone', onClick: () => setCreating(true) }}
        >
          <DataTable columns={columns} rows={zones} rowKey={(r) => r._id} loading={loading} emptyTitle="No zones found" />
          <Pagination className="mt-4" page={page} totalPages={data?.totalPages ?? 1} total={data?.total} onPageChange={setPage} />
        </DataSection>
      )}

      {creating && (
        <Modal open onClose={() => setCreating(false)} title="Add Delivery Zone" size="lg">
          <EnhancedZoneForm locations={allLocations ?? []} onSuccess={() => { setCreating(false); refetch(); }} onCancel={() => setCreating(false)} />
        </Modal>
      )}
      {editing && (
        <Modal open onClose={() => setEditing(null)} title={`Edit ${editing.name}`} size="lg">
          <EnhancedZoneForm initial={editing} locations={allLocations ?? []} onSuccess={() => { setEditing(null); refetch(); }} onCancel={() => setEditing(null)} />
        </Modal>
      )}

      <RecordDrawer
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.name ?? ''}
        subtitle={detail?.code}
        statusLabel={detail?.status}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => detail && setEditing(detail)}>Edit</Button>
            <Button variant="secondary" size="sm" onClick={() => detail && void toggleStatus(detail)}>
              {detail?.status === 'active' ? 'Deactivate' : 'Activate'}
            </Button>
          </>
        }
        summary={[
          { label: 'Serviceable', value: detail?.deliveryRules?.serviceable ? 'Yes' : 'No' },
          { label: 'Locations', value: detail?.locationIds?.length ?? 0 },
          { label: 'Radius', value: detail?.coverage?.radiusKm ? `${detail.coverage.radiusKm} km` : '—' },
        ]}
        tabs={detailTabs}
        activeTab={detailTab}
        onTabChange={setDetailTab}
      />
    </>
  );
}
