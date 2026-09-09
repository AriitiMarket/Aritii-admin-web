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
import { ICloudinaryForm } from '@/lib/utils/interfaces/configurations.interface';

// Utils and Constants
import { CloudinaryValidationSchema } from '@/lib/utils/schema';

// API
import { adminAPI } from '@/lib/api/api';

const CloudinaryAddForm = () => {
  const { showToast } = useToast();

  const { CLOUDINARY_UPLOAD_URL, CLOUDINARY_API_KEY } = useConfiguration();

  // State
  const [mutationLoading, setMutationLoading] = useState(false);

  // Set initial values
  const initialValues = {
    cloudinaryUploadUrl: CLOUDINARY_UPLOAD_URL,
    cloudinaryApiKey: CLOUDINARY_API_KEY,
  };

  const handleSubmit = async (values: ICloudinaryForm) => {
    try {
      setMutationLoading(true);
      await adminAPI.saveCloudinaryConfiguration(
        values.cloudinaryUploadUrl,
        values.cloudinaryApiKey
      );

      showToast({
        type: 'success',
        title: 'Success!',
        message: 'Cloudinary Configuration Updated',
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
        validationSchema={CloudinaryValidationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, errors, touched, handleSubmit, handleChange }) => {
          return (
            <Form onSubmit={handleSubmit}>
              <ConfigCard
                cardTitle={'Cloudinary'}
                buttonLoading={mutationLoading}
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <CustomPasswordTextField
                    placeholder="Cloudinary Upload URL"
                    name="cloudinaryUploadUrl"
                    feedback={false}
                    maxLength={255}
                    value={values.cloudinaryUploadUrl}
                    showLabel={true}
                    onChange={handleChange}
                    style={{
                      borderColor:
                        errors.cloudinaryUploadUrl &&
                        touched.cloudinaryUploadUrl
                          ? 'red'
                          : '',
                    }}
                  />

                  <CustomPasswordTextField
                    placeholder="Cloudinary API Key"
                    feedback={false}
                    name="cloudinaryApiKey"
                    maxLength={255}
                    value={values.cloudinaryApiKey}
                    showLabel={true}
                    onChange={handleChange}
                    style={{
                      borderColor:
                        errors.cloudinaryApiKey && touched.cloudinaryApiKey
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

export default CloudinaryAddForm;
