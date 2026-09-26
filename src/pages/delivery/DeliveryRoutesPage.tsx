import { useState, useEffect, useCallback } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { ErrorState } from '@/components/common/ErrorState';
import { Pagination } from '@/components/common/Pagination';
import { SelectField } from '@/components/forms/SelectField';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Card } from '@/components/common/Card';
import { Link } from 'react-router-dom';
import { locationsService, routesService, type DeliveryRoute } from '@/services/locations.service';
import { formatDate } from '@/utils/format';

const ROUTE_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export function DeliveryRoutesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [locationMap, setLocationMap] = useState<Record<string, string>>({});
  const debouncedSearch = useDebounce(search, 300);

  const { data, loading, error, refetch } = useAsync(
    async () => {
      try {
        const res = await routesService.list({
          status: status || undefined,
          search: debouncedSearch || undefined,
          page,
          limit: 15,
        });
        return res;
      } catch (err) {
        console.error('Failed to fetch routes:', err);
        throw err;
      }
    },
    [page, debouncedSearch, status]
  );

  useEffect(() => {
    let cancelled = false;
    async function resolveNames() {
      try {
        const allLocs = await locationsService.list();
        if (!cancelled) {
          const map: Record<string, string> = {};
          for (const loc of allLocs) {
            map[loc._id] = loc.name;
          }
          setLocationMap(map);
        }
      } catch {
        // ignore
      }
    }
    resolveNames();
    return () => { cancelled = true; };
  }, []);

  const getOriginName = useCallback((id?: string) => {
    return id ? locationMap[id] || id : '—';
  }, [locationMap]);

  const getDestName = useCallback((id?: string) => {
    return id ? locationMap[id] || id : '—';
  }, [locationMap]);

  const getStatusColor = (s: string) => {
    return s === 'active'
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
  };

  const columns: Column<DeliveryRoute>[] = [
    {
      key: 'name',
      header: 'Route',
      render: (row) => (
        <span className="font-medium text-gray-800 dark:text-gray-100">{row.name || '—'}</span>
      ),
    },
    {
      key: 'origin',
      header: 'Origin',
      render: (row) => (
        <div className="text-sm">
          <p className="font-medium text-gray-800 dark:text-gray-100">{getOriginName(row.originLocationId)}</p>
          {row.originLocationId && (
            <Link to={`/locations/${row.originLocationId}`} className="text-xs text-primary-dark hover:underline">
              View location →
            </Link>
          )}
        </div>
      ),
    },
    {
      key: 'destination',
      header: 'Destination',
      render: (row) => (
        <div className="text-sm">
          <p className="font-medium text-gray-800 dark:text-gray-100">{getDestName(row.destinationLocationId)}</p>
          {row.destinationLocationId && (
            <Link to={`/locations/${row.destinationLocationId}`} className="text-xs text-primary-dark hover:underline">
              View location →
            </Link>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getStatusColor(row.status || '')}`}>
          {row.status || '—'}
        </span>
      ),
    },
    {
      key: 'distance',
      header: 'Distance',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.distance ? `${row.distance} km` : '—'}
        </span>
      ),
    },
    {
      key: 'estimatedDuration',
      header: 'Est. Duration',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.estimatedDuration ? `${row.estimatedDuration} min` : '—'}
        </span>
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

  return (
    <div>
      <PageHeader
        title="Delivery Routes"
        description="Operational route management between locations"
        actions={
          <div className="flex gap-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search routes"
              aria-label="Search"
            />
            <SelectField
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              options={ROUTE_STATUSES}
              className="w-44"
            />
          </div>
        }
      />

      <Card className="mb-4 p-4">
        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
          <span className="text-lg">📍</span>
          <p>
            Routes show the operational path between pickup and destination locations.
            Each route follows the location hierarchy.
          </p>
        </div>
      </Card>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <DataTable<DeliveryRoute>
            columns={columns}
            rows={data?.routes ?? []}
            rowKey={(row) => row._id}
            loading={loading}
            emptyTitle="No routes found"
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
    </div>
  );
}
