import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsync } from '@/hooks/useAsync';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { ErrorState } from '@/components/common/ErrorState';
import { PageLoader } from '@/components/common/PageLoader';
import { Button } from '@/components/common/Button';
import { SelectField } from '@/components/forms/SelectField';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { http } from '@/services/client/httpClient';
import { locationsService, type Location } from '@/services/locations.service';
import { formatNumber, formatDate } from '@/utils/format';

interface DeliveryStats {
  activeDeliveries?: number;
  pendingDeliveries?: number;
  assignedDeliveries?: number;
  inTransitDeliveries?: number;
  completedDeliveries?: number;
  failedDeliveries?: number;
  cancelledDeliveries?: number;
  unassignedDeliveries?: number;
  availablePartners?: number;
  busyPartners?: number;
  totalPartners?: number;
  activeZones?: number;
  totalZones?: number;
  activeServices?: number;
  totalServices?: number;
  activeRoutes?: number;
  totalRoutes?: number;
  actorPending?: number;
  actorSuspended?: number;
  actorTotal?: number;
}

interface RecentDelivery {
  _id: string;
  orderId: string;
  status: string;
  partnerName?: string;
  pickupAddress?: {
    regionName?: string;
    areaName?: string;
    cityName?: string;
    sectorName?: string;
    shopName?: string;
  };
  destinationAddress?: {
    regionName?: string;
    areaName?: string;
    cityName?: string;
    sectorName?: string;
    addressDetail?: string;
    contactName?: string;
  };
  createdAt: string;
}

export function DeliveryDashboardPage() {
  const navigate = useNavigate();
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Filters
  const [regions, setRegions] = useState<Location[]>([]);
  const [cities, setCities] = useState<Location[]>([]);
  const [sectors, setSectors] = useState<Location[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Load regions for filter
  useEffect(() => {
    locationsService.list({ type: 'region' }).then(setRegions).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedRegion) { setCities([]); return; }
    locationsService.getChildren(selectedRegion).then(setCities).catch(console.error);
  }, [selectedRegion]);

  useEffect(() => {
    if (!selectedCity) { setSectors([]); return; }
    locationsService.getChildren(selectedCity).then(setSectors).catch(console.error);
  }, [selectedCity]);

  const { data: stats, loading, error, refetch } = useAsync(
    async () => {
      try {
        const res = await http.get<{ success: boolean; dashboard: DeliveryStats }>(
          '/delivery/operation/dashboard'
        );
        return res.dashboard || {};
      } catch (err) {
        console.error('Failed to fetch delivery stats:', err);
        throw err;
      }
    },
    []
  );

  const { data: actorStats, loading: _actorLoading } = useAsync(
    async () => {
      try {
        const pending = await http.get<{ success: boolean; actors: any[] }>(
          '/delivery/partner?limit=1000&status=pending'
        );
        const suspended = await http.get<{ success: boolean; actors: any[] }>(
          '/delivery/partner?limit=1000&status=suspended'
        );
        const all = await http.get<{ success: boolean; actors: any[] }>(
          '/delivery/partner?limit=1000'
        );
        return {
          pending: pending.actors?.length || 0,
          suspended: suspended.actors?.length || 0,
          total: all.actors?.length || 0,
        };
      } catch {
        return { pending: 0, suspended: 0, total: 0 };
      }
    },
    []
  );

  const { data: recentDeliveries, loading: recentLoading } = useAsync(
    async () => {
      try {
        const params = new URLSearchParams();
        params.append('limit', '10');
        if (selectedStatus) params.append('status', selectedStatus);
        const res = await http.get<{ success: boolean; deliveries: RecentDelivery[] }>(
          `/delivery/delivery?${params}`
        );
        return res.deliveries || [];
      } catch (err) {
        console.error('Failed to fetch recent deliveries:', err);
        return [];
      }
    },
    [selectedStatus]
  );

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      refetch();
      setLastUpdated(new Date().toLocaleTimeString());
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  const handleRefresh = () => {
    refetch();
    setLastUpdated(new Date().toLocaleTimeString());
  };

  const handleToggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    setLastUpdated(new Date().toLocaleTimeString());
  };

  const clearFilters = () => {
    setSelectedRegion('');
    setSelectedCity('');
    setSelectedSector('');
    setSelectedStatus('');
    setSelectedDate('');
  };

  const hasFilters = selectedRegion || selectedCity || selectedSector || selectedStatus || selectedDate;

  const getStatusColor = (s: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-800',
      assigned: 'bg-blue-100 text-blue-800',
      pickup: 'bg-cyan-100 text-cyan-800',
      in_transit: 'bg-indigo-100 text-indigo-800',
      out_for_delivery: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-300 text-gray-900',
    };
    return colors[s] || 'bg-gray-100 text-gray-800';
  };

  const recentColumns: Column<RecentDelivery>[] = [
    {
      key: 'orderId',
      header: 'Order',
      render: (row) => (
        <span className="font-medium text-gray-800 dark:text-gray-100">
          {row.orderId || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(row.status || '')}`}>
          {(row.status || '—').replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'partnerName',
      header: 'Actor',
      render: (row) => (
        <span className="text-sm text-gray-800 dark:text-gray-100">
          {row.partnerName || row.orderId || '—'}
        </span>
      ),
    },
    {
      key: 'destinationAddress',
      header: 'Destination',
      render: (row) => {
        const addr = row.destinationAddress;
        const location = [addr?.sectorName, addr?.cityName, addr?.regionName].filter(Boolean).join(', ');
        return (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {location || addr?.addressDetail || '—'}
          </span>
        );
      },
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
  ];

  if (loading && !stats) return <PageLoader label="Loading" />;

  return (
    <div>
      <PageHeader
        title="Delivery Overview"
        description="Real-time delivery operations monitoring"
        actions={
          <div className="flex gap-2">
            <Button
              variant={autoRefresh ? 'primary' : 'outline'}
              onClick={handleToggleAutoRefresh}
              size="sm"
            >
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </Button>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          {lastUpdated && (
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Last updated: {lastUpdated}
            </p>
          )}

          {/* Filters */}
          <Card className="mb-6 p-4">
            <div className="flex flex-wrap items-end gap-3">
              <SelectField
                label="Region"
                value={selectedRegion}
                onChange={(e) => { setSelectedRegion(e.target.value); setSelectedCity(''); setSelectedSector(''); }}
                options={[
                  { value: '', label: 'All Regions' },
                  ...regions.map((r) => ({ value: r._id, label: r.name })),
                ]}
                className="w-44"
              />
              <SelectField
                label="City/Area"
                value={selectedCity}
                onChange={(e) => { setSelectedCity(e.target.value); setSelectedSector(''); }}
                options={[
                  { value: '', label: 'All Cities' },
                  ...cities.map((c) => ({ value: c._id, label: c.name })),
                ]}
                className="w-44"
                disabled={!selectedRegion}
              />
              <SelectField
                label="Sector"
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                options={[
                  { value: '', label: 'All Sectors' },
                  ...sectors.map((s) => ({ value: s._id, label: s.name })),
                ]}
                className="w-44"
                disabled={!selectedCity}
              />
              <SelectField
                label="Status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'assigned', label: 'Assigned' },
                  { value: 'pickup', label: 'Pickup' },
                  { value: 'in_transit', label: 'In Transit' },
                  { value: 'out_for_delivery', label: 'Out for Delivery' },
                  { value: 'delivered', label: 'Delivered' },
                  { value: 'failed', label: 'Failed' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
                className="w-44"
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-primary-dark focus:outline-none dark:border-dark-600 dark:bg-dark-900 dark:text-white"
                />
              </div>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </Card>

          {/* Riders Section */}
          <div className="mb-6">
            <h3 className="mb-3 text-lg font-semibold dark:text-white">
              Riders & Delivery Actors
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="flex flex-col items-center gap-2 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Actors</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatNumber(actorStats?.total ?? stats?.totalPartners ?? 0)}
                </p>
              </Card>
              <Card className="flex flex-col items-center gap-2 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Available</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatNumber(stats?.availablePartners ?? 0)}
                </p>
              </Card>
              <Card className="flex flex-col items-center gap-2 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Busy</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {formatNumber(stats?.busyPartners ?? 0)}
                </p>
              </Card>
              <Card className="flex flex-col items-center gap-2 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {formatNumber(actorStats?.pending ?? 0)}
                </p>
              </Card>
            </div>
          </div>

          {/* Active Deliveries Section */}
          <div className="mb-6">
            <h3 className="mb-3 text-lg font-semibold dark:text-white">
              Active Operations
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card className="flex flex-col items-center gap-2 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {formatNumber(stats?.pendingDeliveries ?? 0)}
                </p>
              </Card>
              <Card className="flex flex-col items-center gap-2 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Assigned</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatNumber(stats?.assignedDeliveries ?? 0)}
                </p>
              </Card>
              <Card className="flex flex-col items-center gap-2 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Pickup</p>
                <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                  {formatNumber(stats?.activeDeliveries ?? 0)}
                </p>
              </Card>
              <Card className="flex flex-col items-center gap-2 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">In Transit</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {formatNumber(stats?.inTransitDeliveries ?? 0)}
                </p>
              </Card>
              <Card className="flex flex-col items-center gap-2 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Suspended</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatNumber(actorStats?.suspended ?? stats?.cancelledDeliveries ?? 0)}
                </p>
              </Card>
            </div>
          </div>

          {/* Delivery Results Section */}
          <div className="mb-6">
            <h3 className="mb-3 text-lg font-semibold dark:text-white">
              Delivery Results
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="flex flex-col items-center gap-2 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatNumber(stats?.completedDeliveries ?? 0)}
                </p>
              </Card>
              <Card className="flex flex-col items-center gap-2 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatNumber(stats?.failedDeliveries ?? 0)}
                </p>
              </Card>
              <Card className="flex flex-col items-center gap-2 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Cancelled</p>
                <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {formatNumber(stats?.cancelledDeliveries ?? 0)}
                </p>
              </Card>
            </div>
          </div>

          {/* Infrastructure Section */}
          <div className="mb-6">
            <h3 className="mb-3 text-lg font-semibold dark:text-white">
              Infrastructure & Coverage
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="flex flex-col items-center gap-2 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Zones</p>
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  {formatNumber(stats?.activeZones ?? 0)}/{formatNumber(stats?.totalZones ?? 0)}
                </p>
              </Card>
              <Card className="flex flex-col items-center gap-2 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Routes</p>
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  {formatNumber(stats?.activeRoutes ?? 0)}/{formatNumber(stats?.totalRoutes ?? 0)}
                </p>
              </Card>
              <Card className="flex flex-col items-center gap-2 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Services</p>
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  {formatNumber(stats?.activeServices ?? 0)}/{formatNumber(stats?.totalServices ?? 0)}
                </p>
              </Card>
            </div>
          </div>

          {/* Recent Deliveries */}
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold dark:text-white">Recent Deliveries</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/delivery/assignments')}
              >
                View All
              </Button>
            </div>
            <DataTable<RecentDelivery>
              columns={recentColumns}
              rows={recentDeliveries ?? []}
              rowKey={(row) => row._id}
              loading={recentLoading}
              emptyTitle="No recent deliveries"
              onRowClick={(row) => navigate(`/delivery/assignments/${row._id}`)}
            />
          </div>
        </>
      )}
    </div>
  );
}
