// Core
import { Form, Formik, FormikHelpers } from 'formik';
import { useEffect, useState } from 'react';

// Prime React
import { Sidebar } from 'primereact/sidebar';

// Interface and Types
import { IRiderForm } from '@/lib/utils/interfaces/forms';
import {
  IRidersAddFormComponentProps,
  IRiderZonesResponse,
} from '@/lib/utils/interfaces';

// Components
import CustomButton from '@/lib/ui/useable-components/button';
import CustomDropdownComponent from '@/lib/ui/useable-components/custom-dropdown';
import CustomTextField from '@/lib/ui/useable-components/input-field';
import CustomPasswordTextField from '@/lib/ui/useable-components/password-input-field';

// Utilities and Constants
import {
  RiderErrors /* , VEHICLE_TYPE  */,
  VEHICLE_TYPE,
} from '@/lib/utils/constants';
import { onErrorMessageMatcher } from '@/lib/utils/methods/error';
import { RiderSchema } from '@/lib/utils/schema/rider';

//Toast
import useToast from '@/lib/hooks/useToast';

// API
import { adminAPI } from '@/lib/api/api';

import CustomPhoneTextField from '@/lib/ui/useable-components/phone-input-field';
import { useTranslations } from 'next-intl';

export default function RiderAddForm({
  onHide,
  rider,
  position = 'right',
  isAddRiderVisible,
}: IRidersAddFormComponentProps) {
  const initialValues: IRiderForm = {
    name: '',
    username: '',
    password: '',
    ...rider,
    vehicleType: rider
      ? VEHICLE_TYPE.find((vt) => vt?.code === rider?.vehicleType) || null
      : null,
    confirmPassword: '',
    phone: rider ? +rider.phone : null,
    zone: rider?.zone
      ? { label: rider.zone.title, code: rider.zone._id }
      : null,
  };

  // Hooks
  const t = useTranslations();
  const { showToast } = useToast();
  const [mutationLoading, setMutationLoading] = useState(false);
  const [zones, setZones] = useState<IRiderZonesResponse | null>(null);

  // Fetch zones using REST API
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const response = await adminAPI.getAllZones();
        setZones(response.data);
      } catch (err) {
        console.error('Error fetching zones:', err);
      }
    };
    fetchZones();
  }, []);

  // Form Submission
  const handleSubmit = async (
    values: IRiderForm,
    { resetForm }: FormikHelpers<IRiderForm>
  ) => {
    try {
      setMutationLoading(true);
      const riderData = {
        name: values.name,
        username: values.username,
        phone: values.phone?.toString(),
        zone: values.zone?.code,
        vehicleType: values.vehicleType?.code,
        available: rider ? rider.available : true,
        ...(values.password ? { password: values.password } : {}),
      };

      if (rider) {
        await adminAPI.updateRider(rider._id, riderData);
      } else {
        await adminAPI.createRider(riderData);
      }

      showToast({
        type: 'success',
        title: t('Success'),
        message: rider ? t('Rider updated') : t('Rider added'),
        duration: 3000,
      });
      resetForm();
      onHide();
    } catch (error) {
      const err = error as Error;
      let message = err.message || t('ActionFailedTryAgain');
      showToast({
        type: 'error',
        title: t('Error'),
        message,
        duration: 3000,
      });
    } finally {
      setMutationLoading(false);
    }
  };

  return (
    <Sidebar
      visible={isAddRiderVisible}
      position={position}
      onHide={onHide}
      className="w-full sm:w-[450px] dark:text-white dark:bg-dark-950 border dark:border-dark-600"
    >
      <div className="flex h-full w-full items-center justify-start">
        <div className="h-full w-full">
          <div className="flex flex-col gap-2">
            <div className="mb-2 flex flex-col">
              <span className="text-lg">
                {rider ? t('Edit') : t('Add')} {t('Rider')}
              </span>
            </div>

            <div>
              <Formik
                initialValues={initialValues}
                validationSchema={RiderSchema}
                onSubmit={handleSubmit}
                enableReinitialize
                validateOnChange={false} // Disable validation on change
                validateOnBlur={false} // Disable validation on blur
              >
                {({
                  values,
                  errors,
                  handleChange,
                  handleSubmit,
                  setFieldValue,
                  setFieldTouched ,
                  touched
                }) => {
                  return (
                    <Form onSubmit={handleSubmit}>
                      <div className="space-y-4">
                        <CustomTextField
                          type="text"
                          name="name"
                          placeholder={t('Name')}
                          maxLength={35}
                          value={values.name}
                          onChange={handleChange}
                          showLabel={true}
                          style={{
                            borderColor: onErrorMessageMatcher(
                              'name',
                              errors?.name,
                              RiderErrors
                            )
                              ? 'red'
                              : '',
                          }}
                        />

                        <CustomTextField
                          type="text"
                          name="username"
                          placeholder={t('Username')}
                          maxLength={35}
                          value={values.username}
                          onChange={handleChange}
                          showLabel={true}
                          style={{
                            borderColor: onErrorMessageMatcher(
                              'username',
                              errors?.username,
                              RiderErrors
                            )
                              ? 'red'
                              : '',
                          }}
                        />

                        <CustomPasswordTextField
                          placeholder={t('Password')}
                          name="password"
                          maxLength={20}
                          value={values.password}
                          showLabel={true}
                          onChange={handleChange}
                          style={{
                            borderColor: onErrorMessageMatcher(
                              'password',
                              errors?.password,
                              RiderErrors
                            )
                              ? 'red'
                              : '',
                          }}
                        />

                        <CustomPasswordTextField
                          placeholder={t('Confirm Password')}
                          name="confirmPassword"
                          maxLength={20}
                          showLabel={true}
                          value={values.confirmPassword ?? ''}
                          onChange={handleChange}
                          feedback={false}
                          style={{
                            borderColor: onErrorMessageMatcher(
                              'confirmPassword',
                              errors?.confirmPassword,
                              RiderErrors
                            )
                              ? 'red'
                              : '',
                          }}
                        />

                        <CustomDropdownComponent
                          placeholder={t('Vehicle Type')}
                          options={VEHICLE_TYPE}
                          showLabel={true}
                          name="vehicleType"
                          selectedItem={values.vehicleType}
                          setSelectedItem={setFieldValue}
                          style={{
                            borderColor: onErrorMessageMatcher(
                              'vehicleType',
                              errors?.vehicleType,
                              RiderErrors
                            )
                              ? 'red'
                              : '',
                          }}
                        />

                        <CustomDropdownComponent
                          placeholder={t('Zone')}
                          options={
                            zones?.zones.map((val) => {
                              return { label: val.title, code: val._id };
                            }) || []
                          }
                          showLabel={true}
                          name="zone"
                          selectedItem={values.zone}
                          setSelectedItem={setFieldValue}
                          style={{
                            borderColor: onErrorMessageMatcher(
                              'zone',
                              errors?.zone,
                              RiderErrors
                            )
                              ? 'red'
                              : '',
                          }}
                        />

                        <CustomPhoneTextField
                          type="text"
                          mask="999-999-9999"
                          placeholder={t('Phone Number')}
                          name="phone"
                          showLabel={true}
                          value={values?.phone?.toString()}
                          // onChange={(code: string) => {
                          //   setFieldValue('phone', code);
                          // }}
                          onChange={(code: string) => {
                            setFieldValue('phone', code);
                            setFieldTouched('phone', true, false); // Mark as touched immediately
                          }}
                          style={{
                            borderColor: onErrorMessageMatcher(
                              'phone',
                              errors?.phone,
                              RiderErrors
                            ) && touched?.phone ? 'red' : '',
                          }}
                        />

                        <div className="mt-4 flex justify-end">
                          <CustomButton
                            className="h-10 w-fit border-gray-300 border dark:border-dark-600 bg-black  px-8 text-white"
                            label={rider ? t('Update') : t('Add')}
                            type="submit"
                            loading={mutationLoading}
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
