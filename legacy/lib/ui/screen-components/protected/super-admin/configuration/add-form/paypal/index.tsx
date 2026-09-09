'use client';
// Core
import { Form, Formik } from 'formik';
import { useState } from 'react';

// Components
import CustomPasswordTextField from '@/lib/ui/useable-components/password-input-field';
import ConfigCard from '../../view/card';

// Toast
import useToast from '@/lib/hooks/useToast';

// Hooks
import { useConfiguration } from '@/lib/hooks/useConfiguration';

// Interfaces and Types
import { IPaypalForm } from '@/lib/utils/interfaces/configurations.interface';

// Utils and Constants
import { PayPalValidationSchema } from '@/lib/utils/schema';

// API
import { adminAPI } from '@/lib/api/api';

const PayPalAddForm = () => {
  // Hooks
  const { PAYPAL_KEY, PAYPAL_SANDBOX } = useConfiguration();
  const { showToast } = useToast();

  // State
  const [mutationLoading, setMutationLoading] = useState(false);

  const initialValues = {
    clientId: PAYPAL_KEY,
    clientSecret: '',
    sandbox: PAYPAL_SANDBOX,
  };

  const handleSubmit = async (values: IPaypalForm) => {
    const clientSecret = values.clientSecret?.trim();
    try {
      setMutationLoading(true);
      await adminAPI.savePaypalConfiguration(
        values.clientId,
        values.sandbox,
        clientSecret || undefined
      );

      showToast({
        type: 'success',
        title: 'Success!',
        message: 'PayPal Configurations Updated',
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
        validationSchema={PayPalValidationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({
          values,
          errors,
          touched,
          handleSubmit,
          handleChange,
          setFieldValue,
        }) => {
          return (
            <Form onSubmit={handleSubmit}>
              <ConfigCard
                cardTitle={'PayPal'}
                buttonLoading={mutationLoading}
                toggleLabel={'Sandbox'}
                toggleOnChange={() => {
                  setFieldValue('sandbox', !values.sandbox);
                }}
                toggleValue={values.sandbox}
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <CustomPasswordTextField
                    placeholder="Publishable Key"
                    feedback={false}
                    name="clientId"
                    maxLength={20}
                    value={values.clientId}
                    showLabel={true}
                    onChange={handleChange}
                    style={{
                      borderColor:
                        errors.clientId && touched.clientId ? 'red' : '',
                    }}
                  />

                  <CustomPasswordTextField
                    placeholder="Client Secret"
                    feedback={false}
                    name="clientSecret"
                    maxLength={20}
                    value={values.clientSecret}
                    showLabel={true}
                    onChange={handleChange}
                    style={{
                      borderColor:
                        errors.clientSecret && touched.clientSecret
                          ? 'red'
                          : '',
                    }}
                  />
                </div>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  Leave the client secret blank to keep the current value.
                </p>
              </ConfigCard>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default PayPalAddForm;
