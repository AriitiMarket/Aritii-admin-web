// Overview Tab Component — the body of the Delivery & Logistics dashboard.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { SelectField } from '@/components/forms/SelectField';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { PageLoader } from '@/components/common/PageLoader';
import { locationsService, type Location } from '@/services/locations.service';
import { formatNumber, formatDate } from '@/utils/format';
import { useDeliveryStats } from '../hooks/useDeliveryStats';
import { useRecentDeliveries } from '../hooks/useRecentDeliveries';
import { getDeliveryStatusColor } from '../utils/statusHelpers';
import { DELIVERY_STATUSES } from '../constants';
import type { RecentDelivery } from '../types';

interface OverviewTabProps {
  /** Bumped by the page's Refresh / auto-refresh so the dashboard re-pulls. */
  refreshKey?: number;
}

/**
 * A metric card that opens the list it counts. Every number on this dashboard
 * leads to the rows behind it — no orphan stats.
 */
function StatCard({
  label,
  value,
  display,
  tone,
  to,
}: {
  label: string;
  value: number | undefined;
  /** Overrides the rendered number — e.g. "12/40" active-of-total ratios. */
  display?: string;
  tone: string;
  to: string;
}) {
  const navigate = useNavigate();
  return (
    <Card className="p-4">
      <button
        type="button"
        onClick={() => navigate(to)}
        title={`Open ${label}`}
        className="flex w-full flex-col items-center gap-2 rounded-md py-1 outline-none transition hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-primary-dark dark:hover:bg-dark-800"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
        <p className={`text-2xl font-bold ${tone}`}>{display ?? formatNumber(value ?? 0)}</p>
      </button>
    </Card>
  );
}

export function OverviewTab({ refreshKey = 0 }: OverviewTabProps) {
  const navigate = useNavigate();
  const [regions, setRegions] = useState<Location[]>([]);
  const [cities, setCities] = useState<Location[]>([]);
  const [sectors, setSectors] = useState<Location[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // One date picker covers a full day: [00:00, 23:59:59.999].
  const dateFrom = selectedDate ? `${selectedDate}T00:00:00` : '';
  const dateTo = selectedDate ? `${selectedDate}T23:59:59.999` : '';

  const {
    stats,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useDeliveryStats(
    { status: selectedStatus, sectorId: selectedSector, dateFrom, dateTo },
    refreshKey
  );

  const {
    recentDeliveries,
    loading: recentLoading,
    error: recentError,
    refetch: refetchRecent,
  } = useRecentDeliveries({
    status: selectedStatus,
    sectorId: selectedSector,
    dateFrom,
    dateTo,
    limit: 10,
    refreshKey,
  });

  // Region → City → Sector cascade. The chosen sector (and date/status) is
  // what actually filters the metrics and the table below.
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

  const clearFilters = () => {
    setSelectedRegion('');
    setSelectedCity('');
    setSelectedSector('');
    setSelectedStatus('');
    setSelectedDate('');
  };

  const hasFilters = selectedRegion || selectedCity || selectedSector || selectedStatus || selectedDate;

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
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getDeliveryStatusColor(row.status || '')}`}>
          {(row.status || '—').replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'partnerName',
      header: 'Actor',
      render: (row) => (
        <span className="text-sm text-gray-800 dark:text-gray-100">
          {row.providerName || row.partnerName || '—'}
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

  if (statsLoading && !stats) return <PageLoader label="Loading overview" />;

  return (
    <>
      {/* Filters — every control here feeds both the metrics and the table. */}
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
            options={DELIVERY_STATUSES}
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
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          Region and City narrow the sector list — the selected Sector, Status and Date filter the
          metrics and the deliveries below.
        </p>
      </Card>

      {statsError && <ErrorState message={statsError} onRetry={refetchStats} />}

      {/* Riders Section */}
      <div className="mb-6">
        <h3 className="mb-3 text-lg font-semibold dark:text-white">
          Riders & Delivery Actors
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total Actors" value={stats?.totalPartners} tone="text-blue-600 dark:text-blue-400" to="/delivery/providers" />
          <StatCard label="Available" value={stats?.availablePartners} tone="text-green-600 dark:text-green-400" to="/delivery/providers?status=available" />
          <StatCard label="Busy" value={stats?.busyPartners} tone="text-orange-600 dark:text-orange-400" to="/delivery/providers?status=busy" />
          <StatCard label="Pending" value={stats?.pendingPartners} tone="text-yellow-600 dark:text-yellow-400" to="/delivery/providers?status=pending" />
          <StatCard label="Suspended" value={stats?.suspendedPartners} tone="text-red-600 dark:text-red-400" to="/delivery/providers?status=suspended" />
        </div>
      </div>

      {/* Active Operations — the live delivery funnel. */}
      <div className="mb-6">
        <h3 className="mb-3 text-lg font-semibold dark:text-white">
          Active Operations
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Pending" value={stats?.pendingDeliveries} tone="text-yellow-600 dark:text-yellow-400" to="/delivery/deliveries?status=pending" />
          <StatCard label="Assigned" value={stats?.assignedDeliveries} tone="text-blue-600 dark:text-blue-400" to="/delivery/deliveries?status=assigned" />
          <StatCard label="Pickup" value={stats?.pickupDeliveries} tone="text-cyan-600 dark:text-cyan-400" to="/delivery/deliveries?status=pickup" />
          <StatCard label="In Transit" value={stats?.inTransitDeliveries} tone="text-indigo-600 dark:text-indigo-400" to="/delivery/deliveries?status=in_transit" />
          <StatCard label="Delivered Today" value={stats?.deliveredToday} tone="text-green-600 dark:text-green-400" to="/delivery/deliveries?status=delivered" />
        </div>
      </div>

      {/* Delivery Results Section */}
      <div className="mb-6">
        <h3 className="mb-3 text-lg font-semibold dark:text-white">
          Delivery Results
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="Completed" value={stats?.completedDeliveries} tone="text-green-600 dark:text-green-400" to="/delivery/deliveries?status=delivered" />
          <StatCard label="Failed" value={stats?.failedDeliveries} tone="text-red-600 dark:text-red-400" to="/delivery/deliveries?status=failed" />
          <StatCard label="Cancelled" value={stats?.cancelledDeliveries} tone="text-red-600 dark:text-red-400" to="/delivery/deliveries?status=cancelled" />
        </div>
      </div>

      {/* Shipments in motion */}
      <div className="mb-6">
        <h3 className="mb-3 text-lg font-semibold dark:text-white">
          Shipments
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="Active Shipments" value={stats?.activeShipments} tone="text-teal-600 dark:text-teal-400" to="/delivery/shipments" />
          <StatCard label="Waiting for Dispatch" value={stats?.waitingForDispatchShipments} tone="text-amber-600 dark:text-amber-400" to="/delivery/shipments" />
          <StatCard label="In Transit" value={stats?.inTransitShipments} tone="text-indigo-600 dark:text-indigo-400" to="/delivery/shipments" />
        </div>
      </div>

      {/* Infrastructure Section */}
      <div className="mb-6">
        <h3 className="mb-3 text-lg font-semibold dark:text-white">
          Infrastructure & Coverage
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            label="Active Zones"
            value={stats?.activeZones}
            display={`${formatNumber(stats?.activeZones ?? 0)}/${formatNumber(stats?.totalZones ?? 0)}`}
            tone="text-teal-600 dark:text-teal-400"
            to="/locations?tab=zones"
          />
          <StatCard
            label="Active Routes"
            value={stats?.activeRoutes}
            display={`${formatNumber(stats?.activeRoutes ?? 0)}/${formatNumber(stats?.totalRoutes ?? 0)}`}
            tone="text-teal-600 dark:text-teal-400"
            to="/locations?tab=routes"
          />
          <StatCard
            label="Active Services"
            value={stats?.activeServices}
            display={`${formatNumber(stats?.activeServices ?? 0)}/${formatNumber(stats?.totalServices ?? 0)}`}
            tone="text-teal-600 dark:text-teal-400"
            to="/delivery/services"
          />
        </div>
      </div>

      {/* Recent Deliveries */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold dark:text-white">Recent Deliveries</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/delivery/deliveries')}
          >
            View All
          </Button>
        </div>
        {recentError ? (
          <ErrorState message={recentError} onRetry={refetchRecent} />
        ) : (
          <DataTable<RecentDelivery>
            columns={recentColumns}
            rows={recentDeliveries ?? []}
            rowKey={(row) => row._id}
            loading={recentLoading}
            emptyTitle="No recent deliveries"
            onRowClick={(row) => navigate(`/delivery/deliveries?orderId=${encodeURIComponent(row.orderId)}`)}
          />
        )}
      </div>
    </>
  );
}
