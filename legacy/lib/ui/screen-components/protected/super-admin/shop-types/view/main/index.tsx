// CSS
import './index.module.css';

// Interfaces
import {
  IActionMenuItem,
  IEditState,
  IGetShopTypesData,
  IShopType,
  IShopTypesMainProps,
} from '@/lib/utils/interfaces';
import { IFilterType } from '@/lib/utils/interfaces/table.interface';

// Prime react
import { FilterMatchMode } from 'primereact/api';

// Hooks
import { useContext, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

// Components
import { ToastContext } from '@/lib/context/global/toast.context';
import CustomDialog from '@/lib/ui/useable-components/delete-dialog';
import ShopTypesTableHeader from '../header/table-header';
import Table from '@/lib/ui/useable-components/table';

// Constants

// Table COlumns
import { SHOP_TYPES_TABLE_COLUMNS } from '@/lib/ui/useable-components/table/columns/shop-types-columns';

// API
import { adminAPI } from '@/lib/api/api';

export default function ShopTypesMain({
  setVisible,
  isEditing,
  setIsEditing,
}: IShopTypesMainProps) {
  // Hooks
  const t = useTranslations();

  // Toast
  const { showToast } = useContext(ToastContext);

  // States
  const [selectedData, setSelectedData] = useState<IShopType[]>([]);
  const [isDeleting, setIsDeleting] = useState<IEditState<IShopType>>({
    bool: false,
    data: {
      __typename: '',
      _id: '',
      name: '',
      image: '',
      isActive: false,
    },
  });
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [data, setData] = useState<IGetShopTypesData | null>(null);
  const [deleteShopTypeLoading, setDeleteShopTypeLoading] = useState(false);

  // Filters
  const filters: IFilterType = {
    global: { value: globalFilterValue, matchMode: FilterMatchMode.CONTAINS },
  };

  // Fetch shop types using REST API
  const fetchShopTypes = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getAllShopTypes();
      setData({
        fetchShopTypes: {
          data: response.data?.shopTypes || [],
        },
      });
    } catch (err) {
      console.error('Error fetching shop types:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Item
  async function deleteItem() {
    try {
      setDeleteShopTypeLoading(true);
      await adminAPI.deleteShopType(isDeleting?.data?._id || '');
      showToast({
        title: t('Delete ShopType'),
        type: 'success',
        message: t('ShopType has been deleted successfully'),
        duration: 2000,
      });
      setIsDeleting({
        bool: false,
        data: {
          __typename: '',
          _id: '',
          isActive: false,
          image: '',
          name: '',
        },
      });
      fetchShopTypes();
    } catch (error) {
      const err = error as Error;
      showToast({
        title: t('Delete ShopType'),
        type: 'error',
        message: err.message || t('An unknown error occured, please try again'),
        duration: 2000,
      });
    } finally {
      setDeleteShopTypeLoading(false);
    }
  }

  // Menu Items
  const menuItems: IActionMenuItem<IShopType>[] = [
    {
      label: t('Edit'),
      command: (data?: IShopType) => {
        if (data) {
          setIsEditing({
            bool: true,
            data: data,
          });
          setIsDeleting({
            bool: false,
            data: { ...isDeleting.data },
          });
        }
      },
    },
    {
      label: t('Delete'),
      command: (data?: IShopType) => {
        if (data) {
          setIsDeleting({
            bool: true,
            data: data,
          });
          setIsEditing({
            bool: false,
            data: { ...isEditing.data },
          });
        }
      },
    },
  ];

  // UseEffects
  useEffect(() => {
    if (isEditing.bool) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [data, isEditing.bool]);

  useEffect(() => {
    fetchShopTypes();
  }, []);

  return (
    <div className="p-3">
      <Table
        columns={SHOP_TYPES_TABLE_COLUMNS({ menuItems })}
        data={
          data?.fetchShopTypes?.data || []
        }
        selectedData={selectedData}
        setSelectedData={(e) => setSelectedData(e)}
        loading={isLoading}
        header={
          <ShopTypesTableHeader
            globalFilterValue={globalFilterValue}
            onGlobalFilterChange={(e) => setGlobalFilterValue(e.target.value)}
          />
        }
        filters={filters}
      />
      <CustomDialog
        onConfirm={deleteItem}
        onHide={() =>
          setIsDeleting({
            bool: false,
            data: {
              __typename: '',
              _id: '',
              isActive: false,
              image: '',
              name: '',
            },
          })
        }
        visible={isDeleting.bool}
        loading={deleteShopTypeLoading}
        message={t('are_you_sure_you_want_to_delete_this_shoptype')}
      />
    </div>
  );
}
