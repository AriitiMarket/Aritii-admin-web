// Core
import { useEffect, useState } from 'react';

// PrimeReact
import { FilterMatchMode } from 'primereact/api';

// Hooks
import useToast from '@/lib/hooks/useToast';

// Custom Components
import CustomDialog from '@/lib/ui/useable-components/delete-dialog';
import Table from '@/lib/ui/useable-components/table';
import { BANNERS_TABLE_COLUMNS } from '@/lib/ui/useable-components/table/columns/banners-columns';
import { IActionMenuItem } from '@/lib/utils/interfaces/action-menu.interface';
import BannerTableHeader from '../header/table-header';

// Interfaces and Types
import {
  IBannersDataResponse,
  IBannersMainComponentsProps,
  IBannersResponse,
} from '@/lib/utils/interfaces';

// API
import { adminAPI } from '@/lib/api/api';

import { useTranslations } from 'next-intl';

export default function BannersMain({
  setIsAddBannerVisible,
  setBanner,
}: IBannersMainComponentsProps) {
  // Hooks
  const { showToast } = useToast();
  const t = useTranslations();

  // State - Table
  const [deleteId, setDeleteId] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<IBannersResponse[]>(
    []
  );
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [currentPage] = useState(1);
  const [pageSize] = useState(10);
  const [data, setData] = useState<IBannersDataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [mutationLoading, setMutationLoading] = useState(false);

  const filters = {
    global: { value: globalFilterValue, matchMode: FilterMatchMode.CONTAINS },
    action: {
      value: selectedActions.length > 0 ? selectedActions : null,
      matchMode: FilterMatchMode.IN,
    },
  };

  // Fetch banners using REST API
  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllBanners(currentPage, pageSize);
      setData({
        banners: response.data?.banners || [],
      });
    } catch (err) {
      console.error('Error fetching banners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [currentPage]);

  const handleDelete = async () => {
    try {
      setMutationLoading(true);
      await adminAPI.deleteBanner(deleteId);
      showToast({
        type: 'success',
        title: t('Success'),
        message: t(`Banner Deleted`),
        duration: 3000,
      });
      setDeleteId('');
      fetchBanners();
    } catch (error) {
      const err = error as Error;
      showToast({
        type: 'error',
        title: t('Error'),
        message: err.message || t('Failed to delete banner'),
        duration: 3000,
      });
    } finally {
      setMutationLoading(false);
    }
  };

  const menuItems: IActionMenuItem<IBannersResponse>[] = [
    {
      label: t('Edit'),
      command: (data?: IBannersResponse) => {
        if (data) {
          setIsAddBannerVisible(true);
          setBanner(data);
        }
      },
    },
    {
      label: t('Delete'),
      command: (data?: IBannersResponse) => {
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
          <BannerTableHeader
            globalFilterValue={globalFilterValue}
            onGlobalFilterChange={(e) => setGlobalFilterValue(e.target.value)}
            selectedActions={selectedActions}
            setSelectedActions={setSelectedActions}
          />
        }
        data={data?.banners || []}
        filters={filters}
        setSelectedData={setSelectedProducts}
        selectedData={selectedProducts}
        columns={BANNERS_TABLE_COLUMNS({ menuItems })}
        loading={loading}
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
