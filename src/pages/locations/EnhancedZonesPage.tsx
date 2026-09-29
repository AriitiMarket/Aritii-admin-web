import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { SearchInput } from '@/components/common/SearchInput';
import { SelectField } from '@/components/forms/SelectField';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { Modal } from '@/components/common/Modal';
import { zonesService, locationsService, type Zone } from '@/services/locations.service';
import { formatDate } from '@/utils/format';
import type { ZoneStats } from './types';
import { EnhancedZoneForm } from './components/EnhancedZoneForm';
import { AuditLogPanel } from './components/AuditLogPanel';

const ZONE_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];

export function EnhancedZonesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editZone, setEditZone] = useState<Zone | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zones, setZones] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [activeTab, setActiveTab] = useState<'zones' | 'activity'>('zones');
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [locations, setLocations] = useState<any[]>([]);

  const stats: ZoneStats = {
    totalZones: zones.length,
    activeZones: zones.filter(z => z.status === 'active').length,
    serviceableZones: zones.filter(z => z.deliveryRules?.serviceable).length,
    unassignedZones: zones.filter(z => !z.locationIds || z.locationIds.length === 0).length,
    zonesWithActiveRoutes: 0,
  };

  const columns: Column<Zone>[] = [
    {
      key: 'name',
      header: 'Zone',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-gray-100">{row.name || '—'}</p>
          <p className="text-xs text-gray-500">{row.code || '—'}</p>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.locationIds?.length || 0} location{row.locationIds?.length === 1 ? '' : 's'}
        </span>
      ),
    },
    {
      key: 'coverage',
      header: 'Coverage',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.coverage?.radiusKm ? `${row.coverage.radiusKm} km` : '—'}
        </span>
      ),
    },
    {
      key: 'fee',
      header: 'Fee',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.deliveryRules?.deliveryFee ? `${row.deliveryRules.deliveryFee} ETB` : '—'}
        </span>
      ),
    },
    {
      key: 'routes',
      header: 'Routes',
      render: () => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          —
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const statusColors: Record<string, string> = {
          active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
          suspended: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[row.status] || 'bg-gray-100 text-gray-800'}`}>
            {row.status}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/delivery/zones/${row._id}`)}
          >
            View
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditZone(row)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setSelectedZone(row); setActiveTab('activity'); }}
          >
            Activity
          </Button>
          <Button
            size="sm"
            variant={row.status === 'active' ? 'danger' : 'primary'}
            onClick={async () => {
              if (row.status === 'active') {
                await zonesService.deactivate(row._id);
              } else {
                await zonesService.activate(row._id);
              }
              loadZones();
            }}
          >
            {row.status === 'active' ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
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

  useEffect(() => {
    loadZones();
    loadLocations();
  }, [status, search, page]);

  const loadZones = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await zonesService.list({
        status: status || undefined,
        search: search || undefined,
        page,
        limit: 15,
      });
      setZones(result.zones);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Failed to fetch zones:', err);
      setError('Failed to load zones');
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    try {
      const locs = await locationsService.list();
      // Filter for sector-type locations (areas/sectors)
      const sectors = locs.filter((l: any) => l.type === 'sector' || l.type === 'area');
      setLocations(sectors);
    } catch (err) {
      console.error('Failed to load locations:', err);
    }
  };

  return (
    <div>
      <PageHeader
        title="Delivery Zones"
        description="Define and control the areas served by Aritii Market delivery operations"
        actions={
          <div className="flex gap-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search zones"
              aria-label="Search"
            />
            <SelectField
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              options={ZONE_STATUSES}
              className="w-44"
            />
            <Button onClick={() => setShowCreate(true)}>
              + Create Delivery Zone
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
        <Card className="flex flex-col items-center gap-2 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Zones</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalZones}</p>
        </Card>
        <Card className="flex flex-col items-center gap-2 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Active Zones</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.activeZones}</p>
        </Card>
        <Card className="flex flex-col items-center gap-2 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Serviceable</p>
          <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{stats.serviceableZones}</p>
        </Card>
        <Card className="flex flex-col items-center gap-2 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Unassigned</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.unassignedZones}</p>
        </Card>
        <Card className="flex flex-col items-center gap-2 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Active Routes</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.zonesWithActiveRoutes}</p>
        </Card>
      </div>

      {/* Tab Switcher */}
      <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('zones')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'zones'
                ? 'border-primary-dark text-primary-dark dark:border-primary-light dark:text-primary-light'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Zones
          </button>
          {selectedZone && (
            <button
              onClick={() => setActiveTab('activity')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'activity'
                  ? 'border-primary-dark text-primary-dark dark:border-primary-light dark:text-primary-light'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Activity
            </button>
          )}
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'zones' ? (
        <Card className="p-4">
          {error ? (
            <div className="text-red-600">{error}</div>
          ) : (
            <>
              <DataTable<Zone>
                columns={columns}
                rows={zones}
                rowKey={(row) => row._id}
                loading={loading}
                emptyTitle="No delivery zones found"
                onRowClick={(row) => navigate(`/delivery/zones/${row._id}`)}
              />
              <Pagination
                className="mt-4"
                page={page}
                totalPages={totalPages}
                total={total}
                onPageChange={setPage}
              />
            </>
          )}
        </Card>
      ) : activeTab === 'activity' && selectedZone ? (
        <AuditLogPanel
          entityType="zone"
          entityId={selectedZone._id}
          entityName={selectedZone.name}
        />
      ) : null}

      {/* Create Zone Modal */}
      {showCreate && (
        <Modal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          title="Create Delivery Zone"
          size="lg"
        >
          <EnhancedZoneForm
            locations={locations}
            onSuccess={() => { setShowCreate(false); loadZones(); }}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      )}

      {/* Edit Zone Modal */}
      {editZone && (
        <Modal
          open={!!editZone}
          onClose={() => setEditZone(null)}
          title="Edit Delivery Zone"
          size="lg"
        >
          <EnhancedZoneForm
            initial={editZone}
            locations={locations}
            onSuccess={() => { setEditZone(null); loadZones(); }}
            onCancel={() => setEditZone(null)}
          />
        </Modal>
      )}
    </div>
  );
}