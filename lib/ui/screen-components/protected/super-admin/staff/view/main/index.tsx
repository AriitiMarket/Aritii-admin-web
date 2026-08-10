// Core
import { useEffect, useState } from 'react';

// Interface and Types
import {
  IStaffMainComponentsProps,
  IStaffResponse,
} from '@/lib/utils/interfaces';

// Components
import Table from '@/lib/ui/useable-components/table';
import { STAFF_TABLE_COLUMNS } from '@/lib/ui/useable-components/table/columns/staff-columns';
import StaffTableHeader from '../header/table-header';
import useDebounce from '@/lib/hooks/useDebounce';

// Utilities and Data
import { IActionMenuItem } from '@/lib/utils/interfaces/action-menu.interface';

import CustomDialog from '@/lib/ui/useable-components/delete-dialog';
import useToast from '@/lib/hooks/useToast';
import { useTranslations } from 'next-intl';

// API
import { adminAPI } from '@/lib/api/api';

export default function StaffMain({
  setIsAddStaffVisible,
  setStaff,
}: IStaffMainComponentsProps) {
  // Hooks
  const t = useTranslations();
  const { showToast } = useToast();

  // States (Data Table)
  const [deleteId, setDeleteId] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<IStaffResponse[]>(
    []
  );
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mutationLoading, setMutationLoading] = useState(false);
  const debouncedSearch = useDebounce(globalFilterValue, 500);

  // Fetch staff using REST API
  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllStaffsPaginated(currentPage, rowsPerPage, debouncedSearch || undefined);
      setData(response.data);
    } catch (err) {
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [currentPage, rowsPerPage, debouncedSearch]);

  // For global search
  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalFilterValue(e.target.value);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const menuItems: IActionMenuItem<IStaffResponse>[] = [
    {
      label: t('Edit'),
      command: (data?: IStaffResponse) => {
        if (data) {
          setIsAddStaffVisible(true);
          setStaff(data);
        }
      },
    },
    {
      label: t('Delete'),
      command: (data?: IStaffResponse) => {
        if (data) {
          setDeleteId(data._id);
        }
      },
    },
  ];

  const handleDeleteStaff = async () => {
    try {
      setMutationLoading(true);
      await adminAPI.deleteStaff(deleteId);
      showToast({
        type: 'success',
        title: t('Success'),
        message: t('Staff Deleted'),
        duration: 3000,
      });
      setDeleteId('');
      fetchStaff();
    } catch (error) {
      const err = error as Error;
      showToast({
        type: 'error',
        title: t('Error'),
        message: err.message || t('Failed to delete staff'),
        duration: 3000,
      });
    } finally {
      setMutationLoading(false);
    }
  };

  return (
    <div className="p-3">
      <Table
        header={
          <StaffTableHeader
            globalFilterValue={globalFilterValue}
            onGlobalFilterChange={onGlobalFilterChange}
          />
        }
        data={data?.staffsPaginated?.data || []}
        setSelectedData={setSelectedProducts}
        selectedData={selectedProducts}
        loading={loading}
        columns={STAFF_TABLE_COLUMNS({ menuItems })}
        totalRecords={data?.staffsPaginated?.totalCount ?? 0}
        currentPage={data?.staffsPaginated?.currentPage ?? currentPage}
        rowsPerPage={rowsPerPage}
        onPageChange={(page, rowCount) => {
          setCurrentPage(page);
          setRowsPerPage(rowCount);
        }}
      />
      <CustomDialog
        loading={mutationLoading}
        visible={!!deleteId}
        onHide={() => {
          setDeleteId('');
        }}
        onConfirm={handleDeleteStaff}
        message={t('Are you sure you want to delete this item?')}
      />
    </div>
  );
}
