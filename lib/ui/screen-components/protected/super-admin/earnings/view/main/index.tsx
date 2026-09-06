import { useEffect, useState } from 'react';
import { FilterMatchMode } from 'primereact/api';
import Table from '@/lib/ui/useable-components/table';
import {
  IEarning,
  IEarningFilters,
  IEarningsMainComponentProps,
} from '@/lib/utils/interfaces';
import EarningTableHeader from '../header/table-header';
import { EARNING_COLUMNS } from '@/lib/ui/useable-components/table/columns/earning-column';
import useDebounce from '@/lib/hooks/useDebounce';

// API
import { adminAPI } from '@/lib/api/api';

export default function EarningsMain({
  setTotalEarnings,
}: IEarningsMainComponentProps) {
  const [selectedEarnings, setSelectedEarnings] = useState<IEarning[]>([]);
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    global: {
      value: null as string | null,
      matchMode: FilterMatchMode.CONTAINS,
    },
    
  });

  // Hooks
  const debouncedSearch = useDebounce(globalFilterValue);

  const [dateFilters, setDateFilters] = useState<IEarningFilters>({
    startingDate: '',
    endingDate: '',
    userType: undefined,
    userId: undefined,
    orderType: undefined,
    paymentMethod: undefined,
  });

  // Fetch earnings
  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getEarnings(
        pageSize,
        currentPage,
        dateFilters.startingDate || undefined,
        dateFilters.endingDate || undefined,
        debouncedSearch,
        dateFilters.userType !== 'ALL' ? dateFilters.userType : undefined,
        dateFilters?.userId ?? undefined,
        dateFilters.orderType !== 'ALL' ? dateFilters.orderType : undefined,
        dateFilters.paymentMethod !== 'ALL' ? dateFilters.paymentMethod : undefined
      );
      setData(response.data);
      const grandTotalEarnings = response.data?.earnings?.data?.grandTotalEarnings;
      setTotalEarnings(grandTotalEarnings);
    } catch (err) {
      console.error('Error fetching earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, [pageSize, currentPage, dateFilters, debouncedSearch]);

  // Global search handler
  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const _filters = { ...filters };
    _filters['global'].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  // Handle page change
  const onPageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const menuItems = [
    {
      label: 'View Details',
      command: () => {
        // Handle view details action
        // console.log('View details for:', data);
      },
    },
  ];

  const clearAllFilters = () => {
    setDateFilters({
      startingDate: '',
      endingDate: '',
      userType: undefined,
      userId: undefined,
      orderType: undefined,
      paymentMethod: undefined,
    });
    setGlobalFilterValue('');
    setFilters({
      global: {
        value: null,
        matchMode: FilterMatchMode.CONTAINS,
      },
    });
  };

  return (
    <div className="p-4">
      <Table
        header={
          <EarningTableHeader
            globalFilterValue={globalFilterValue}
            onGlobalFilterChange={onGlobalFilterChange}
            dateFilters={dateFilters}
            setDateFilters={setDateFilters}
            onClearFilters={clearAllFilters}
          />
        }
        data={
          data?.earnings?.data?.earnings || []
        }
        filters={filters}
        setSelectedData={setSelectedEarnings}
        selectedData={selectedEarnings}
        loading={loading}
        columns={EARNING_COLUMNS({
          menuItems,
          isSuperAdmin: true,
        })}
        totalRecords={data?.earnings?.pagination?.total}
        onPageChange={onPageChange}
        currentPage={currentPage}
        rowsPerPage={pageSize}
      />
    </div>
  );
}
