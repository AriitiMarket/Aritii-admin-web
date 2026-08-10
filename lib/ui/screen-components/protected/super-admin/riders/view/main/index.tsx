'use client';

// Core
import { useEffect, useState } from 'react';

// Interface and Types
import {
  IRiderResponse,
  IRidersPaginatedDataResponse,
  IRidersMainComponentsProps,
} from '@/lib/utils/interfaces/rider.interface';

// UI Components
import RidersTableHeader from '../header/table-header';
import CustomDialog from '@/lib/ui/useable-components/delete-dialog';
import Table from '@/lib/ui/useable-components/table';
import { RIDER_TABLE_COLUMNS } from '@/lib/ui/useable-components/table/columns/rider-columns';

// Utilities and Data
import { IActionMenuItem } from '@/lib/utils/interfaces/action-menu.interface';

// Hooks
import useToast from '@/lib/hooks/useToast';
import useDebounce from '@/lib/hooks/useDebounce';

// API
import { adminAPI } from '@/lib/api/api';

// Data
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function RidersMain({
  setIsAddRiderVisible,
  setRider,
}: IRidersMainComponentsProps) {
  // Hooks
  const t = useTranslations();
  const { showToast } = useToast();
  const router = useRouter();

  // State - Table
  const [deleteId, setDeleteId] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<IRiderResponse[]>(
    []
  );
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [mutationLoading, setMutationLoading] = useState(false);
  const [data, setData] = useState<IRidersPaginatedDataResponse | null>(null);
  const debouncedSearch = useDebounce(globalFilterValue, 500);

  // Fetch riders using REST API
  const fetchRiders = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllRiders(currentPage, rowsPerPage, debouncedSearch || undefined);
      setData({
        ridersPaginated: {
          data: response.data?.riders || [],
          totalCount: response.data?.total || 0,
          currentPage: currentPage,
        },
      });
    } catch (err) {
      console.error('Error fetching riders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, [currentPage, rowsPerPage, debouncedSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const handleDelete = async () => {
    try {
      setMutationLoading(true);
      await adminAPI.deleteRider(deleteId);
      showToast({
        type: 'success',
        title: t('Success'),
        message: t('Rider Deleted'),
        duration: 3000,
      });
      setDeleteId('');
      fetchRiders();
    } catch (error) {
      const err = error as Error;
      showToast({
        type: 'error',
        title: t('Error'),
        message: err.message || t('Failed to delete rider'),
        duration: 3000,
      });
    } finally {
      setMutationLoading(false);
    }
  };

  // For global search
  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalFilterValue(e.target.value);
  };

  const menuItems: IActionMenuItem<IRiderResponse>[] = [
    {
      label: t('View'),
      command: (data?: IRiderResponse) => {
        if (data) {
          router.push(`/general/riders/${data._id}`);
        }
      },
    },
    {
      label: t('Edit'),
      command: (data?: IRiderResponse) => {
        if (data) {
          setIsAddRiderVisible(true);
          setRider(data);
        }
      },
    },
    {
      label: t('Delete'),
      command: (data?: IRiderResponse) => {
        if (data) {
          setDeleteId(data._id);
        }
      },
    },
  ];

  return (
    <div className="p-3">
      <Table
        header={
          <RidersTableHeader
            globalFilterValue={globalFilterValue}
            onGlobalFilterChange={onGlobalFilterChange}
          />
        }
        data={data?.ridersPaginated?.data || []}
        setSelectedData={setSelectedProducts}
        selectedData={selectedProducts}
        loading={loading}
        columns={RIDER_TABLE_COLUMNS({ menuItems })}
        totalRecords={data?.ridersPaginated?.totalCount ?? 0}
        currentPage={data?.ridersPaginated?.currentPage ?? currentPage}
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
        onConfirm={handleDelete}
        message={t('Are you sure you want to delete this item?')}
      />
    </div>
  );
}
