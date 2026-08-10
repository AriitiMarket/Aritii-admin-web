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
import { ITwilioForm } from '@/lib/utils/interfaces/configurations.interface';

// Utils and Constants
import { TwilioValidationSchema } from '@/lib/utils/schema';

// API
import { adminAPI } from '@/lib/api/api';
import CustomNumberField from '@/lib/ui/useable-components/number-input-field';

const TwilioAddForm = () => {
  // Hooks
  const {
    TWILIO_ACCOUNT_SID,
    TWILIO_PHONE_NUMBER,
    TWILIO_ENABLED,
    TWILIO_WHATSAPP_NUMBER,
  } = useConfiguration();
  const { showToast } = useToast();

  // State
  const [mutationLoading, setMutationLoading] = useState(false);

  const initialValues = {
    twilioAccountSid: TWILIO_ACCOUNT_SID,
    twilioAuthToken: '',
    twilioPhoneNumber: TWILIO_PHONE_NUMBER ? +TWILIO_PHONE_NUMBER : null,
    twilioEnabled: TWILIO_ENABLED,
    twilioWhatsAppNumber: TWILIO_WHATSAPP_NUMBER
      ? +TWILIO_WHATSAPP_NUMBER
      : null,
  };

  const handleSubmit = async (values: ITwilioForm) => {
    const twilioAuthToken = values.twilioAuthToken?.trim();
    try {
      setMutationLoading(true);
      await adminAPI.saveTwilioConfiguration(
        values.twilioAccountSid,
        values.twilioPhoneNumber ? values.twilioPhoneNumber.toString() : '',
        values.twilioEnabled,
        values.twilioWhatsAppNumber ? values.twilioWhatsAppNumber?.toString() : '',
        twilioAuthToken || undefined
      );

      showToast({
        type: 'success',
        title: 'Success!',
        message: 'Twilio Configurations Updated',
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
        validationSchema={TwilioValidationSchema}
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
                cardTitle={'Twilio'}
                buttonLoading={mutationLoading}
                toggleLabel={'Status'}
                toggleOnChange={() => {
                  setFieldValue('twilioEnabled', !values.twilioEnabled);
                }}
                toggleValue={values.twilioEnabled}
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <CustomPasswordTextField
                    placeholder="Account Sid"
                    name="twilioAccountSid"
                    maxLength={34}
                    feedback={false}
                    value={values.twilioAccountSid}
                    showLabel={true}
                    onChange={handleChange}
                    style={{
                      borderColor:
                        errors.twilioAccountSid && touched.twilioAccountSid
                          ? 'red'
                          : '',
                    }}
                  />

                  <CustomPasswordTextField
                    placeholder="Auth Token"
                    name="twilioAuthToken"
                    maxLength={20}
                    feedback={false}
                    value={values.twilioAuthToken}
                    showLabel={true}
                    onChange={handleChange}
                    style={{
                      borderColor:
                        errors.twilioAuthToken && touched.twilioAuthToken
                          ? 'red'
                          : '',
                    }}
                  />

                  <CustomNumberField
                    min={0}
                    placeholder="Phone Number"
                    name="twilioPhoneNumber"
                    showLabel={true}
                    value={values.twilioPhoneNumber}
                    useGrouping={false}
                    onChange={setFieldValue}
                    style={{
                      borderColor:
                        errors.twilioPhoneNumber && touched.twilioPhoneNumber
                          ? 'red'
                          : '',
                    }}
                  />
                  <CustomNumberField
                    min={0}
                    placeholder="Whatsapp Number"
                    name="twilioWhatsAppNumber"
                    showLabel={true}
                    value={values.twilioWhatsAppNumber || null}
                    useGrouping={false}
                    onChange={setFieldValue}
                    style={{
                      borderColor:
                        errors.twilioWhatsAppNumber &&
                        touched.twilioWhatsAppNumber
                          ? 'red'
                          : '',
                    }}
                  />
                </div>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  Leave the auth token blank to keep the current value.
                </p>
              </ConfigCard>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default TwilioAddForm;
