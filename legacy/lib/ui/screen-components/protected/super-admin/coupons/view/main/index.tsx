// CSS
import './index.module.css';

// Interfaces
import {
  IActionMenuItem,
  IEditState,
} from '@/lib/utils/interfaces';
import {
  ICoupon,
  ICouponMainProps,
  IGetCouponsPaginatedData,
} from '@/lib/utils/interfaces/coupons.interface';

// Hooks
import { useContext, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import useDebounce from '@/lib/hooks/useDebounce';

// Components
import { ToastContext } from '@/lib/context/global/toast.context';
import CustomDialog from '@/lib/ui/useable-components/delete-dialog';
import Table from '@/lib/ui/useable-components/table';
import CouponTableHeader from '../header/table-header';

// Constants
import { COUPONS_TABLE_COLUMNS } from '@/lib/ui/useable-components/table/columns/coupons-columns';

// API
import { adminAPI } from '@/lib/api/api';

export default function CouponsMain({
  setVisible,
  isEditing,
  setIsEditing,
}: ICouponMainProps) {
  // Hooks
  const t = useTranslations();

  // Toast
  const { showToast } = useContext(ToastContext);

  // States
  const [selectedData, setSelectedData] = useState<ICoupon[]>([]);
  const [isDeleting, setIsDeleting] = useState<IEditState<ICoupon>>({
    bool: false,
    data: {
      __typename: '',
      _id: '',
      discount: 0,
      enabled: false,
      title: '',
      lifeTimeActive: false,
      startDate: '',
      endDate: '',
    },
  });
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [data, setData] = useState<IGetCouponsPaginatedData | null>(null);
  const [deleteCouponLoading, setDeleteCouponLoading] = useState(false);
  const debouncedSearch = useDebounce(globalFilterValue, 500);
  const enabled =
    selectedActions.length === 1 && selectedActions[0] !== ''
      ? selectedActions[0] === 'true'
      : undefined;

  // Fetch coupons using REST API
  const fetchCoupons = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getAllCoupons(currentPage, rowsPerPage);
      setData({
        couponsPaginated: {
          data: response.data?.coupons || [],
          totalCount: response.data?.total || 0,
          currentPage: currentPage,
        },
      });
    } catch (err) {
      console.error('Error fetching coupons:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Item
  async function deleteItem() {
    try {
      setDeleteCouponLoading(true);
      await adminAPI.deleteCoupon(isDeleting?.data?._id || '');
      showToast({
        title: t('Delete Coupon'),
        type: 'success',
        message: t('Coupon has been deleted successfully'),
        duration: 2000,
      });
      setIsDeleting({
        bool: false,
        data: {
          __typename: '',
          _id: '',
          discount: 0,
          enabled: false,
          title: '',
          lifeTimeActive: false,
          startDate: '',
          endDate: '',
        },
      });
      fetchCoupons();
    } catch (error) {
      const err = error as Error;
      showToast({
        title: t('Delete Coupon'),
        type: 'error',
        message: err.message || t('An unknown error occured, please try again'),
        duration: 2000,
      });
    } finally {
      setDeleteCouponLoading(false);
    }
  }

  // Menu Items
  const menuItems: IActionMenuItem<ICoupon>[] = [
    {
      label: t('Edit'),
      command: (data?: ICoupon) => {
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
      command: (data?: ICoupon) => {
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
    fetchCoupons();
  }, [currentPage, rowsPerPage, debouncedSearch, enabled]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, enabled]);

  return (
    <div className="p-3">
      <Table
        columns={COUPONS_TABLE_COLUMNS({ menuItems })}
        data={data?.couponsPaginated?.data || []}
        selectedData={selectedData}
        setSelectedData={(e) => setSelectedData(e)}
        loading={isLoading}
        header={
          <CouponTableHeader
            globalFilterValue={globalFilterValue}
            onGlobalFilterChange={(e) => setGlobalFilterValue(e.target.value)}
            selectedActions={selectedActions}
            setSelectedActions={setSelectedActions}
          />
        }
        totalRecords={data?.couponsPaginated?.totalCount ?? 0}
        currentPage={data?.couponsPaginated?.currentPage ?? currentPage}
        rowsPerPage={rowsPerPage}
        onPageChange={(page, rowCount) => {
          setCurrentPage(page);
          setRowsPerPage(rowCount);
        }}
      />
      <CustomDialog
        onConfirm={deleteItem}
        onHide={() =>
          setIsDeleting({
            bool: false,
            data: {
              __typename: '',
              _id: '',
              discount: 0,
              enabled: false,
              title: '',
              lifeTimeActive: false,
              endDate: '',
              startDate: '',
            },
          })
        }
        visible={isDeleting.bool}
        loading={deleteCouponLoading}
        message={t('Are you sure to delete the coupon?')}
      />
    </div>
  );
}
