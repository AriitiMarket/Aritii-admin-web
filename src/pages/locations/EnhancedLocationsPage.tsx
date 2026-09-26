// Enhanced Locations Management Page

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { SearchInput } from '@/components/common/SearchInput';
import { SelectField } from '@/components/forms/SelectField';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { Modal } from '@/components/common/Modal';
import { LocationSummaryCards } from './components/LocationSummaryCards';
import { EnhancedLocationForm } from './components/EnhancedLocationForm';
import { ExpansionProgressTracker } from './components/ExpansionProgressTracker';
import { NetworkMapView } from './components/NetworkMapView';
import { useLocations, useLocationStats } from './hooks/useLocations';
import { locationsService } from '@/services/locations.service';
import { LOCATION_TYPES, LOCATION_STATUSES, SERVICEABILITY_FILTERS, HUB_FILTERS, EXPANSION_STATUSES, LOCATION_TYPE_LABELS, LOCATION_TYPE_COLORS, EXPANSION_STATUS_COLORS, EXPANSION_STATUS_LABELS } from './constants';
import type { Location } from './types';
import { formatDate } from '@/utils/format';

export function EnhancedLocationsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [serviceability, setServiceability] = useState('');
  const [hub, setHub] = useState('');
  const [expansionStatus, setExpansionStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editLocation, setEditLocation] = useState<Location | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [expansionLocation, setExpansionLocation] = useState<Location | null>(null);

  const { data, loading, refetch } = useLocations({
    type,
    status,
    serviceability,
    hub,
    expansionStatus,
    search,
    page,
  });

  const { stats, loading: statsLoading } = useLocationStats();

  const handleViewLocation = (location: Location) => {
    navigate(`/locations/${location._id}`);
  };

  const handleEditLocation = (location: Location) => {
    setEditLocation(location);
  };

  const handleToggleStatus = async (location: Location) => {
    try {
      if (location.isActive) {
        await locationsService.deactivate(location._id);
      } else {
        await locationsService.activate(location._id);
      }
      refetch();
    } catch (err) {
      console.error('Failed to toggle location status:', err);
    }
  };

  const columns: Column<Location>[] = [
    {
      key: 'name',
      header: 'Location',
      render: (row) => (
        <div className="flex items-center gap-3">
          <span className="text-lg">{LOCATION_TYPE_LABELS[row.type]?.split(' ')[0] || '📌'}</span>
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-100">{row.name}</p>
            {row.localName && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{row.localName}</p>
            )}
            {row.code && (
              <p className="text-xs text-gray-400">({row.code})</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${LOCATION_TYPE_COLORS[row.type] || LOCATION_TYPE_COLORS.other}`}>
          {row.type}
        </span>
      ),
    },
    {
      key: 'parent',
      header: 'Parent',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.parentId ? '—' : 'Root'}
        </span>
      ),
    },
    {
      key: 'serviceability',
      header: 'Serviceable',
      render: (row) => (
        <span className={`text-sm ${row.serviceability?.serviceable ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
          {row.serviceability?.serviceable ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'hub',
      header: 'Hub',
      render: (row) => (
        <span className={`text-sm ${row.hub?.isHub ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500'}`}>
          {row.hub?.isHub ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'expansionStatus',
      header: 'Expansion',
      render: (row) => (
        row.expansionStatus ? (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${EXPANSION_STATUS_COLORS[row.expansionStatus]}`}>
            {EXPANSION_STATUS_LABELS[row.expansionStatus]}
          </span>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${row.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => { e.stopPropagation(); handleViewLocation(row); }}
          >
            View
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => { e.stopPropagation(); handleEditLocation(row); }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant={row.isActive ? 'danger' : 'primary'}
            onClick={(e) => { e.stopPropagation(); handleToggleStatus(row); }}
          >
            {row.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
    {
      key: 'expansionStatus',
      header: 'Expansion',
      render: (row) => {
        const status = (row as any).expansionStatus || 'active';
        const colorClass = EXPANSION_STATUS_COLORS[status] || 'bg-gray-100 text-gray-600';
        return (
          <button
            onClick={(e) => { e.stopPropagation(); setExpansionLocation(row); }}
            className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass} hover:opacity-80`}
          >
            {EXPANSION_STATUS_LABELS[status] || status}
          </button>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {formatDate(row.createdAt || '')}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Locations"
        description="Manage cities, towns, areas, hubs and serviceable locations used throughout Ariiti Market"
        actions={
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'map' ? 'primary' : 'outline'}
              onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
              size="sm"
            >
              {viewMode === 'list' ? 'Map View' : 'List View'}
            </Button>
            <Button onClick={() => setShowCreate(true)}>
              + Add Location
            </Button>
          </div>
        }
      />

      <LocationSummaryCards stats={stats || { totalLocations: 0, activeLocations: 0, serviceableLocations: 0, hubs: 0, pendingExpansion: 0 }} loading={statsLoading} />

      <Card className="mt-6 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search locations"
            aria-label="Search"
          />
          <SelectField
            label="Type"
            value={type}
            onChange={(e) => { setType(e.target.value); setPage(1); }}
            options={LOCATION_TYPES}
            className="w-44"
          />
          <SelectField
            label="Status"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            options={LOCATION_STATUSES}
            className="w-44"
          />
          <SelectField
            label="Serviceability"
            value={serviceability}
            onChange={(e) => { setServiceability(e.target.value); setPage(1); }}
            options={SERVICEABILITY_FILTERS}
            className="w-44"
          />
          <SelectField
            label="Hub"
            value={hub}
            onChange={(e) => { setHub(e.target.value); setPage(1); }}
            options={HUB_FILTERS}
            className="w-44"
          />
          <SelectField
            label="Expansion"
            value={expansionStatus}
            onChange={(e) => { setExpansionStatus(e.target.value); setPage(1); }}
            options={EXPANSION_STATUSES}
            className="w-44"
          />
          <Button variant="outline" onClick={() => { setType(''); setStatus(''); setServiceability(''); setHub(''); setExpansionStatus(''); setSearch(''); }}>
            Reset
          </Button>
        </div>
      </Card>

      {viewMode === 'list' ? (
        <>
          <DataTable<Location>
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(row) => row._id}
            loading={loading}
            emptyTitle="No locations found"
            onRowClick={(row) => handleViewLocation(row)}
          />
          <Pagination
            className="mt-4"
            page={page}
            totalPages={data?.totalPages ?? 0}
            total={data?.total}
            onPageChange={setPage}
          />
        </>
      ) : (
        <NetworkMapView
          locations={data?.items || []}
          zones={[]} // Will be loaded when needed
          routes={[]} // Will be loaded when needed
          onLocationClick={(loc) => navigate(`/locations/${loc._id}`)}
        />
      )}

      {/* Expansion Progress Modal */}
      {expansionLocation && (
        <Modal
          open={!!expansionLocation}
          onClose={() => setExpansionLocation(null)}
          title={`${expansionLocation.name} Expansion Progress`}
          size="lg"
        >
          <ExpansionProgressTracker
            locationName={expansionLocation.name}
            expansionStatus={(expansionLocation as any).expansionStatus || 'active'}
            progress={{
              locationCreated: true,
              serviceabilityConfigured: (expansionLocation as any).serviceability?.serviceable || false,
              zonesConfigured: false, // Will be calculated from actual zones
              hubConfigured: (expansionLocation as any).hub?.isHub || false,
              routesConfigured: false, // Will be calculated from actual routes
              providersConfigured: false, // Will be calculated from actual providers
              serviceabilityTested: (expansionLocation as any).expansionStatus === 'active',
              approved: (expansionLocation as any).expansionStatus === 'active',
              activated: (expansionLocation as any).expansionStatus === 'active',
            }}
          />
        </Modal>
      )}

      {/* Create Location Modal */}
      {showCreate && (
        <Modal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          title="Add Location"
          size="lg"
        >
          <EnhancedLocationForm
            onSuccess={() => { setShowCreate(false); refetch(); }}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      )}

      {/* Edit Location Modal */}
      {editLocation && (
        <Modal
          open={!!editLocation}
          onClose={() => setEditLocation(null)}
          title="Edit Location"
          size="lg"
        >
          <EnhancedLocationForm
            initial={editLocation}
            onSuccess={() => { setEditLocation(null); refetch(); }}
            onCancel={() => setEditLocation(null)}
          />
        </Modal>
      )}
    </div>
  );
}