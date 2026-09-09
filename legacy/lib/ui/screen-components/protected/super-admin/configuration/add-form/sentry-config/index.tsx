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
import { ISentryForm } from '@/lib/utils/interfaces/configurations.interface';

// Utils and Constants
import { SentryValidationSchema } from '@/lib/utils/schema';

// API
import { adminAPI } from '@/lib/api/api';

const SentryAddForm = () => {
  // Hooks
  const {
    DASHBOARD_SENTRY_URL,
    WEB_SENTRY_URL,
    API_SENTRY_URL,
    CUSTOMER_APP_SENTRY_URL,
    RESTAURANT_APP_SENTRY_URL,
    RIDER_APP_SENTRY_URL,
  } = useConfiguration();
  const { showToast } = useToast();

  // State
  const [mutationLoading, setMutationLoading] = useState(false);

  const initialValues = {
    dashboardSentryUrl: DASHBOARD_SENTRY_URL,
    webSentryUrl: WEB_SENTRY_URL,
    apiSentryUrl: API_SENTRY_URL,
    customerAppSentryUrl: CUSTOMER_APP_SENTRY_URL,
    restaurantAppSentryUrl: RESTAURANT_APP_SENTRY_URL,
    riderAppSentryUrl: RIDER_APP_SENTRY_URL,
  };

  const handleSubmit = async (values: ISentryForm) => {
    try {
      setMutationLoading(true);
      await adminAPI.saveSentryConfiguration(
        values.dashboardSentryUrl,
        values.webSentryUrl,
        values.apiSentryUrl,
        values.customerAppSentryUrl,
        values.restaurantAppSentryUrl,
        values.riderAppSentryUrl
      );

      showToast({
        type: 'success',
        title: 'Success!',
        message: 'Sentry Configurations Updated',
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
        validationSchema={SentryValidationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, errors, touched, handleSubmit, handleChange }) => {
          return (
            <Form onSubmit={handleSubmit}>
              <ConfigCard cardTitle={'Sentry'} buttonLoading={mutationLoading}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <CustomPasswordTextField
                    placeholder="Dashboard Sentry URL"
                    name="dashboardSentryUrl"
                    feedback={false}
                    maxLength={255}
                    value={values.dashboardSentryUrl}
                    showLabel={true}
                    onChange={handleChange}
                    style={{
                      borderColor:
                        errors.dashboardSentryUrl && touched.dashboardSentryUrl
                          ? 'red'
                          : '',
                    }}
                  />

                  <CustomPasswordTextField
                    placeholder="Web Sentry URL"
                    name="webSentryUrl"
                    feedback={false}
                    maxLength={255}
                    value={values.webSentryUrl}
                    showLabel={true}
                    onChange={handleChange}
                    style={{
                      borderColor:
                        errors.webSentryUrl && touched.webSentryUrl
                          ? 'red'
                          : '',
                    }}
                  />

                  <CustomPasswordTextField
                    placeholder="API Sentry URL"
                    name="apiSentryUrl"
                    feedback={false}
                    maxLength={255}
                    value={values.apiSentryUrl}
                    showLabel={true}
                    onChange={handleChange}
                    style={{
                      borderColor:
                        errors.apiSentryUrl && touched.apiSentryUrl
                          ? 'red'
                          : '',
                    }}
                  />

                  <CustomPasswordTextField
                    placeholder="Customer App Sentry URL"
                    name="customerAppSentryUrl"
                    feedback={false}
                    maxLength={255}
                    value={values.customerAppSentryUrl}
                    showLabel={true}
                    onChange={handleChange}
                    style={{
                      borderColor:
                        errors.customerAppSentryUrl &&
                        touched.customerAppSentryUrl
                          ? 'red'
                          : '',
                    }}
                  />

                  <CustomPasswordTextField
                    placeholder="Restaurant App Sentry URL"
                    name="restaurantAppSentryUrl"
                    maxLength={255}
                    feedback={false}
                    value={values.restaurantAppSentryUrl}
                    showLabel={true}
                    onChange={handleChange}
                    style={{
                      borderColor:
                        errors.restaurantAppSentryUrl &&
                        touched.restaurantAppSentryUrl
                          ? 'red'
                          : '',
                    }}
                  />

                  <CustomPasswordTextField
                    placeholder="Rider App Sentry URL"
                    name="riderAppSentryUrl"
                    maxLength={255}
                    feedback={false}
                    value={values.riderAppSentryUrl}
                    showLabel={true}
                    onChange={handleChange}
                    style={{
                      borderColor:
                        errors.riderAppSentryUrl && touched.riderAppSentryUrl
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

export default SentryAddForm;
