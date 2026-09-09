//Hooks
import { ChangeEvent, useEffect, useState } from 'react';

//Components
import NotificationTableHeader from '../header/table-header';
import Table from '@/lib/ui/useable-components/table';

// Constants
import { NOTIFICATIONS_TABLE_COLUMNS } from '@/lib/ui/useable-components/table/columns/notification-columns';

// Interfaces
import {
  IGetNotificationsPaginated,
} from '@/lib/utils/interfaces/notification.interface';
import useDebounce from '@/lib/hooks/useDebounce';

// API
import { adminAPI } from '@/lib/api/api';

export default function NotificationMain() {
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [data, setData] = useState<IGetNotificationsPaginated | null>(null);
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounce(globalFilterValue, 500);

  // Global filters change
  const onGlobalFilterChange = (e: ChangeEvent<HTMLInputElement>) => {
    setGlobalFilterValue(e.target.value);
  };

  // Fetch notifications using REST API
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllNotifications(currentPage, rowsPerPage, debouncedSearch || undefined);
      setData({
        notificationsPaginated: {
          data: response.data?.notifications || [],
          totalCount: response.data?.total || 0,
          currentPage: currentPage,
        },
      });
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [currentPage, rowsPerPage, debouncedSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  return (
    <div className="p-3">
      <Table
        columns={NOTIFICATIONS_TABLE_COLUMNS()}
        data={data?.notificationsPaginated?.data ?? []}
        selectedData={[]}
        setSelectedData={() => {}}
        header={
          <NotificationTableHeader
            globalFilterValue={globalFilterValue}
            onGlobalFilterChange={onGlobalFilterChange}
            selectedActions={selectedActions}
            setSelectedActions={setSelectedActions}
          />
        }
        loading={loading}
        totalRecords={data?.notificationsPaginated?.totalCount ?? 0}
        currentPage={data?.notificationsPaginated?.currentPage ?? currentPage}
        rowsPerPage={rowsPerPage}
        onPageChange={(page, rowCount) => {
          setCurrentPage(page);
          setRowsPerPage(rowCount);
        }}
      />
    </div>
  );
}
