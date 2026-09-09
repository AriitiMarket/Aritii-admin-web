// Hooks
import { useState, useMemo, useEffect } from 'react';
import useDebounce from '@/lib/hooks/useDebounce';
// Interfaces & Types
import {
  IDateFilter,
} from '@/lib/utils/interfaces';
import { IOrder, IExtendedOrder } from '@/lib/utils/interfaces';
import { TOrderRowData } from '@/lib/utils/types';
import { useTranslations } from 'next-intl';

// API
import { adminAPI } from '@/lib/api/api';

// Components
import OrderSuperAdminTableHeader from '../header/table-header';
import OrderTableSkeleton from '@/lib/ui/useable-components/custom-skeletons/orders.vendor.row.skeleton';
import OrderDetailModal from '@/lib/ui/useable-components/popup-menu/order-details-modal';
import DashboardDateFilter from '@/lib/ui/useable-components/date-filter';
import OrderTable from '../order-table';
import ApiErrorAlert from '@/lib/ui/useable-components/api-error-alert';
// Prime React
import { FilterMatchMode } from 'primereact/api';
import { DataTableRowClickEvent } from 'primereact/datatable';

export default function OrderSuperAdminMain() {
  const t = useTranslations();
  // States
  const [selectedData, setSelectedData] = useState<IExtendedOrder[]>([]);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<IExtendedOrder | null>(null);
  const [dateFilter, setDateFilter] = useState<IDateFilter>({
    dateKeyword: 'All',
    startDate: `${new Date().getFullYear()}-01-01`, // Current year, January 1st
    endDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`, // Today's date
  });
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10); // For PrimeReact Table's 'rows' prop
  const [currentPage, setCurrentPage] = useState(1); // For API 'page' parameter
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const debouncedSearch = useDebounce(globalFilterValue, 600);

  const handleDateFilter = (dateFilter: IDateFilter) => {
    setDateFilter({
      ...dateFilter,
      dateKeyword: dateFilter.dateKeyword ?? '',
    });
  };

  // Fetch orders using REST API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getAllOrdersPaginated(
        currentPage,
        rows,
        dateFilter.dateKeyword,
        dateFilter.dateKeyword === 'Custom' ? dateFilter.startDate : undefined,
        dateFilter.dateKeyword === 'Custom' ? dateFilter.endDate : undefined,
        selectedActions.length > 0 ? selectedActions : undefined,
        debouncedSearch
      );
      setData(response.data);
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, rows, dateFilter, selectedActions, debouncedSearch]);

  useEffect(() => {
    if (!loading && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [loading, isInitialLoad]);

  const [filters, setFilters] = useState({
    global: {
      value: '' as string | null,
      matchMode: FilterMatchMode.CONTAINS,
    },
  });

  // For global search - updates filters for PrimeReact DataTable
  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const _filters = { ...filters };
    _filters['global'].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const handleRowClick = (event: DataTableRowClickEvent) => {
    const selectedOrder = event?.data as IExtendedOrder;
    setSelectedRestaurant(selectedOrder);
    setIsModalOpen(true);
  };

  const handleRefetch = () => {
    fetchOrders();
  };

  const tableData = useMemo(() => {
    if (!data?.allOrdersPaginated?.orders) return [];

    return data?.allOrdersPaginated?.orders?.map(
      (order: IOrder): IExtendedOrder => ({
        ...order,
        itemsTitle:
          order?.items
            ?.map((item) => item?.title)
            .join(', ')
            .slice(0, 15) + '...',
        OrderdeliveryAddress:
          order?.deliveryAddress?.deliveryAddress?.toString()?.slice(0, 15) +
          '...',
        DateCreated: order?.createdAt?.toString()?.slice(0, 10),
      })
    );
  }, [data]);

  const displayData: TOrderRowData[] = useMemo(() => {
    if (loading) {
      return OrderTableSkeleton({ rowCount: 10 }); // Display 10 skeleton rows while loading
    }
    return tableData;
  }, [loading, tableData]);

  return (
    <div className="p-3 screen-container">
      {
        <>
          <OrderSuperAdminTableHeader
            globalFilterValue={globalFilterValue}
            onGlobalFilterChange={onGlobalFilterChange}
            selectedActions={selectedActions}
            setSelectedActions={setSelectedActions}
            dateFilter={dateFilter}
            handleDateFilter={handleDateFilter}
          />
          <DashboardDateFilter
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
          />
        </>
      }
      {!error && (
        <OrderTable
          data={
            data?.allOrdersPaginated
              ? {
                  ...data.allOrdersPaginated,
                  orders: displayData as IExtendedOrder[],
                }
              : undefined
          }
          loading={loading}
          isInitialLoad={isInitialLoad}
          handleRowClick={handleRowClick}
          selectedData={selectedData}
          setSelectedData={setSelectedData}
          first={first}
          rows={rows}
          filters={filters}
          globalFilterValue={globalFilterValue}
          onPage={(e) => {
            setFirst(e.first);
            setRows(Math.min(e.rows, 100));
            setCurrentPage((e.page ?? 0) + 1);
          }}
        />
      )}
      <OrderDetailModal
        visible={isModalOpen}
        onHide={() => setIsModalOpen(false)}
        restaurantData={selectedRestaurant}
      />

      <ApiErrorAlert
        error={error?.message || ''}
        refetch={handleRefetch}
        queryName="GET_ALL_ORDERS_PAGINATED"
        title={t('Error')}
      />
    </div>
  );
}
