import { useContext, useEffect, useMemo, useState } from 'react';

// Prime React
import { Dialog } from 'primereact/dialog';

// Components
import CustomButton from '@/lib/ui/useable-components/button';
import CustomDropdownComponent from '@/lib/ui/useable-components/custom-dropdown';

// Context
import { ToastContext } from '@/lib/context/global/toast.context';

// API
import { adminAPI } from '@/lib/api/api';

// Interface and Types
import {
  IDropdownSelectItem,
  IRestaurantDuplicateDialogComponentProps,
  IVendorReponse,
} from '@/lib/utils/interfaces';
import { useTranslations } from 'next-intl';

const RestaurantDuplicateDialog = ({
  restaurantId,
  visible,
  onHide,
}: IRestaurantDuplicateDialogComponentProps) => {
  // Hooks
  const t = useTranslations();

  // Context
  const { showToast } = useContext(ToastContext);

  // States
  const [vendor, setSelectedVendor] = useState<IDropdownSelectItem>({
    label: '',
    code: '',
  });
  const [vendorData, setVendorData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // API
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await adminAPI.getVendors();
        setVendorData(response.data);
      } catch (error) {
        console.error('Error fetching vendors:', error);
      }
    };
    fetchVendors();
  }, []);

  // Memoized Data
  const vendorsDropdown = useMemo(
    () =>
      vendorData?.vendors?.map((vendorItem: IVendorReponse) => {
        return { label: vendorItem.email, code: vendorItem._id };
      }),
    [vendorData?.vendors]
  );

  // Handlers
  const handleDuplicate = async () => {
    try {
      if (!vendor.code) {
        showToast({
          type: 'warn',
          title: t('Store duplicate'),
          message: t(`Please select a vendor`),
        });
        return;
      }

      setLoading(true);
      await adminAPI.duplicateRestaurant(restaurantId, vendor.code ?? '');
      
      showToast({
        type: 'success',
        title: t('Store duplicate'),
        message: t(`Store has been duplicated successfully`),
        duration: 2000,
      });
      setSelectedVendor({ label: '', code: '' });
      onHide();
    } catch (error) {
      const err = error as Error;
      showToast({
        type: 'error',
        title: t('Store duplicate'),
        message: err.message || t(`Store duplicate  failed`),
        duration: 2500,
      });
      setSelectedVendor({ label: '', code: '' });
      onHide();
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div className="space-x-2">
      <CustomButton
        label={t('Cancel')}
        icon="pi pi-times"
        onClick={onHide}
        className="h-9 rounded border border-gray-300 bg-transparent px-5 text-black dark:text-white"
      />
      <CustomButton
        loading={loading}
        label={t('Duplicate')}
        className="h-9 rounded border-gray-300 bg-red-500 px-4 text-white"
        icon="pi pi-check"
        onClick={handleDuplicate}
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      style={{ width: '32rem' }}
      breakpoints={{ '960px': '75vw', '641px': '90vw' }}
      header={t('Duplicate Store')}
      modal
      footer={footer}
      onHide={onHide}
    >
      <CustomDropdownComponent
        name="vendor"
        placeholder={t('Select Vendor')}
        showLabel={true}
        selectedItem={vendor}
        setSelectedItem={(key: string, item: IDropdownSelectItem) =>
          setSelectedVendor(item)
        }
        options={vendorsDropdown ?? []}
      />
    </Dialog>
  );
};

export default RestaurantDuplicateDialog;
