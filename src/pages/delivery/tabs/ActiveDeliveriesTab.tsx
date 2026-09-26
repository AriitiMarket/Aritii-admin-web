// Active Deliveries Tab Component with Live Status Badges

import { useState } from 'react';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { Button } from '@/components/common/Button';
import { formatDate } from '@/utils/format';
import { deliveryAdmin } from '@/api/admin';
import { getDeliveryStatusColor, getValidTransitions } from '../utils/statusHelpers';
import { useAssignments } from '../hooks/useAssignments';
import type { Delivery } from '../types';

export function ActiveDeliveriesTab() {
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);

  const { data, loading, refetch } = useAssignments({
    page,
    status: 'in_transit',
    search: '',
  });

  const handleStatusChange = async (deliveryId: string, newStatus: string) => {
    setActionLoading(true);
    try {
      await deliveryAdmin.updateDeliveryStatus(deliveryId, newStatus);
      refetch();
    } catch (err) {
      console.error('Status change failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<Delivery>[] = [
    {
      key: 'orderId',
      header: 'Order',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-800 dark:text-gray-100">
            {row.orderId || '—'}
          </span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
        </div>
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
      header: 'Rider',
      render: (row) => (
        <span className="text-sm text-gray-800 dark:text-gray-100">
          {row.partnerName || row.partnerId || <span className="text-gray-400">Unassigned</span>}
        </span>
      ),
    },
    {
      key: 'pickupAddress',
      header: 'Pickup',
      render: (row) => {
        const addr = row.pickupAddress;
        const location = [addr?.sectorName, addr?.cityName, addr?.regionName].filter(Boolean).join(', ');
        return (
          <div className="text-sm">
            <p className="font-medium text-gray-800 dark:text-gray-100">{addr?.shopName || '—'}</p>
            <p className="text-gray-500 dark:text-gray-400">{location || '—'}</p>
          </div>
        );
      },
    },
    {
      key: 'destinationAddress',
      header: 'Destination',
      render: (row) => {
        const addr = row.destinationAddress || row.deliveryAddress;
        const location = [addr?.sectorName, addr?.areaName, addr?.cityName, addr?.regionName].filter(Boolean).join(', ');
        return (
          <div className="text-sm">
            <p className="font-medium text-gray-800 dark:text-gray-100">{addr?.contactName || '—'}</p>
            <p className="text-gray-500 dark:text-gray-400">{location || '—'}</p>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => {
        const transitions = getValidTransitions(row.status);
        return (
          <div className="flex gap-1 flex-wrap">
            {transitions.map((t: string) => (
              <Button
                key={t}
                size="sm"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); handleStatusChange(row.id, t); }}
                disabled={actionLoading}
              >
                {t.replace(/_/g, ' ')}
              </Button>
            ))}
          </div>
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

  return (
    <>
      <div className="mb-4">
        <h3 className="text-lg font-semibold dark:text-white mb-2">Live Status Monitoring</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Real-time tracking of deliveries currently in transit</p>
      </div>

      <DataTable<Delivery>
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(row) => row.id}
        loading={loading}
        emptyTitle="No active deliveries"
      />
      <Pagination
        className="mt-4"
        page={page}
        totalPages={data?.totalPages ?? 0}
        total={data?.total}
        onPageChange={setPage}
      />
    </>
  );
}