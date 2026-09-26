import { useState, useEffect } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { ErrorState } from '@/components/common/ErrorState';
import { Pagination } from '@/components/common/Pagination';
import { SelectField } from '@/components/forms/SelectField';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { TextField } from '@/components/forms/TextField';
import { zonesService, locationsService, type Zone, type Location } from '@/services/locations.service';
import { formatDate } from '@/utils/format';

const ZONE_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export function DeliveryZonesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editZone, setEditZone] = useState<Zone | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const debouncedSearch = useDebounce(search, 300);

  // Load locations for zone assignment
  useEffect(() => {
    locationsService.list({ type: 'sector' }).then(setLocations).catch(console.error);
  }, []);

  const { data, loading, error, refetch } = useAsync(
    async () => {
      try {
        const res = await zonesService.list({
          status: status || undefined,
          search: debouncedSearch || undefined,
          page,
          limit: 15,
        });
        return res;
      } catch (err) {
        console.error('Failed to fetch zones:', err);
        throw err;
      }
    },
    [page, debouncedSearch, status]
  );

  const getStatusColor = (s: string) => {
    return s === 'active'
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
  };

  const columns: Column<Zone>[] = [
    {
      key: 'name',
      header: 'Zone Name',
      render: (row) => (
        <span className="font-medium text-gray-800 dark:text-gray-100">{row.name}</span>
      ),
    },
    {
      key: 'code',
      header: 'Code',
      accessor: (row) => row.code || '—',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(row.status || '')}`}>
          {row.status || '—'}
        </span>
      ),
    },
    {
      key: 'locationIds',
      header: 'Locations',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.locationIds?.length || 0} location{row.locationIds?.length === 1 ? '' : 's'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditZone(row)}
          >
            Edit
          </Button>
          <Button
            variant={row.status === 'active' ? 'danger' : 'primary'}
            size="sm"
            onClick={async () => {
              if (row.status === 'active') {
                await zonesService.deactivate(row._id);
              } else {
                await zonesService.activate(row._id);
              }
              refetch();
            }}
          >
            {row.status === 'active' ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Delivery Zones"
        description="Manage operational delivery coverage zones linked to location hierarchy"
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
              Create Zone
            </Button>
          </div>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <DataTable<Zone>
            columns={columns}
            rows={data?.zones ?? []}
            rowKey={(row) => row._id}
            loading={loading}
            emptyTitle="No delivery zones found"
            onRowClick={(row) => setEditZone(row)}
          />
          <Pagination
            className="mt-4"
            page={page}
            totalPages={data?.totalPages ?? 0}
            total={data?.total}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Create Zone Modal */}
      <ZoneFormModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        locations={locations}
        onSuccess={() => { setShowCreate(false); refetch(); }}
      />

      {/* Edit Zone Modal */}
      {editZone && (
        <ZoneFormModal
          open={!!editZone}
          onClose={() => setEditZone(null)}
          zone={editZone}
          locations={locations}
          onSuccess={() => { setEditZone(null); refetch(); }}
        />
      )}
    </div>
  );
}

function ZoneFormModal({
  open,
  onClose,
  zone,
  locations,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  zone?: Zone;
  locations: Location[];
  onSuccess: () => void;
}) {
  const [name, setName] = useState(zone?.name || '');
  const [code, setCode] = useState(zone?.code || '');
  const [selectedLocations, setSelectedLocations] = useState<string[]>(zone?.locationIds || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!zone;

  const toggleLocation = (locId: string) => {
    setSelectedLocations((prev) =>
      prev.includes(locId) ? prev.filter((id) => id !== locId) : [...prev, locId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    if (!code.trim()) { setError('Code is required'); return; }

    setSaving(true);
    setError('');
    try {
      if (isEditing) {
        await zonesService.update(zone._id, {
          name: name.trim(),
          code: code.trim(),
          locationIds: selectedLocations,
        });
      } else {
        await zonesService.create({
          name: name.trim(),
          code: code.trim(),
          locationIds: selectedLocations,
        });
      }
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save zone');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Edit Zone' : 'Create Zone'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        <TextField
          label="Zone Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Harar Central Zone"
          required
        />

        <TextField
          label="Zone Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. HZ-001"
          required
        />

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Coverage Locations (Sectors)
          </label>
          <div className="max-h-48 overflow-y-auto rounded-md border border-gray-200 p-3 dark:border-dark-600">
            {locations.length === 0 ? (
              <p className="text-sm text-gray-500">No sectors available</p>
            ) : (
              locations.map((loc) => (
                <label
                  key={loc._id}
                  className="flex items-center gap-2 py-1 text-sm hover:bg-gray-50 dark:hover:bg-dark-800"
                >
                  <input
                    type="checkbox"
                    checked={selectedLocations.includes(loc._id)}
                    onChange={() => toggleLocation(loc._id)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-gray-800 dark:text-gray-100">{loc.name}</span>
                  {loc.code && <span className="text-xs text-gray-400">({loc.code})</span>}
                </label>
              ))
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {selectedLocations.length} location{selectedLocations.length === 1 ? '' : ''} selected
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-dark-600">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>
            {isEditing ? 'Update Zone' : 'Create Zone'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
