import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ridersService } from '@/services/riders.service';
import { useAsync } from '@/hooks/useAsync';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { PageLoader } from '@/components/common/PageLoader';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { formatDate } from '@/utils/format';
import { http } from '@/services/client/httpClient';
import type { RiderStatus } from '@/types';

interface RiderDelivery {
  _id: string;
  orderId: string;
  status: string;
  deliveryAddress?: { regionName?: string; cityName?: string; sectorName?: string; addressDetail?: string };
  createdAt: string;
}

const ACTOR_STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  busy: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  offline: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  suspended: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const ACTOR_STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  busy: 'Busy',
  offline: 'Offline',
  pending: 'Pending',
  suspended: 'Suspended',
};

export function RiderDetailPage() {
  const { riderId } = useParams<{ riderId: string }>();
  const [actionLoading, setActionLoading] = useState(false);

  const { data: rider, loading, error, refetch } = useAsync(
    () => ridersService.get(riderId ?? ''),
    [riderId]
  );

  const { data: deliveries } = useAsync(
    async () => {
      if (!riderId) return [];
      try {
        const res = await http.get<{ success: boolean; deliveries: RiderDelivery[] }>(
          `/delivery/delivery?limit=20&providerId=${riderId}`
        );
        return (res.deliveries || []).filter((d) => d._id);
      } catch {
        return [];
      }
    },
    [riderId]
  );

  const handleToggleStatus = async () => {
    if (!rider) return;
    setActionLoading(true);
    try {
      const current = rider.status as RiderStatus;
      let newStatus: RiderStatus;
      if (current === 'available') {
        newStatus = 'busy';
      } else if (current === 'busy') {
        newStatus = 'available';
      } else if (current === 'pending' || current === 'suspended') {
        newStatus = 'available';
      } else {
        newStatus = 'suspended';
      }
      await ridersService.updateStatus(rider.id, newStatus);
      await refetch();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <PageLoader label="Loading" />;
  if (error || !rider) {
    return <ErrorState message={error ?? 'Rider not found'} onRetry={refetch} />;
  }

  const getStatusColor = (s: string) => {
    return ACTOR_STATUS_COLORS[s] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (s: string) => {
    return ACTOR_STATUS_LABELS[s] || s || '—';
  };

  const getDeliveryStatusColor = (s: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-800',
      assigned: 'bg-blue-100 text-blue-800',
      pickup: 'bg-cyan-100 text-cyan-800',
      in_transit: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[s] || 'bg-gray-100 text-gray-800';
  };

  const isAvailable = rider.status === 'available' || rider.status === 'busy';

  const deliveryColumns: Column<RiderDelivery>[] = [
    {
      key: 'orderId',
      header: 'Order',
      render: (row) => (
        <span className="font-medium text-gray-800 dark:text-gray-100">{row.orderId || '—'}</span>
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
      key: 'deliveryAddress',
      header: 'Destination',
      render: (row) => {
        const addr = row.deliveryAddress;
        const location = [addr?.sectorName, addr?.cityName, addr?.regionName].filter(Boolean).join(', ');
        return <span className="text-sm text-gray-600 dark:text-gray-400">{location || '—'}</span>;
      },
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (row) => <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(row.createdAt)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title={rider.name}
        description={rider.email || rider.phone || '—'}
        actions={
          <div className="flex gap-2">
            <Link to="/riders">
              <Button variant="outline">Back to Riders</Button>
            </Link>
            <Button
              variant={isAvailable ? 'danger' : 'primary'}
              loading={actionLoading}
              onClick={handleToggleStatus}
            >
              {rider.status === 'available' ? 'Set Busy' :
               rider.status === 'busy' ? 'Set Available' :
               rider.status === 'pending' ? 'Approve' :
               rider.status === 'suspended' ? 'Reactivate' : 'Suspend'}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="flex flex-col items-center gap-3 p-6 text-center">
          <Avatar name={rider.name} size="lg" />
          <p className="text-lg font-bold dark:text-white">{rider.name}</p>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(rider.status || '')}`}>
            {getStatusLabel(rider.status)}
          </span>
          <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <p>{rider.email ?? '—'}</p>
            <p>{rider.phone ?? '—'}</p>
            <p>Vehicle: {rider.vehicleType ?? '—'}</p>
          </div>
        </Card>

        {/* Details */}
        <Card className="lg:col-span-2 p-6">
          <h2 className="mb-4 text-lg font-semibold dark:text-white">Details</h2>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Email</dt>
              <dd className="text-gray-800 dark:text-gray-100">{rider.email ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Phone</dt>
              <dd className="text-gray-800 dark:text-gray-100">{rider.phone ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Vehicle</dt>
              <dd className="text-gray-800 dark:text-gray-100">{rider.vehicleType ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Zone</dt>
              <dd className="text-gray-800 dark:text-gray-100">{rider.zone?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Sector Coverage</dt>
              <dd className="text-gray-800 dark:text-gray-100">{rider.sector || 'All sectors'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Active Deliveries</dt>
              <dd className="text-gray-800 dark:text-gray-100">{rider.activeDeliveries ?? 0}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Total Deliveries</dt>
              <dd className="text-gray-800 dark:text-gray-100">{rider.totalDeliveries ?? 0}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Joined</dt>
              <dd className="text-gray-800 dark:text-gray-100">{formatDate(rider.createdAt)}</dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* Current Deliveries */}
      <Card className="mt-4 p-6">
        <h2 className="mb-4 text-lg font-semibold dark:text-white">Current Deliveries</h2>
        <DataTable<RiderDelivery>
          columns={deliveryColumns}
          rows={deliveries ?? []}
          rowKey={(row) => row._id}
          emptyTitle="No current deliveries"
        />
      </Card>
    </div>
  );
}
