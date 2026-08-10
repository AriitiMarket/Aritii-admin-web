'use client';

// Interface and Types
import {
  ITippingResponse,
  ITippingsForm,
} from '@/lib/utils/interfaces';

// Schema
import { TippingSchema } from '@/lib/utils/schema/tipping';

// Components
import CustomButton from '@/lib/ui/useable-components/button';
import CustomNumberTextField from '@/lib/ui/useable-components/custom-input';

// Formik
import { ErrorMessage, Form, Formik, FormikHelpers } from 'formik';

//Toast
import useToast from '@/lib/hooks/useToast';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

// API
import { adminAPI } from '@/lib/api/api';

const TippingAddForm = () => {
  // Hooks
  const t = useTranslations();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mutationLoading, setMutationLoading] = useState(false);
  const [data, setData] = useState<ITippingResponse | null>(null);

  // Fetch tipping data using REST API
  useEffect(() => {
    const fetchTipping = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getTipping();
        setData(response.data);
      } catch (err) {
        console.error('Error fetching tipping:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTipping();
  }, []);

  // State
  const initialValues: ITippingsForm = {
    tip1: data?.tips?.tipVariations[0] ?? 1,
    tip2: data?.tips?.tipVariations[1] ?? 2,
    tip3: data?.tips?.tipVariations[2] ?? 3,
  };

  //Form Submission
  const handleSubmit = async (
    values: ITippingsForm,
    { resetForm }: FormikHelpers<ITippingsForm>
  ) => {
    try {
      setMutationLoading(true);
      const tippingData = {
        tipVariations: [values.tip1, values.tip2, values.tip3],
        enabled: true,
      };

      if (data && data.tips._id) {
        await adminAPI.updateTipping(data.tips._id, tippingData);
      } else {
        await adminAPI.createTipping(tippingData);
      }

      showToast({
        type: 'success',
        title: t('Success'),
        message: t('Tipping updated'),
        duration: 3000,
      });
      resetForm();
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
    <div className="p-3">
      <Formik
        initialValues={initialValues}
        validationSchema={TippingSchema}
        onSubmit={handleSubmit}
        validateOnChange={false}
        validateOnBlur
        enableReinitialize
      >
        {({ values, errors, touched, setFieldValue }) => (
          <Form className="grid grid-cols-2 items-center gap-3 sm:grid-cols-4">
            <div className="relative">
              <CustomNumberTextField
                name="tip1"
                placeholder={t('Tip 1 eg 10')}
                min={1}
                max={100}
                value={values.tip1}
                onChange={setFieldValue}
                isLoading={loading}
                showLabel={true}
                style={{
                  borderColor: errors?.tip1 && touched.tip1 ? 'red' : '',
                }}
              />
              <div className="absolute bottom-[-18px] text-xs text-red-500">
                <ErrorMessage name="tip1" />
              </div>
            </div>
            <div className="relative">
              <CustomNumberTextField
                name="tip2"
                placeholder={t('Tip 2 eg 20')}
                min={1}
                max={100}
                isLoading={loading}
                showLabel={true}
                value={values.tip2}
                onChange={setFieldValue}
                style={{
                  borderColor: errors.tip2 && touched.tip2 ? 'red' : '',
                }}
              />
              <div className="absolute bottom-[-18px] text-xs text-red-500">
                <ErrorMessage name="tip2" />
              </div>
            </div>
            <div className="relative">
              <CustomNumberTextField
                name="tip3"
                min={1}
                max={100}
                placeholder={t('Tip 3 eg 30')}
                isLoading={loading}
                showLabel={true}
                value={values.tip3}
                onChange={setFieldValue}
                style={{
                  borderColor: errors.tip3 && touched.tip3 ? 'red' : '',
                }}
              />
              <div className="absolute bottom-[-18px] text-xs text-red-500">
                <ErrorMessage name="tip3" />
              </div>
            </div>
            <CustomButton
              className="mb-[2px] mt-auto flex h-11 rounded-md border border-gray-300 bg-[black] dark:bg-dark-900 dark:border-dark-600 dark:text-white px-10 text-white"
              label={data?.tips._id ? t('Update') : t('Add')}
              rounded={false}
              type="submit"
              loading={mutationLoading}
              disabled={mutationLoading || loading}
            />
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default TippingAddForm;
