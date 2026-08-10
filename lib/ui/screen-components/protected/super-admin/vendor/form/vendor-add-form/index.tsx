// Core
import { Form, Formik } from 'formik';
import { useContext, useEffect, useState } from 'react';

// Prime React
import { Sidebar } from 'primereact/sidebar';

// Context
import { ToastContext } from '@/lib/context/global/toast.context';
import { VendorContext } from '@/lib/context/super-admin/vendor.context';

// Interface and Types
import {
  IVendorAddFormComponentProps,
} from '@/lib/utils/interfaces';
import { IVendorForm } from '@/lib/utils/interfaces/forms';

// Constants and Methods
import { MAX_SQUARE_FILE_SIZE, VendorErrors } from '@/lib/utils/constants';
import { onErrorMessageMatcher } from '@/lib/utils/methods/error';

// Components
import CustomButton from '@/lib/ui/useable-components/button';
import CustomTextField from '@/lib/ui/useable-components/input-field';
import CustomIconTextField from '@/lib/ui/useable-components/input-icon-field';
import CustomPasswordTextField from '@/lib/ui/useable-components/password-input-field';
import CustomUploadImageComponent from '@/lib/ui/useable-components/upload/upload-image';

// Schema
import { VendorEditSchema, VendorSchema } from '@/lib/utils/schema';

// API
import { adminAPI } from '@/lib/api/api';

// Icons
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import CustomPhoneTextField from '@/lib/ui/useable-components/phone-input-field';
import { useTranslations } from 'next-intl';

const initialValues: IVendorForm = {
  // name: '',
  email: '',
  password: '',
  confirmPassword: '',
  image: '',
  firstName: '',
  lastName: '',
  phoneNumber: '',
};

export default function VendorAddForm({
  position = 'right',
}: IVendorAddFormComponentProps) {
  // Hooks
  const t = useTranslations();

  // Context
  const {
    vendorFormVisible,
    onSetVendorFormVisible,
    vendorId,
    isEditingVendor,
    vendorResponse,
  } = useContext(VendorContext);
  const { showToast } = useContext(ToastContext);

  // States
  const [formInitialValues, setFormValues] = useState<IVendorForm>({
    ...initialValues,
  });
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handlers
  const onVendorCreate = async (data: IVendorForm) => {
    try {
      setIsSubmitting(true);
      const vendorData = {
        _id: isEditingVendor && vendorId ? vendorId : '',
        name: data.firstName + ' ' + data.lastName,
        email: data.email,
        image: data.image,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: `${data.phoneNumber?.toString()}`,
        ...(data.password ? { password: data.password } : {}),
      };

      if (isEditingVendor && vendorId) {
        await adminAPI.editVendor(vendorData);
      } else {
        await adminAPI.createVendor(vendorData);
      }

      showToast({
        type: 'success',
        title: t('New Vendor'),
        message: `${t('Vendor has been')} ${isEditingVendor ? t('edited') : t('added')} ${t('successfully')}`,
        duration: 3000,
      });

      onSetVendorFormVisible(false);
      vendorResponse.refetch();
    } catch (error) {
      const err = error as Error;
      showToast({
        type: 'error',
        title: `${isEditingVendor ? t('Edit') : t('Create')} ${t('Vendor')}`,
        message: err.message || `${t('Vendor')} ${isEditingVendor ? t('Edit') : t('Create')} ${t('Failed')}`,
        duration: 2500,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onFetchVendorById = async () => {
    setFormValues(initialValues);
    if (isEditingVendor && vendorId) {
      try {
        setLoading(true);
        const response = await adminAPI.getVendorById(vendorId ?? '');
        const vendorData = response.data;
        setFormValues((prevState) => ({
          ...initialValues,
          ...prevState,
          ...vendorData,
          image: vendorData?.image ?? '',
        }));
      } catch (error) {
        console.error('Error fetching vendor:', error);
      } finally {
        setLoading(false);
      }
    }
  };
  // Use Effects
  useEffect(() => {
    onFetchVendorById();
  }, [isEditingVendor, vendorId]);

  return (
    <Sidebar
      visible={vendorFormVisible}
      position={position}
      onHide={() => onSetVendorFormVisible(false, false)}
      className="w-full sm:w-[450px] dark:text-white dark:bg-dark-950 border dark:border-dark-600 "
    >
      <div className="flex h-full w-full items-center justify-start">
        <div className="h-full w-full">
          <div className="flex flex-col gap-2">
            <div className="mb-2 flex flex-col">
              <span className="text-lg">
                {isEditingVendor ? t('Edit') : t('Add')} {t('Vendor')}
              </span>
            </div>

            <div>
              <Formik
                initialValues={formInitialValues}
                validationSchema={
                  isEditingVendor && vendorId ? VendorEditSchema : VendorSchema
                }
                enableReinitialize={true}
                validateOnChange={false}
                onSubmit={async (values) => {
                  await onVendorCreate(values);
                }}
              >
                {({
                  values,
                  errors,
                  handleChange,
                  handleSubmit,
                  setFieldValue,
                }) => {
                  return (
                    <Form onSubmit={handleSubmit}>
                      <div className="space-y-3">
                        <CustomTextField
                          type="text"
                          name="firstName"
                          placeholder={t('First Name')}
                          maxLength={35}
                          value={values.firstName}
                          onChange={handleChange}
                          isLoading={loading}
                          showLabel={true}
                          style={{
                            borderColor: onErrorMessageMatcher(
                              'firstName',
                              errors?.firstName,
                              VendorErrors
                            )
                              ? 'red'
                              : '',
                          }}
                        />
                        <CustomTextField
                          type="text"
                          name="lastName"
                          placeholder={t('Last Name')}
                          maxLength={35}
                          value={values.lastName}
                          onChange={handleChange}
                          isLoading={loading}
                          showLabel={true}
                          style={{
                            borderColor: onErrorMessageMatcher(
                              'lastName',
                              errors?.lastName,
                              VendorErrors
                            )
                              ? 'red'
                              : '',
                          }}
                        />
                        <CustomIconTextField
                          type="email"
                          name="email"
                          placeholder={t('Email')}
                          maxLength={35}
                          showLabel={true}
                          iconProperties={{
                            icon: faEnvelope,
                            position: 'right',
                            style: { marginTop: '1px' },
                          }}
                          value={values.email}
                          isLoading={loading}
                          onChange={handleChange}
                          style={{
                            borderColor: onErrorMessageMatcher(
                              'email',
                              errors?.email,
                              VendorErrors
                            )
                              ? 'red'
                              : '',
                          }}
                        />

                        <CustomPhoneTextField
                          mask="999-999-9999"
                          name="phoneNumber"
                          showLabel={true}
                          isLoading={loading}
                          placeholder={t('Phone Number')}
                          value={values.phoneNumber}
                          onChange={(e) => {
                            setFieldValue('phoneNumber', e);
                            // setCountryCode(code);
                          }}
                          type="text"
                          style={{
                            borderColor: onErrorMessageMatcher(
                              'phoneNumber',
                              errors?.phoneNumber,
                              VendorErrors
                            )
                              ? 'red'
                              : '',
                          }}
                        />

                        <CustomPasswordTextField
                          autoComplete="new-password"
                          placeholder={t('Password')}
                          name="password"
                          maxLength={20}
                          value={values.password}
                          showLabel={true}
                          isLoading={loading}
                          onChange={handleChange}
                          style={{
                            borderColor: onErrorMessageMatcher(
                              'password',
                              errors?.password,
                              VendorErrors
                            )
                              ? 'red'
                              : '',
                          }}
                        />

                        <CustomPasswordTextField
                          autoComplete="new-password"
                          placeholder={t('Confirm Password')}
                          name="confirmPassword"
                          maxLength={20}
                          showLabel={true}
                          isLoading={loading}
                          value={values.confirmPassword ?? ''}
                          onChange={handleChange}
                          feedback={false}
                          style={{
                            borderColor: onErrorMessageMatcher(
                              'confirmPassword',
                              errors?.confirmPassword,
                              VendorErrors
                            )
                              ? 'red'
                              : '',
                          }}
                        />
                        <CustomUploadImageComponent
                          key="image"
                          name="image"
                          title={t('Upload Image')}
                          fileTypes={['image/jpg', 'image/webp', 'image/jpeg']}
                          maxFileHeight={1080}
                          maxFileWidth={1080}
                          maxFileSize={MAX_SQUARE_FILE_SIZE}
                          orientation="SQUARE"
                          onSetImageUrl={setFieldValue}
                          existingImageUrl={values.image}
                          showExistingImage={isEditingVendor ? true : false}
                          style={{
                            borderColor: onErrorMessageMatcher(
                              'image',
                              errors?.image as string,
                              VendorErrors
                            )
                              ? 'red'
                              : '',
                          }}
                        />

                        <div className="py-4 flex justify-end">
                          <CustomButton
                            className="h-10 w-fit border-gray-300 border dark:border-dark-600 bg-black  px-8 text-white dark:text-white"
                            label={isEditingVendor ? t('Update') : t('Add')}
                            type="submit"
                            loading={isSubmitting}
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
    </Sidebar>
  );
}
