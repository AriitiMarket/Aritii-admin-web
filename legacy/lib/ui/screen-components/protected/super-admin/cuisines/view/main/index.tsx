// Interfaces
import {
  IActionMenuItem,
  IEditState,
} from '@/lib/utils/interfaces';
import {
  ICuisine,
  ICuisineMainProps,
  IGetCuisinesPaginatedData,
} from '@/lib/utils/interfaces/cuisine.interface';

//  Contexts
import { ToastContext } from '@/lib/context/global/toast.context';

// Hooks
import useDebounce from '@/lib/hooks/useDebounce';
import { useContext, useEffect, useState } from 'react';

// Components
import CustomDialog from '@/lib/ui/useable-components/delete-dialog';
import Table from '@/lib/ui/useable-components/table';
import CuisineTableHeader from '../header/table-header';
import { CUISINE_TABLE_COLUMNS } from '@/lib/ui/useable-components/table/columns/cuisine-columns';
import { useTranslations } from 'next-intl';

// API
import { adminAPI } from '@/lib/api/api';

export default function CuisinesMain({
  setVisible,
  isEditing,
  setIsEditing,
}: ICuisineMainProps) {
  // Hooks
  const t = useTranslations();
  const { showToast } = useContext(ToastContext);

  // States
  const [selectedData, setSelectedData] = useState<ICuisine[]>([]);
  const [isDeleting, setIsDeleting] = useState<IEditState<ICuisine>>({
    bool: false,
    data: {
      _id: '',
      __typename: '',
      description: '',
      name: '',
      shopType: '',
      image: '',
    },
  });
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [data, setData] = useState<IGetCuisinesPaginatedData | null>(null);
  const [deleteCuisineLoading, setDeleteCuisineLoading] = useState(false);
  const debouncedSearch = useDebounce(globalFilterValue, 500);
  const shopType =
    selectedActions.length === 1 ? selectedActions[0] : undefined;

  // Menu Items
  const menuItems: IActionMenuItem<ICuisine>[] = [
    {
      label: t('Edit'),
      command: (data?: ICuisine) => {
        if (data) {
          setIsEditing({
            bool: true,
            data: data,
          });
          setIsDeleting({
            bool: false,
            data: {
              __typename: '',
              _id: '',
              description: '',
              name: '',
              shopType: '',
              image: '',
            },
          });
        }
      },
    },
    {
      label: t('Delete'),
      command: (data?: ICuisine) => {
        if (data) {
          setIsDeleting({
            bool: true,
            data: data,
          });
          setIsEditing({
            bool: false,
            data: {
              __typename: '',
              _id: '',
              description: '',
              name: '',
              shopType: '',
              image: '',
            },
          });
        }
      },
    },
  ];

  // Handlers
  async function deleteItem() {
    try {
      setDeleteCuisineLoading(true);
      await adminAPI.deleteCuisine(isDeleting?.data?._id || '');
      showToast({
        title: t('Delete Cuisine'),
        type: 'success',
        message: t('Cuisine has been deleted successfully'),
        duration: 2000,
      });
      setIsDeleting({ bool: false, data: { ...isDeleting.data } });
      fetchCuisines();
    } catch (err) {
      const error = err as Error;
      showToast({
        title: t('Delete Cuisine'),
        type: 'error',
        message: error.message || t('Cuisine Deletion Failed'),
        duration: 2000,
      });
    } finally {
      setDeleteCuisineLoading(false);
    }
  }

  const fetchCuisines = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getAllCuisines(currentPage, rowsPerPage, debouncedSearch || undefined, shopType);
      setData({
        cuisinesPaginated: {
          data: response.data?.cuisines || [],
          totalCount: response.data?.total || 0,
          currentPage: currentPage,
        },
      });
    } catch (err) {
      console.error('Error fetching cuisines:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // UseEffects
  useEffect(() => {
    setVisible(isEditing.bool);
  }, [data, isEditing.bool]);

  useEffect(() => {
    fetchCuisines();
  }, [currentPage, rowsPerPage, debouncedSearch, shopType]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, shopType]);

  return (
    <div className="p-3">
      <Table
        columns={CUISINE_TABLE_COLUMNS({ menuItems })}
        data={data?.cuisinesPaginated?.data || []}
        selectedData={selectedData}
        setSelectedData={(e) => setSelectedData(e as ICuisine[])}
        loading={isLoading}
        header={
          <CuisineTableHeader
            globalFilterValue={globalFilterValue}
            onGlobalFilterChange={(e) => setGlobalFilterValue(e.target.value)}
            selectedActions={selectedActions}
            setSelectedActions={setSelectedActions}
          />
        }
        totalRecords={data?.cuisinesPaginated?.totalCount ?? 0}
        currentPage={data?.cuisinesPaginated?.currentPage ?? currentPage}
        rowsPerPage={rowsPerPage}
        onPageChange={(page, rowCount) => {
          setCurrentPage(page);
          setRowsPerPage(rowCount);
        }}
      />
      <CustomDialog
        onConfirm={deleteItem}
        onHide={() => {
          setIsDeleting({ bool: false, data: { ...isDeleting.data } });
          setIsEditing({ bool: false, data: { ...isEditing.data } });
        }}
        visible={isDeleting.bool}
        loading={deleteCuisineLoading}
        message={t('Are you sure to delete the cuisine?')}
      />
    </div>
  );
}
