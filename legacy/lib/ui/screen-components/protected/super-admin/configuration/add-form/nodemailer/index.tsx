'use client';
// Core
import { Form, Formik } from 'formik';
import { useState } from 'react';

// Components
import ConfigCard from '../../view/card';
import CustomPasswordTextField from '@/lib/ui/useable-components/password-input-field';
import CustomTextField from '@/lib/ui/useable-components/input-field';

// Toast
import useToast from '@/lib/hooks/useToast';

// Hooks
import { useConfiguration } from '@/lib/hooks/useConfiguration';

// Interfaces and Types
import { INodeMailerForm } from '@/lib/utils/interfaces/configurations.interface';

// Utils and Constants
import { NodeMailerValidationSchema } from '@/lib/utils/schema';

// API
import { adminAPI } from '@/lib/api/api';

const NodeMailerAddForm = () => {
  // Hooks
  const { EMAIL_NAME, EMAIL, ENABLE_EMAIL } = useConfiguration();
  const { showToast } = useToast();

  // State
  const [mutationLoading, setMutationLoading] = useState(false);

  const initialValues = {
    email: EMAIL,
    password: '',
    emailName: EMAIL_NAME,
    enableEmail: ENABLE_EMAIL,
  };

  const handleSubmit = async (values: INodeMailerForm) => {
    const password = values.password?.trim();
    try {
      setMutationLoading(true);
      await adminAPI.saveEmailConfiguration(
        values.email,
        values.emailName,
        values.enableEmail,
        password || undefined
      );

      showToast({
        type: 'success',
        title: 'Success!',
        message: 'NodeMailer Configurations Updated',
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
        validationSchema={NodeMailerValidationSchema}
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
                cardTitle={'NodeMailer Email'}
                buttonLoading={mutationLoading}
                toggleLabel={'Status'}
                toggleOnChange={() => {
                  setFieldValue('enableEmail', !values.enableEmail);
                }}
                toggleValue={values.enableEmail}
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <CustomTextField
                    type="text"
                    name="email"
                    placeholder="Email"
                    maxLength={35}
                    value={values.email}
                    onChange={handleChange}
                    showLabel={true}
                    style={{
                      borderColor: errors.email && touched.email ? 'red' : '',
                    }}
                  />

                  <CustomTextField
                    type="text"
                    name="emailName"
                    placeholder="Email Name"
                    maxLength={35}
                    value={values.emailName}
                    onChange={handleChange}
                    showLabel={true}
                    style={{
                      borderColor:
                        errors.emailName && touched.emailName ? 'red' : '',
                    }}
                  />

                  <CustomPasswordTextField
                    placeholder="Password"
                    name="password"
                    feedback={false}
                    maxLength={20}
                    value={values.password}
                    showLabel={true}
                    onChange={handleChange}
                    style={{
                      borderColor:
                        errors.password && touched.password ? 'red' : '',
                    }}
                  />
                </div>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  Leave the password blank to keep the current value.
                </p>
              </ConfigCard>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default NodeMailerAddForm;
