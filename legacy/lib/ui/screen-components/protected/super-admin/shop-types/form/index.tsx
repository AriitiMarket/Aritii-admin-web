'use client';
import { ChangeEvent, useContext, useState } from 'react';
import { useTranslations } from 'next-intl';

// Contexts
import { ToastContext } from '@/lib/context/global/toast.context';

// Components
import CustomTextField from '@/lib/ui/useable-components/input-field';
import CustomUploadImageComponent from '@/lib/ui/useable-components/upload/upload-image';
import CustomInputSwitch from '@/lib/ui/useable-components/custom-input-switch';

// Interfaces
import { IAddShopTypeProps } from '@/lib/utils/interfaces';

// Schema
import { ShopTypeFormSchema } from '@/lib/utils/schema';

// Formik
import { Form, Formik } from 'formik';

// Prime react
import { ProgressSpinner } from 'primereact/progressspinner';
import { Sidebar } from 'primereact/sidebar';

// Methods
import { onErrorMessageMatcher } from '@/lib/utils/methods';

// Constants
import { MAX_SQUARE_FILE_SIZE, ShopTypeErrors } from '@/lib/utils/constants';

// API
import { adminAPI } from '@/lib/api/api';

export default function ShopTypesForm({
  setVisible,
  isEditing,
  visible,
  setIsEditing,
}: IAddShopTypeProps) {
  // Hooks
  const { showToast } = useContext(ToastContext);
  const t = useTranslations();
  const [mutationLoading, setMutationLoading] = useState(false);

  // Initial values
  const initialValues = {
    _id: isEditing.bool ? isEditing?.data?._id : '',
    name: isEditing.bool ? isEditing?.data?.name : '',
    image: isEditing.bool ? isEditing?.data?.image : '',
    isActive: isEditing.bool ? isEditing?.data?.isActive : true,
  };

  return (
    <Sidebar
      visible={visible}
      onHide={() => {
        setVisible(false);
        setIsEditing({
          bool: false,
          data: {
            __typename: '',
            _id: '',
            name: '',
            isActive: true,
            image: '',
          },
        });
      }}
      position="right"
      className="w-full sm:w-[450px] dark:text-white dark:bg-dark-950 border dark:border-dark-600"
    >
      <Formik
        initialValues={initialValues}
        validationSchema={ShopTypeFormSchema}
        enableReinitialize={true}
        onSubmit={async (values, { setSubmitting }) => {
          setSubmitting(true);
          setMutationLoading(true);
          let formData;
          if (!isEditing.bool) {
            formData = {
              name: values.name,
              image: values.image || 'https://placehold.co/600x400',
            };
          } else {
            formData = {
              _id: values._id,
              name: values.name,
              image: values.image || 'https://placehold.co/600x400',
              isActive: values.isActive || false,
            };
          }

          try {
            if (!isEditing.bool) {
              await adminAPI.createShopType(formData);
            } else {
              await adminAPI.updateShopType(values._id, formData);
            }
            showToast({
              title: `${isEditing.bool ? t('Edit') : t('New')} ${t('ShopType')}`,
              type: 'success',
              message: isEditing.bool ? `${t('ShopType has been')} ${t('Edited')}  ${t('Successfully')}` : t('ShopType has been added successfully'),
              duration: 2000,
            });
            setIsEditing({
              bool: false,
              data: {
                __typename: '',
                _id: '',
                image: '',
                isActive: true,
                name: '',
              },
            });
            setVisible(false);
          } catch (error) {
            const err = error as Error;
            showToast({
              title: `${isEditing.bool ? t('Edit') : t('New')} ${t('ShopType')}`,
              type: 'error',
              message: err.message || `${t('ShopType')} ${isEditing.bool ? t('Edition') : t('Creation')} ${t('Failed')}`,
              duration: 2000,
            });
          } finally {
            setMutationLoading(false);
            setSubmitting(false);
          }
        }}
        validateOnChange={true}
      >
        {({ errors, handleSubmit, values, isSubmitting, setFieldValue }) => {
          return (
            <Form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <h2 className='className="mb-3 text-xl font-bold'>
                    {isEditing.bool ? t('Edit') : t('Add')} {t('ShopType')}
                  </h2>
                  <div className="flex items-center gap-x-1">
                    {values.isActive ? t('Enabled') : t('Disabled')}
                    <CustomInputSwitch
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setFieldValue('isActive', e.target.checked)
                      }
                      isActive={values.isActive}
                      className={values.isActive ? 'p-inputswitch-checked' : ''}
                    />
                  </div>
                </div>

                <CustomUploadImageComponent
                  key="image"
                  name="image"
                  title={t('Upload Profile Image')}
                  fileTypes={['image/jpg', 'image/webp', 'image/jpeg']}
                  maxFileHeight={1080}
                  maxFileWidth={1080}
                  maxFileSize={MAX_SQUARE_FILE_SIZE}
                  orientation="SQUARE"
                  onSetImageUrl={setFieldValue}
                  existingImageUrl={values.image || ''}
                  showExistingImage={true}
                  style={{
                    borderColor: onErrorMessageMatcher(
                      'image',
                      errors?.image as string,
                      ShopTypeErrors
                    )
                      ? 'red'
                      : '',
                  }}
                />
                <CustomTextField
                  value={values.name}
                  name="title"
                  showLabel={true}
                  placeholder={t('Title')}
                  type="text"
                  onChange={(e) => setFieldValue('name', e.target.value)}
                  style={{
                    borderColor: onErrorMessageMatcher(
                      'title',
                      errors?.name,
                      ShopTypeErrors
                    )
                      ? 'red'
                      : '',
                  }}
                />

                <button
                  className="float-end h-10 w-fit rounded-md border dark:border-dark-600 border-gray-300 bg-black px-8 text-white"
                  disabled={isSubmitting || mutationLoading}
                  type="submit"
                >
                  {isSubmitting || mutationLoading ? (
                    <ProgressSpinner
                      className="m-0 h-6 w-6 items-center self-center p-0"
                      strokeWidth="5"
                      style={{ fill: 'white', accentColor: 'white' }}
                      color="white"
                    />
                  ) : isEditing.bool ? (
                    t('Update')
                  ) : (
                    t('Add')
                  )}
                </button>
              </div>
            </Form>
          );
        }}
      </Formik>
    </Sidebar>
  );
}
