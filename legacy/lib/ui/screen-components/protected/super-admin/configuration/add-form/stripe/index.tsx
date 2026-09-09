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
import { IStripeForm } from '@/lib/utils/interfaces/configurations.interface';

// Utils and Constants
import { StripeValidationSchema } from '@/lib/utils/schema';

// API
import { adminAPI } from '@/lib/api/api';

const StripeAddForm = () => {
  // Hooks
  const { STRIPE_PUBLIC_KEY } = useConfiguration();
  const { showToast } = useToast();

  // State
  const [mutationLoading, setMutationLoading] = useState(false);

  const initialValues = {
    publishableKey: STRIPE_PUBLIC_KEY,
    secretKey: '',
  };

  const handleSubmit = async (values: IStripeForm) => {
    const secretKey = values.secretKey?.trim();
    try {
      setMutationLoading(true);
      await adminAPI.saveStripeConfiguration(
        values.publishableKey,
        secretKey || undefined
      );

      showToast({
        type: 'success',
        title: 'Success!',
        message: 'Stripe Configurations Updated',
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
        validationSchema={StripeValidationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, errors, touched, handleSubmit, handleChange }) => {
          return (
            <Form onSubmit={handleSubmit}>
              <ConfigCard cardTitle={'Stripe'} buttonLoading={mutationLoading}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <CustomPasswordTextField
                    placeholder="Publishable Key"
                    name="publishableKey"
                    maxLength={20}
                    value={values.publishableKey}
                    showLabel={true}
                    feedback={false}
                    onChange={handleChange}
                    style={{
                      borderColor:
                        errors.publishableKey && touched.publishableKey
                          ? 'red'
                          : '',
                    }}
                  />

                  <CustomPasswordTextField
                    placeholder="SecretKey"
                    name="secretKey"
                    maxLength={20}
                    feedback={false}
                    value={values.secretKey}
                    showLabel={true}
                    onChange={handleChange}
                    style={{
                      borderColor:
                        errors.secretKey && touched.secretKey ? 'red' : '',
                    }}
                  />
                </div>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  Leave the secret key blank to keep the current value.
                </p>
              </ConfigCard>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default StripeAddForm;
