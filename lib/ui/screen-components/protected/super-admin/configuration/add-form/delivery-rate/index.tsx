'use client';
// Core
import { Form, Formik } from 'formik';
import { useState } from 'react';

// Components
import ConfigCard from '../../view/card';

// Toast
import useToast from '@/lib/hooks/useToast';

// Hooks
import { useConfiguration } from '@/lib/hooks/useConfiguration';

// Interfaces and Types
import { IDeliveryRateForm } from '@/lib/utils/interfaces/configurations.interface';

// Utils and Constants
import { DeliverytRateValidationSchema } from '@/lib/utils/schema';

import CustomNumberField from '@/lib/ui/useable-components/number-input-field';

// API
import { adminAPI } from '@/lib/api/api';

const DeliveryRateAddForm = () => {
  // Hooks
  const { DELIVERY_RATE, COST_TYPE } = useConfiguration();
  const { showToast } = useToast();

  // State
  const [mutationLoading, setMutationLoading] = useState(false);

  const initialValues: IDeliveryRateForm = {
    deliveryRate: DELIVERY_RATE ?? null,
    costType: COST_TYPE,
  };

  const handleSubmit = async (values: IDeliveryRateForm) => {
    try {
      setMutationLoading(true);
      await adminAPI.saveDeliveryRateConfiguration(
        values.deliveryRate || 0,
        values.costType || ''
      );

      showToast({
        type: 'success',
        title: 'Success!',
        message: 'Delivery Rate Configurations Updated',
        duration: 3000,
      });
    } catch (error) {
      const err = error as Error;
      showToast({
        type: 'error',
        title: 'Error!',
        message: err.message || 'ActionFailedTryAgain',
        duration: 3000,
      });
    } finally {
      setMutationLoading(false);
    }
  };

  return (
    <div>
      <Formik
        initialValues={initialValues}
        validationSchema={DeliverytRateValidationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, errors, touched, handleSubmit, setFieldValue }) => {
          return (
            <Form onSubmit={handleSubmit}>
              <ConfigCard
                cardTitle={'Delivery Rate'}
                buttonLoading={mutationLoading}
              >
                <div>
                  <CustomNumberField
                    min={0}
                    placeholder="Delivery Rate"
                    name="deliveryRate"
                    showLabel={true}
                    value={values.deliveryRate}
                    useGrouping={false}
                    onChange={setFieldValue}
                    style={{
                      borderColor:
                        errors.deliveryRate && touched.deliveryRate
                          ? 'red'
                          : '',
                    }}
                  />
                </div>
              </ConfigCard>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default DeliveryRateAddForm;
