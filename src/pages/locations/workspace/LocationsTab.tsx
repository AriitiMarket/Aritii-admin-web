import { useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Modal } from '@/components/common/Modal';
import { Pagination } from '@/components/common/Pagination';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { useLocations, useLocationStats } from '../hooks/useLocations';
import { locationsService } from '@/services/locations.service';
import { EnhancedLocationForm } from '../components/EnhancedLocationForm';
import { LocationSummaryCards } from '../components/LocationSummaryCards';
import { FilterBar } from '@/components/workspace/FilterBar';
import { DataSection, RowActions, ViewToggle, type ViewMode } from '@/components/workspace/DataSection';
import { RecordDrawer, type DetailTab } from '@/components/workspace/RecordDrawer';
import { NetworkMapPanel } from './NetworkMapPanel';
import { useMapData } from './useMapData';
import {
  EXPANSION_STATUSES,
  EXPANSION_STATUS_LABELS,
  LOCATION_STATUSES,
  LOCATION_TYPES,
  HUB_FILTERS,
  SERVICEABILITY_FILTERS,
} from '../constants';
import type { Location } from '../types';

const LIMIT = 20;

function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 py-1.5 last:border-0 dark:border-dark-600">
      <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-right font-medium text-gray-800 dark:text-gray-100">{value ?? '—'}</dd>
    </div>
  );
}

/** Locations tab: search, filter and act on the operating location hierarchy. */
export function LocationsTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [serviceability, setServiceability] = useState('');
  const [hub, setHub] = useState('');
  const [expansionStatus, setExpansionStatus] = useState('');
  const [editing, setEditing] = useState<Location | null>(null);
  const [creating, setCreating] = useState(false);
  const [detail, setDetail] = useState<Location | null>(null);
  const [detailTab, setDetailTab] = useState('overview');
  const [view, setView] = useState<ViewMode>('list');
  const debouncedSearch = useDebounce(search, 300);

  const { data, loading, error, refetch } = useLocations({
    type, status, serviceability, hub, expansionStatus, search: debouncedSearch, page, limit: LIMIT,
  });
  const { stats, loading: statsLoading } = useLocationStats();
  // The map needs the whole network, not just the current page of the table.
  const mapData = useMapData(view === 'map');

  const locations = data?.items ?? [];
  const isFiltered = !!(search || type || status || serviceability || hub || expansionStatus);

  const reset = () => {
    setSearch(''); setType(''); setStatus(''); setServiceability(''); setHub(''); setExpansionStatus(''); setPage(1);
  };

  const toggleActive = async (location: Location) => {
    if (location.isActive) await locationsService.deactivate(location._id);
    else await locationsService.activate(location._id);
    refetch();
  };

  const columns: Column<Location>[] = [
    {
      key: 'name',
      header: 'Location',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-gray-100">{r.name}</p>
          {r.code && <p className="text-xs text-gray-400">({r.code})</p>}
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (r) => <span className="capitalize">{r.type}</span> },
    {
      key: 'serviceability',
      header: 'Serviceability',
      render: (r) => (
        <StatusBadge
          label={r.serviceability?.serviceable ? 'Serviceable' : 'Not serviceable'}
          variant={r.serviceability?.serviceable ? 'success' : 'neutral'}
        />
      ),
    },
    { key: 'expansion', header: 'Expansion', render: (r) => EXPANSION_STATUS_LABELS[r.expansionStatus ?? 'active'] },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge label={r.isActive ? 'Active' : 'Inactive'} variant={r.isActive ? 'success' : 'neutral'} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <RowActions
          onView={() => { setDetail(r); setDetailTab('overview'); }}
          onEdit={() => setEditing(r)}
          onManage={() => void toggleActive(r)}
        />
      ),
    },
  ];

const s = detail?.serviceability;
  const detailTabs: DetailTab[] = detail
    ? [
      {
        id: 'overview',
        label: 'Overview',
        content: (
          <dl className="space-y-2 text-sm">
            <Row label="Type" value={detail.type} />
            <Row label="Code" value={detail.code} />
            <Row label="Parent" value={detail.parentId ?? 'Root'} />
            <Row label="Description" value={detail.description || '—'} />
            <Row label="Stage" value={EXPANSION_STATUS_LABELS[detail.expansionStatus ?? 'active']} />
            <Row label="Created" value={detail.createdAt?.slice(0, 10) ?? '—'} />
          </dl>
        ),
      },
      {
        id: 'serviceability',
        label: 'Serviceability',
        content: (
          <dl className="space-y-2 text-sm">
            <Row label="Serviceable" value={String(s?.serviceable ?? false)} />
            <Row label="Delivery" value={String(s?.deliveryAvailable ?? false)} />
            <Row label="Pickup" value={String(s?.pickupAvailable ?? false)} />
            <Row label="COD" value={String(s?.codAvailable ?? false)} />
            <Row label="Estimated time" value={s?.estimatedDeliveryTime ?? '—'} />
            <Row label="Delivery fee" value={s?.deliveryFee ?? '—'} />
          </dl>
        ),
      },
      {
        id: 'hubs',
        label: 'Hubs',
        content: detail.hub?.isHub ? (
          <p className="text-sm">
            <span className="font-medium">{detail.hub.hubName}</span>
            {detail.hub.hubCode ? ` (${detail.hub.hubCode})` : ''}
            {detail.hub.hubAddress ? ` — ${detail.hub.hubAddress}` : ''}
          </p>
        ) : (
          <p className="text-sm text-gray-500">This location is not a hub.</p>
        ),
      },
      {
        id: 'expansion',
        label: 'Expansion',
        content: (
          <p className="text-sm text-gray-700 dark:text-gray-200">
            Current stage: {EXPANSION_STATUS_LABELS[detail.expansionStatus ?? 'active']}
          </p>
        ),
      },
      {
        id: 'activity',
        label: 'Activity',
        content: (
          <p className="text-sm text-gray-500">
            Last updated: {detail.updatedAt ? new Date(detail.updatedAt).toLocaleString() : '—'}
          </p>
        ),
      },
    ]
    : [];
  return (
    <>
      <LocationSummaryCards stats={stats} loading={statsLoading} />

      <FilterBar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search locations…"
        isFiltered={isFiltered}
        onReset={reset}
        resultSummary={data ? `${data.total} location${data.total === 1 ? '' : 's'}` : undefined}
        actions={
          <>
            <ViewToggle mode={view} onChange={setView} showMap />
            <Button variant="primary" onClick={() => setCreating(true)}>Add Location</Button>
          </>
        }
        filters={[
          { key: 'type', label: 'Type', value: type, onChange: (v) => { setType(v); setPage(1); }, options: LOCATION_TYPES },
          { key: 'status', label: 'Status', value: status, onChange: (v) => { setStatus(v); setPage(1); }, options: LOCATION_STATUSES },
          { key: 'serviceability', label: 'Serviceability', value: serviceability, onChange: (v) => { setServiceability(v); setPage(1); }, options: SERVICEABILITY_FILTERS },
          { key: 'hub', label: 'Hub', value: hub, onChange: (v) => { setHub(v); setPage(1); }, options: HUB_FILTERS },
          { key: 'expansion', label: 'Expansion', value: expansionStatus, onChange: (v) => { setExpansionStatus(v); setPage(1); }, options: EXPANSION_STATUSES },
        ]}
      />

      {view === 'map' ? (
        <DataSection error={mapData.error} onRetry={mapData.refetch}>
          <NetworkMapPanel
            locations={mapData.locations}
            zones={mapData.zones}
            routes={mapData.routes}
            onLocationClick={(loc) => { setDetail(loc); setDetailTab('overview'); }}
          />
        </DataSection>
      ) : (
        <DataSection
          error={error}
          onRetry={refetch}
          isEmpty={!loading && locations.length === 0}
          emptyTitle={isFiltered ? 'No locations match these filters' : 'No locations yet'}
          emptyDescription={isFiltered ? 'Try widening or resetting the filters above.' : 'Add your first operating location to start building the delivery network.'}
          emptyAction={isFiltered ? undefined : { label: 'Add Location', onClick: () => setCreating(true) }}
        >
          <DataTable columns={columns} rows={locations} rowKey={(r) => r._id} loading={loading} emptyTitle="No locations found" />
          <Pagination
            className="mt-4"
            page={page}
            totalPages={data?.totalPages ?? 1}
            total={data?.total}
            onPageChange={setPage}
          />
        </DataSection>
      )}

      {creating && (
        <Modal open onClose={() => setCreating(false)} title="Add Location" size="lg">
          <EnhancedLocationForm onSuccess={() => { setCreating(false); refetch(); }} onCancel={() => setCreating(false)} />
        </Modal>
      )}
      {editing && (
        <Modal open onClose={() => setEditing(null)} title={`Edit ${editing.name}`} size="lg">
          <EnhancedLocationForm initial={editing} onSuccess={() => { setEditing(null); refetch(); }} onCancel={() => setEditing(null)} />
        </Modal>
      )}

      <RecordDrawer
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.name ?? ''}
        subtitle={detail?.type}
        statusLabel={detail?.isActive ? 'Active' : 'Inactive'}
        statusVariant={detail?.isActive ? 'success' : 'neutral'}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => detail && setEditing(detail)}>Edit</Button>
            <Button variant="secondary" size="sm" onClick={() => detail && void toggleActive(detail)}>
              {detail?.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </>
        }
        summary={[
          { label: 'Type', value: detail?.type },
          { label: 'Serviceable', value: detail?.serviceability?.serviceable ? 'Yes' : 'No' },
          { label: 'Hub', value: detail?.hub?.isHub ? (detail.hub.hubName ?? 'Yes') : 'No' },
        ]}
        tabs={detailTabs}
        activeTab={detailTab}
        onTabChange={setDetailTab}
      />
    </>
  );
}
