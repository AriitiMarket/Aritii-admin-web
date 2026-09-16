import { useState } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { ErrorState } from '@/components/common/ErrorState';
import { Card } from '@/components/common/Card';
import { Pagination } from '@/components/common/Pagination';
import { SelectField } from '@/components/forms/SelectField';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { http } from '@/services/client/httpClient';
import { formatDate } from '@/utils/format';

interface Zone {
  id?: string;
  _id?: string;
  name?: string;
  code?: string;
  status?: 'active' | 'inactive' | 'suspended';
  description?: string;
  locationIds?: string[];
  coverage?: {
    radiusKm?: number;
    boundaries?: any;
    notes?: string;
  };
  createdAt?: string;
}

interface ZonesResponse {
  zones?: Zone[];
  items?: Zone[];
  count?: number;
  total?: number;
}

const ZONE_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];

export function DeliveryZonesPage() {
  const { t } = useLocalization();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data, loading, error, refetch } = useAsync(
    async () => {
      try {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', '10');
        if (debouncedSearch) params.append('search', debouncedSearch);
        if (status) params.append('status', status);

        const res = await http.get<ZonesResponse>(
          `/delivery/zone?${params}`
        );
        const items = res.zones || res.items || [];
        return {
          items: items.map((z: Zone) => ({
            ...z,
            id: z._id || z.id,
          })),
          total: res.total || res.count || items.length,
          totalPages: Math.ceil((res.total || res.count || 0) / 10),
        };
      } catch (err) {
        console.error('Failed to fetch zones:', err);
        throw err;
      }
    },
    [page, debouncedSearch, status]
  );

  const getStatusColor = (s?: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
    };
    return colors[s || ''] || 'bg-gray-100 text-gray-800';
  };

  const columns: Column<Zone>[] = [
    {
      key: 'name',
      header: t('Zone Name'),
      render: (row) => (
        <span className="font-medium text-gray-800 dark:text-gray-100">
          {row.name || '—'}
        </span>
      ),
    },
    {
      key: 'code',
      header: 'Code',
      render: (row) => (
        <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
          {row.code || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('Status'),
      render: (row) => (
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(row.status)}`}>
          {row.status || '—'}
        </span>
      ),
    },
    {
      key: 'locationIds',
      header: 'Covered Locations',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.locationIds?.length || 0} locations
        </span>
      ),
    },
    {
      key: 'coverage.radiusKm',
      header: 'Coverage Radius',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.coverage?.radiusKm ? `${row.coverage.radiusKm} km` : '—'}
        </span>
      ),
    },
    {
      key: 'description',
      header: t('Description'),
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.description || '—'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t('Created'),
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
  ];

  const activeZones = data?.items?.filter(z => z.status === 'active').length || 0;
  const totalZones = data?.total || 0;

  return (
    <div>
      <PageHeader
        title={t('Delivery Zones')}
        description={t('Manage delivery service zones and coverage areas')}
        actions={
          <div className="flex gap-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('Search zones')}
              aria-label={t('Search')}
            />
            <SelectField
              value={status}
              onChange={setStatus}
              options={ZONE_STATUSES}
              className="w-48"
            />
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="flex flex-col items-center gap-2 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Zones</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {totalZones}
          </p>
        </Card>
        <Card className="flex flex-col items-center gap-2 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Active Zones</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {activeZones}
          </p>
        </Card>
        <Card className="flex flex-col items-center gap-2 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Coverage</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {totalZones > 0 ? Math.round((activeZones / totalZones) * 100) : 0}%
          </p>
        </Card>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <DataTable<Zone>
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(row) => row.id || row._id || ''}
            loading={loading}
            emptyTitle={t('No zones')}
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
