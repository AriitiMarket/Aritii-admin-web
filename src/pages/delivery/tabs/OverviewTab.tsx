// Overview Tab Component

import { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { SelectField } from '@/components/forms/SelectField';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Button } from '@/components/common/Button';
import { locationsService, type Location } from '@/services/locations.service';
import { formatNumber, formatDate } from '@/utils/format';
import { useDeliveryStats, useActorStats } from '../hooks/useDeliveryStats';
import { useRecentDeliveries } from '../hooks/useRecentDeliveries';
import { getDeliveryStatusColor } from '../utils/statusHelpers';
import { DELIVERY_STATUSES } from '../constants';
import type { RecentDelivery } from '../types';

interface OverviewTabProps {
  onNavigateToAssignments: () => void;
}

export function OverviewTab({ onNavigateToAssignments }: OverviewTabProps) {
  const [regions, setRegions] = useState<Location[]>([]);
  const [cities, setCities] = useState<Location[]>([]);
  const [sectors, setSectors] = useState<Location[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const { stats, loading: statsLoading } = useDeliveryStats();
  const { actorStats } = useActorStats();
  const { recentDeliveries, loading: recentLoading } = useRecentDeliveries({
    status: selectedStatus,
    limit: 10,
  });

  // Load regions for filters
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

  if (statsLoading && !stats) return null;

  return (
    <>
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
            onClick={onNavigateToAssignments}
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
          onRowClick={onNavigateToAssignments}
        />
      </div>
    </>
  );
}