'use client';

// Core imports
import { useContext, useMemo, useRef, useEffect, useState } from 'react';

// Context
import { RestaurantsContext } from '@/lib/context/super-admin/restaurants.context';

// Interfaces
import {
  IRestaurantsAddFormComponentProps,
  IRestaurantsContextPropData,
  IVendorReponse,
} from '@/lib/utils/interfaces';

// PrimeReact components
import { Sidebar } from 'primereact/sidebar';
import { Stepper } from 'primereact/stepper';
import { StepperPanel } from 'primereact/stepperpanel';

// Local components
import RestaurantDetailsForm from './restaurant-details';
import RestaurantLocation from './restaurant-location';
import VendorDetails from './vendor-details';
import RestaurantTiming from './restaurant-timing';
import { useTranslations } from 'next-intl';

// API
import { adminAPI } from '@/lib/api/api';

const RestaurantsForm = ({
  position = 'right',
}: IRestaurantsAddFormComponentProps) => {
  // Hooks
  const t = useTranslations();

  // Ref
  const stepperRef = useRef(null);

  // Context
  const {
    isRestaurantsFormVisible,
    onRestaurantsFormVisible,
    activeIndex,
    onActiveStepChange,
    onSetRestaurantsContextData,
  } = useContext(RestaurantsContext);

  // State
  const [vendorResponse, setVendorResponse] = useState<Record<string, unknown> | null>(null);
  const [_loading, setLoading] = useState(false);

  // Fetch vendors using REST API
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getAllVendors();
        setVendorResponse({ data: response.data });
      } catch (err) {
        console.error('Error fetching vendors:', err);
      } finally {
        setLoading(false);
      }
    };
    if (isRestaurantsFormVisible) {
      fetchVendors();
    }
  }, [isRestaurantsFormVisible]);

  // Memoized Data
  const vendorsDropdown = useMemo(
    () =>
      vendorResponse?.data?.vendors?.map((vendorItem: IVendorReponse) => {
        return { label: vendorItem.email, code: vendorItem._id };
      }),
    [vendorResponse?.data?.vendors]
  );

  // Handlers
  const onHandleStepChange = (order: number) => {
    onActiveStepChange(order);
  };
  const onSidebarHideHandler = () => {
    // Clean Context State
    onActiveStepChange(0);
    onRestaurantsFormVisible(false);
    onSetRestaurantsContextData({} as IRestaurantsContextPropData);
  };

  // Use Effect

  return (
    <Sidebar
      visible={isRestaurantsFormVisible}
      position={position}
      onHide={onSidebarHideHandler}
      className="w-full sm:w-[600px] dark:text-white dark:bg-dark-950 border dark:border-dark-600"
    >
      <div ref={stepperRef}>
        <Stepper linear headerPosition="bottom" activeStep={activeIndex}>
          <StepperPanel header={t('Set Vendor')}>
            <VendorDetails
              vendorsDropdown={vendorsDropdown ?? []}
              stepperProps={{
                onStepChange: onHandleStepChange,
                order: activeIndex,
              }}
            />
          </StepperPanel>
          <StepperPanel header={t('Add Details')}>
            <RestaurantDetailsForm
              stepperProps={{
                onStepChange: onHandleStepChange,
                order: activeIndex,
              }}
            />
          </StepperPanel>
          <StepperPanel header={t('Location')}>
            <RestaurantLocation
              stepperProps={{
                onStepChange: onHandleStepChange,
                order: activeIndex,
                isLastStep: true,
              }}
            />
          </StepperPanel>
          <StepperPanel header={t('Timing')}>
            <RestaurantTiming
              stepperProps={{
                onStepChange: onHandleStepChange,
                order: activeIndex,
                isLastStep: true,
              }}
            />
          </StepperPanel>
        </Stepper>
      </div>
    </Sidebar>
  );
};

export default RestaurantsForm;
