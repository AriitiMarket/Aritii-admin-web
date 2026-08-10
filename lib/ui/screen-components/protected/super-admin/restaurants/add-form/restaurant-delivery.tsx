// Core
import { Form, Formik } from 'formik';
import { useContext, useState } from 'react';

// Interface and Types
import {
  IRestaurantDeliveryForm,
  IRestaurantsRestaurantDeliveryComponentProps,
} from '@/lib/utils/interfaces';

// Core
import { RestaurantsContext } from '@/lib/context/super-admin/restaurants.context';

// Component
import CustomButton from '@/lib/ui/useable-components/button';
import CustomNumberField from '@/lib/ui/useable-components/number-input-field';

// Constants
import { RestaurantDeliveryErrors } from '@/lib/utils/constants';

// Context
import { ToastContext } from '@/lib/context/global/toast.context';

// Schema
import { DeliverySchema } from '@/lib/utils/schema/delivery';

// Methods
import { onErrorMessageMatcher } from '@/lib/utils/methods/error';

import CustomGoogleMapsLocationBounds from '@/lib/ui/useable-components/google-maps/location-bounds-restaurants';
import { GoogleMapsContext } from '@/lib/context/global/google-maps.context';
import { useTranslations } from 'next-intl';

// API
import { adminAPI } from '@/lib/api/api';

const initialValues: IRestaurantDeliveryForm = {
  minDeliveryFee: null,
  deliveryDistance: null,
  deliveryFee: null,
};

export default function RestaurantDelivery({
  stepperProps,
}: IRestaurantsRestaurantDeliveryComponentProps) {
  const { onStepChange, order } = stepperProps ?? {
    onStepChange: () => {},
    type: '',
    order: -1,
  };

  // Hooks
  const t = useTranslations();

  // Context
  const { isLoaded } = useContext(GoogleMapsContext);
  const { showToast } = useContext(ToastContext);
  const { restaurantsContextData } = useContext(RestaurantsContext);
  const restaurantId = restaurantsContextData?.restaurant?._id?.code || '';

  // State
  const [mutationLoading, setMutationLoading] = useState(false);

  // Handlers
  const onCreateDelivery = async (data: IRestaurantDeliveryForm) => {
    try {
      setMutationLoading(true);
      await adminAPI.updateRestaurantDelivery(
        restaurantId,
        data.minDeliveryFee || 0,
        data.deliveryDistance || 0,
        data.deliveryFee || 0
      );

      showToast({
        type: 'success',
        title: t('Store Delivery Info'),
        message: t(`Store delivery info has been added successfully`),
        duration: 3000,
      });

      onStepChange(order + 1);
    } catch (error) {
      const err = error as Error;
      showToast({
        type: 'error',
        title: t(`Failed to add Store delivery info`),
        message: err.message || t(`Store Creation Failed`),
        duration: 2500,
      });
    } finally {
      setMutationLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-start">
      <div className="h-full w-full">
        <div className="flex flex-col gap-2">
          <div className="mb-2 flex flex-col">
            <span className="text-lg">{t('Store Delivery')}</span>
          </div>

          <div>
            <Formik
              initialValues={initialValues}
              validationSchema={DeliverySchema}
              onSubmit={async (values) => {
                await onCreateDelivery(values);
              }}
              validateOnChange={false}
            >
              {({
                values,
                errors,
                handleSubmit,
                isSubmitting,
                setFieldValue,
              }) => {
                return (
                  <Form onSubmit={handleSubmit}>
                    <div className="mb-2 space-y-3">
                      <div>
                        <CustomNumberField
                          min={1}
                          max={99999}
                          useGrouping={false}
                          minFractionDigits={0}
                          maxFractionDigits={2}
                          placeholder={t('Min Delivery Fee')}
                          name="minDeliveryFee"
                          showLabel={true}
                          value={values.minDeliveryFee}
                          onChange={setFieldValue}
                          style={{
                            borderColor: onErrorMessageMatcher(
                              'minDeliveryFee',
                              errors?.minDeliveryFee,
                              RestaurantDeliveryErrors
                            )
                              ? 'red'
                              : '',
                          }}
                        />
                      </div>

                      <div>
                        <CustomNumberField
                          min={1}
                          max={99999}
                          minFractionDigits={0}
                          maxFractionDigits={2}
                          useGrouping={false}
                          placeholder={t("Delivery Distance (In Km's)")}
                          name="deliveryDistance"
                          showLabel={true}
                          value={values.deliveryDistance}
                          onChange={setFieldValue}
                          style={{
                            borderColor: onErrorMessageMatcher(
                              'deliveryDistance',
                              errors?.deliveryDistance,
                              RestaurantDeliveryErrors
                            )
                              ? 'red'
                              : '',
                          }}
                        />
                      </div>

                      <div>
                        <CustomNumberField
                          min={1}
                          max={99999}
                          useGrouping={false}
                          minFractionDigits={0}
                          maxFractionDigits={2}
                          placeholder={t(
                            "Delivery Fee (per Km's) when delivery distance exceeded"
                          )}
                          name="deliveryFee"
                          showLabel={true}
                          value={values.deliveryFee}
                          onChange={setFieldValue}
                          style={{
                            borderColor: onErrorMessageMatcher(
                              'deliveryFee',
                              errors?.deliveryFee,
                              RestaurantDeliveryErrors
                            )
                              ? 'red'
                              : '',
                          }}
                        />
                      </div>

                      {isLoaded && (
                        <div className="pt-3">
                          <CustomGoogleMapsLocationBounds
                            height="400px"
                            hideControls={true}
                          />
                        </div>
                      )}

                      <div className="mt-4 flex justify-end">
                        <CustomButton
                          className="h-10 w-fit border-gray-300 bg-black px-8 text-white"
                          label={t('Add')}
                          type="submit"
                          loading={isSubmitting || mutationLoading}
                        />
                      </div>
                    </div>
                  </Form>
                );
              }}
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
}
