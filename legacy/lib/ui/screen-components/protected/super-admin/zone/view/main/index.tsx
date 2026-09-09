// Core
import { useEffect, useState } from 'react';

// Interface and Types
import {
  IZoneResponse,
  IZonesPaginatedResponse,
  IActionMenuItem,
  IZoneMainComponentsProps,
} from '@/lib/utils/interfaces';

// Context
import { useConfiguration } from '@/lib/hooks/useConfiguration';


// UI Components
import CustomDialog from '@/lib/ui/useable-components/delete-dialog';
import Table from '@/lib/ui/useable-components/table';
import RidersTableHeader from '../header/table-header';

// Constants and Interfaces
import { ZONE_TABLE_COLUMNS } from '@/lib/ui/useable-components/table/columns/zone-columns';

// Hooks
import useToast from '@/lib/hooks/useToast';
import useDebounce from '@/lib/hooks/useDebounce';

// API
import { adminAPI } from '@/lib/api/api';

// Data
import { useTranslations } from 'next-intl';

export default function ZoneMain({
  setIsAddZoneVisible,
  setZone,
}: IZoneMainComponentsProps) {
  // Hooks
  const t = useTranslations();
  const { showToast } = useToast();
  const { ISPAID_VERSION } = useConfiguration();
  // State - Table
  const [deleteId, setDeleteId] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<IZoneResponse[]>([]);
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [mutationLoading, setMutationLoading] = useState(false);
  const [data, setData] = useState<IZonesPaginatedResponse | null>(null);
  const debouncedSearch = useDebounce(globalFilterValue, 500);

  // Fetch zones using REST API
  const fetchZones = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllZones();
      setData({
        zonesPaginated: {
          data: response.data?.zones || [],
          totalCount: response.data?.zones?.length || 0,
          currentPage: currentPage,
        },
      });
    } catch (err) {
      console.error('Error fetching zones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, [currentPage, rowsPerPage, debouncedSearch]);

  // For global search
  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalFilterValue(e.target.value);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const menuItems: IActionMenuItem<IZoneResponse>[] = [
    {
      label: t('Edit'),
      command: (data?: IZoneResponse) => {
        if (data) {
          setIsAddZoneVisible(true);
          setZone(data); // Zone here
        }
      },
    },
    {
      label: t('Delete'),
      command: (data?: IZoneResponse) => {
        if (data) {
          setDeleteId(data._id);
        }
      },
    },
  ];

  const handleDeleteZone = async () => {
    if (ISPAID_VERSION) {
      try {
        setMutationLoading(true);
        await adminAPI.deleteZone(deleteId);
        showToast({
          type: 'success',
          title: t('Delete Zone'),
          message: t('Zone has been deleted successfully'),
          duration: 3000,
        });
        setDeleteId('');
        fetchZones();
      } catch (error) {
        const err = error as Error;
        showToast({
          type: 'error',
          title: t('Error'),
          message: err.message || t('Failed to delete zone'),
          duration: 3000,
        });
      } finally {
        setMutationLoading(false);
      }
    } else {
      showToast({
        type: 'error',
        title: t('you_are_using_free_version'),
        message: t('this_Feature_is_only_Available_in_Paid_Version'),
      });
      setDeleteId('');
    }
  };

  return (
    <div className="pt-5">
      <Table
        header={
          <RidersTableHeader
            globalFilterValue={globalFilterValue}
            onGlobalFilterChange={onGlobalFilterChange}
          />
        }
        data={data?.zonesPaginated?.data || []}
        setSelectedData={setSelectedProducts}
        selectedData={selectedProducts}
        loading={loading}
        columns={ZONE_TABLE_COLUMNS({ menuItems })}
        totalRecords={data?.zonesPaginated?.totalCount ?? 0}
        currentPage={data?.zonesPaginated?.currentPage ?? currentPage}
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
        onConfirm={() => {
          handleDeleteZone();
        }}
        message={t('Are you sure you want to delete this item?')}
      />
    </div>
  );
}
