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
import { IGoogleClientForm } from '@/lib/utils/interfaces/configurations.interface';

// Utils and Constants
import { GoogleClientValidationSchema } from '@/lib/utils/schema';

// API
import { adminAPI } from '@/lib/api/api';

const GoogleClientAddForm = () => {
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_ID_ANDRIOD,
    GOOGLE_CLIENT_ID_IOS,
    GOOGLE_CLIENT_ID_EXPO,
  } = useConfiguration();
  const { showToast } = useToast();

  // State
  const [mutationLoading, setMutationLoading] = useState(false);

  // Set initial values using the configuration
  const initialValues = {
    webClientID: GOOGLE_CLIENT_ID || '',
    androidClientID: GOOGLE_CLIENT_ID_ANDRIOD || '',
    iOSClientID: GOOGLE_CLIENT_ID_IOS || '',
    expoClientID: GOOGLE_CLIENT_ID_EXPO || '',
  };

  const handleSubmit = async (values: IGoogleClientForm) => {
    try {
      setMutationLoading(true);
      await adminAPI.saveGoogleClientIdConfiguration(
        values.webClientID,
        values.androidClientID,
        values.iOSClientID,
        values.expoClientID
      );

      showToast({
        type: 'success',
        title: 'Success!',
        message: 'Google Client Configuration Updated',
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
        validationSchema={GoogleClientValidationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, errors, touched, handleSubmit, handleChange }) => {
          return (
            <Form onSubmit={handleSubmit}>
              <ConfigCard
                cardTitle={'Google Client'}
                buttonLoading={mutationLoading}
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <CustomPasswordTextField
                    placeholder="Web Client ID"
                    name="webClientID"
                    feedback={false}
                    maxLength={255}
                    value={values.webClientID}
                    showLabel={true}
                    onChange={handleChange}
                    style={{
                      borderColor:
                        errors.webClientID && touched.webClientID ? 'red' : '',
                    }}
                  />

                  <CustomPasswordTextField
                    placeholder="Android Client ID"
                    name="androidClientID"
                    feedback={false}
                    maxLength={255}
                    value={values.androidClientID}
                    showLabel={true}
                    onChange={handleChange}
                    style={{
                      borderColor:
                        errors.androidClientID && touched.androidClientID
                          ? 'red'
                          : '',
                    }}
                  />

                  <CustomPasswordTextField
                    placeholder="iOS Client ID"
                    name="iOSClientID"
                    feedback={false}
                    maxLength={255}
                    value={values.iOSClientID}
                    showLabel={true}
                    onChange={handleChange}
                    style={{
                      borderColor:
                        errors.iOSClientID && touched.iOSClientID ? 'red' : '',
                    }}
                  />

                  <CustomPasswordTextField
                    placeholder="Expo Client ID"
                    feedback={false}
                    name="expoClientID"
                    maxLength={255}
                    value={values.expoClientID}
                    showLabel={true}
                    onChange={handleChange}
                    style={{
                      borderColor:
                        errors.expoClientID && touched.expoClientID
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

export default GoogleClientAddForm;
