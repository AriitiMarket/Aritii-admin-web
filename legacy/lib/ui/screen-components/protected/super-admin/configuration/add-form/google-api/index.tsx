'use client';
// Core
import { Form, Formik } from 'formik';
import { useState } from 'react';

// Components
import ConfigCard from '../../view/card';
import CustomPasswordTextField from '@/lib/ui/useable-components/password-input-field';

// Toast
import useToast from '@/lib/hooks/useToast';

// Hooks
import { useConfiguration } from '@/lib/hooks/useConfiguration';

// Interfaces and Types
import { IGoogleApiForm } from '@/lib/utils/interfaces/configurations.interface';

// Utils and Constants
import { GoogleApiValidationSchema } from '@/lib/utils/schema';

// API
import { adminAPI } from '@/lib/api/api';

const GoogleApiAddForm = () => {
  // Hooks
  const { GOOGLE_MAPS_KEY } = useConfiguration();
  const { showToast } = useToast();

  // State
  const [mutationLoading, setMutationLoading] = useState(false);

  // Initial values for the form
  const initialValues = {
    googleApiKey: GOOGLE_MAPS_KEY ?? '',
  };

  const handleSubmit = async (values: IGoogleApiForm) => {
    try {
      setMutationLoading(true);
      await adminAPI.saveGoogleApiKeyConfiguration(values.googleApiKey);

      showToast({
        type: 'success',
        title: 'Success!',
        message: 'Google API Key Updated',
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
        validationSchema={GoogleApiValidationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, errors, touched, handleSubmit, handleChange }) => {
          return (
            <Form onSubmit={handleSubmit}>
              <ConfigCard
                cardTitle={'Google API'}
                buttonLoading={mutationLoading}
              >
                <div className="grid grid-cols-1 gap-4">
                  <CustomPasswordTextField
                    placeholder="Google API Key"
                    name="googleApiKey"
                    maxLength={255}
                    feedback={false}
                    value={values.googleApiKey}
                    showLabel={true}
                    onChange={handleChange}
                    style={{
                      borderColor:
                        errors.googleApiKey && touched.googleApiKey
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

export default GoogleApiAddForm;
