/* eslint-disable @typescript-eslint/no-explicit-any */
// Core

import { useEffect, useState } from 'react';

// Prime React
import { FilterMatchMode } from 'primereact/api';

// Components
import TransactionHistoryTableHeader from '../header/table-header';
import Table from '@/lib/ui/useable-components/table';
import { TRANSACTION_HISTORY_COLUMNS } from '@/lib/ui/useable-components/table/columns/transaction-history-columns';

// Interfaces
import {
  ITransactionHistory,
  ITransactionHistoryResponse,
  ITransactionHistoryFilters,
} from '@/lib/utils/interfaces';
import { IActionMenuItem } from '@/lib/utils/interfaces/action-menu.interface';

import TransactionDetailModal from '@/lib/ui/useable-components/popup-menu/transaction-history-modal.module';
import { useTranslations } from 'next-intl';
import useDebounce from '@/lib/hooks/useDebounce';

// API
import { adminAPI } from '@/lib/api/api';

export default function TransactionHistoryMain() {
  // Hooks
  const t = useTranslations();

  // State
  const [selectedTransactions, setSelectedTransactions] = useState<
    ITransactionHistory[]
  >([]);
  const [selectedTransaction, setSelectedTransaction] =
    useState<ITransactionHistory | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [filters, setFilters] = useState({
    global: {
      value: null as string | null,
      matchMode: FilterMatchMode.CONTAINS,
    },
  });

  // Hooks
  const debouncedSearch = useDebounce(globalFilterValue);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dateFilters, setDateFilters] = useState<ITransactionHistoryFilters>({
    startingDate: '',
    endingDate: '',
    userType: undefined,
    userId: '',
  });

  const [openMenuId, setOpenMenuId] = useState<string>('');
  const [data, setData] = useState<ITransactionHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch transaction history using REST API
  const fetchTransactionHistory = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getTransactionHistory(
        pageSize + 30,
        currentPage,
        dateFilters.startingDate || undefined,
        dateFilters.endingDate || undefined,
        dateFilters.userType !== 'ALL' ? dateFilters.userType : undefined,
        debouncedSearch
      );
      setData(response.data);
    } catch (err) {
      console.error('Error fetching transaction history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactionHistory();
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

  // Action menu items
  const menuItems: IActionMenuItem<ITransactionHistory>[] = [
    {
      label: t('View Details'),
      command: (data?: ITransactionHistory) => {
        if (data) {
          setSelectedTransaction(data);
          setIsModalOpen(true);
        }
      },
    },
  ];

  // Safely access data with proper typing
  const transactionData = data?.transactionHistory?.data;

  return (
    <div className="p-3">
      <Table
        header={
          <TransactionHistoryTableHeader
            globalFilterValue={globalFilterValue}
            onGlobalFilterChange={onGlobalFilterChange}
            dateFilters={dateFilters}
            setDateFilters={setDateFilters}
          />
        }
        data={
          transactionData || []
        }
        filters={filters}
        setSelectedData={setSelectedTransactions}
        selectedData={selectedTransactions}
        loading={loading}
        columns={TRANSACTION_HISTORY_COLUMNS({
          menuItems,
          openMenuId,
          setOpenMenuId,
        })}
        totalRecords={data?.transactionHistory?.pagination?.total}
        onPageChange={onPageChange}
        currentPage={currentPage}
        rowsPerPage={pageSize}
      />
      <TransactionDetailModal
        visible={isModalOpen}
        onHide={() => setIsModalOpen(false)}
        transaction={selectedTransaction}
      />
    </div>
  );
}
