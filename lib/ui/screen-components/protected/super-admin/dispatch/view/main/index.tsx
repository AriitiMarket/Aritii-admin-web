//Components
import Table from '@/lib/ui/useable-components/table';
import DispatchTableHeader from '../header/table-header';

//Inrfaces
import {
  IActiveOrders,
  IGetActiveOrders,
} from '@/lib/utils/interfaces/dispatch.interface';

//Hooks
import { useEffect, useRef, useState } from 'react';

// Constants
import { DISPATCH_TABLE_COLUMNS } from '@/lib/ui/useable-components/table/columns/dispatch-columns';

// API
import { adminAPI } from '@/lib/api/api';

export default function DispatchMain() {
  // States
  const [selectedData, setSelectedData] = useState<IActiveOrders[]>([]);
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const hasDataRef = useRef(false);
  const [lastValidOrders, setLastValidOrders] = useState<IActiveOrders[]>([]);
  const [activeOrdersData, setActiveOrdersData] = useState<IGetActiveOrders | null>(null);
  const [activeOrdersLoading, setActiveOrdersLoading] = useState(false);

  // Ref for debouncing and polling
  const refetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  // Fetch active orders using REST API
  const fetchActiveOrders = async () => {
    try {
      setActiveOrdersLoading(true);
      const response = await adminAPI.getActiveOrders(page, rowsPerPage, search, selectedActions, '');
      setActiveOrdersData(response.data);
    } catch (err) {
      console.error('Error fetching active orders:', err);
    } finally {
      setActiveOrdersLoading(false);
    }
  };

  const showLoading =
    !hasDataRef.current && activeOrdersLoading;

  useEffect(() => {
    const orders = activeOrdersData?.getActiveOrders?.orders;

    if (orders?.length) {
      hasDataRef.current = true;
      setLastValidOrders(orders);
    }
  }, [activeOrdersData]);

  //  POLLING FALLBACK - Polls every 5 seconds
  useEffect(() => {
    // Start polling
    pollingIntervalRef.current = setInterval(() => {
      if (!activeOrdersLoading) {
        fetchActiveOrders();
      }
    }, 5000); // Poll every 5 seconds

    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [page, rowsPerPage, search, selectedActions]);

  useEffect(() => {
    fetchActiveOrders();
  }, [rowsPerPage, page, selectedActions, search]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="p-3">
      <Table
        columns={DISPATCH_TABLE_COLUMNS()}
        data={
          showLoading
            ? []
            : activeOrdersData?.getActiveOrders.orders ??
            lastValidOrders
        }
        loading={showLoading}
        selectedData={selectedData}
        setSelectedData={(e) => setSelectedData(e as IActiveOrders[])}
        header={
          <DispatchTableHeader
            globalFilterValue={globalFilterValue}
            onGlobalFilterChange={(e) => setGlobalFilterValue(e.target.value)}
            selectedActions={selectedActions}
            setSelectedActions={setSelectedActions}
            search={search}
            setSearch={setSearch}
          />
        }
        rowsPerPage={rowsPerPage}
        totalRecords={activeOrdersData?.getActiveOrders.totalCount}
        onPageChange={(page, rowNumber) => {
          setPage(page);
          setRowsPerPage(rowNumber);
        }}
        currentPage={page}
      />
    </div>
  );
}
