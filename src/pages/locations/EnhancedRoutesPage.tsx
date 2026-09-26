// Enhanced Delivery Routes Management Page

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
import { locationsService, routesService, type DeliveryRoute } from '@/services/locations.service';
import { formatDate } from '@/utils/format';
import type { RouteStats } from './types';
import { EnhancedRouteForm } from './components/EnhancedRouteForm';

const ROUTE_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'archived', label: 'Archived' },
];

export function EnhancedRoutesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editRoute, setEditRoute] = useState<DeliveryRoute | null>(null);
  const [locationMap, setLocationMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Stats calculated from loaded routes
  const stats: RouteStats = {
    totalRoutes: routes.length,
    activeRoutes: routes.filter(r => r.status === 'active').length,
    routesInOperation: routes.filter(r => r.status === 'active' && r.providerId).length,
    delayedRoutes: routes.filter(r => r.status === 'suspended').length,
    routesRequiringReview: routes.filter(r => r.status === 'inactive').length,
  };

  const loadRoutes = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await routesService.list({
        status: status || undefined,
        search: search || undefined,
        page,
        limit: 15,
      });
      setRoutes(result.routes);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Failed to fetch routes:', err);
      setError('Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    try {
      const allLocs = await locationsService.list();
      const map: Record<string, string> = {};
      for (const loc of allLocs) {
        map[loc._id] = loc.name;
      }
      setLocationMap(map);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadRoutes();
    loadLocations();
  }, [page, search, status]);

  const getOriginName = (id?: string) => {
    const locId = typeof id === 'object' ? (id as any)._id || (id as any).id : id;
    return locId ? locationMap[String(locId)] || String(locId) : '—';
  };

  const getDestName = (id?: string) => {
    const locId = typeof id === 'object' ? (id as any)._id || (id as any).id : id;
    return locId ? locationMap[String(locId)] || String(locId) : '—';
  };

  const getStatusColor = (s: string) => {
    return s === 'active'
      ? 'bg-green-100 text-green-800'
      : s === 'suspended'
      ? 'bg-orange-100 text-orange-800'
      : s === 'archived'
      ? 'bg-gray-300 text-gray-900'
      : 'bg-gray-100 text-gray-800';
  };

  const columns: Column<DeliveryRoute>[] = [
    {
      key: 'name',
      header: 'Route',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-gray-100">{row.name || '—'}</p>
          <p className="text-xs text-gray-500">{row.originLocationName || ''} → {row.destinationLocationName || ''}</p>
        </div>
      ),
    },
    {
      key: 'origin',
      header: 'From',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {getOriginName(row.originLocationId)}
        </span>
      ),
    },
    {
      key: 'destination',
      header: 'To',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {getDestName(row.destinationLocationId)}
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
      key: 'eta',
      header: 'ETA',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.estimatedDuration ? `${row.estimatedDuration} min` : '—'}
        </span>
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
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/delivery/routes/${row._id}`)}
          >
            View
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditRoute(row)}
          >
            Edit
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

  return (
    <div>
      <PageHeader
        title="Delivery Routes"
        description="Configure and monitor the routes used by delivery operations"
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
            <Button onClick={() => setShowCreate(true)}>
              + Create Route
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
        <Card className="flex flex-col items-center gap-2 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Routes</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalRoutes}</p>
        </Card>
        <Card className="flex flex-col items-center gap-2 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Active Routes</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.activeRoutes}</p>
        </Card>
        <Card className="flex flex-col items-center gap-2 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">In Operation</p>
          <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{stats.routesInOperation}</p>
        </Card>
        <Card className="flex flex-col items-center gap-2 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Delayed/Blocked</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.delayedRoutes}</p>
        </Card>
        <Card className="flex flex-col items-center gap-2 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Needs Review</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.routesRequiringReview}</p>
        </Card>
      </div>

      <Card className="mb-4 p-4">
        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
          <span className="text-lg">🛣️</span>
          <p>
            Routes define the operational path between pickup points, hubs, and destination zones.
            Each route connects actual locations in the hierarchy.
          </p>
        </div>
      </Card>

      {error ? (
        <Card className="p-4 text-red-600">{error}</Card>
      ) : (
        <>
          <DataTable<DeliveryRoute>
            columns={columns}
            rows={routes}
            rowKey={(row) => row._id}
            loading={loading}
            emptyTitle="No routes found"
            onRowClick={(row) => navigate(`/delivery/routes/${row._id}`)}
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

      {/* Create Route Modal */}
      {showCreate && (
        <Modal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          title="Create Route"
          size="lg"
        >
          <EnhancedRouteForm
            onSuccess={() => { setShowCreate(false); loadRoutes(); }}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      )}

      {/* Edit Route Modal */}
      {editRoute && (
        <Modal
          open={!!editRoute}
          onClose={() => setEditRoute(null)}
          title="Edit Route"
          size="lg"
        >
          <EnhancedRouteForm
            initial={editRoute}
            onSuccess={() => { setEditRoute(null); loadRoutes(); }}
            onCancel={() => setEditRoute(null)}
          />
        </Modal>
      )}
    </div>
  );
}