'use client';
// Core
import { Form, Formik } from 'formik';
import { useState } from 'react';

// Components
import ConfigCard from '../../view/card';

// Toast
import useToast from '@/lib/hooks/useToast';

// Hooks
import { useConfiguration } from '@/lib/hooks/useConfiguration';

// Interfaces and Types
import { ICurrencyForm } from '@/lib/utils/interfaces/configurations.interface';

// Utils and Constants
import { CurrencyValidationSchema } from '@/lib/utils/schema';

import { currencies, currenciesSymbol } from '@/lib/utils/constants/currency';
import CustomDropdownComponent from '@/lib/ui/useable-components/custom-dropdown';

// API
import { adminAPI } from '@/lib/api/api';

const CurrencyAddForm = () => {
  // Hooks
  const { CURRENCY_CODE } = useConfiguration();
  const { showToast } = useToast();

  // State
  const [mutationLoading, setMutationLoading] = useState(false);

  let initialValues = {
    currency: CURRENCY_CODE
      ? { code: CURRENCY_CODE, label: CURRENCY_CODE }
      : null,
    currencySymbol: CURRENCY_CODE
      ? currenciesSymbol.find((v) => v.currency === CURRENCY_CODE) || null
      : null,
  };

  const handleSubmit = async (values: ICurrencyForm) => {
    try {
      setMutationLoading(true);
      await adminAPI.saveCurrencyConfiguration(
        values?.currency?.code,
        values.currencySymbol?.code
      );

      showToast({
        type: 'success',
        title: 'Success!',
        message: 'Currency Configurations Updated',
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
        validationSchema={CurrencyValidationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, errors, touched, handleSubmit, setFieldValue }) => {
          return (
            <Form onSubmit={handleSubmit}>
              <ConfigCard
                cardTitle={'Currency'}
                buttonLoading={mutationLoading}
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <CustomDropdownComponent
                    placeholder="Choose Currency"
                    options={currencies}
                    showLabel={true}
                    name="currency"
                    selectedItem={values.currency}
                    setSelectedItem={setFieldValue}
                    style={{
                      borderColor:
                        errors?.currency && touched.currency ? 'red' : '',
                    }}
                  />
                  <CustomDropdownComponent
                    placeholder="Choose Currency Symbol"
                    options={currenciesSymbol}
                    showLabel={true}
                    name="currencySymbol"
                    selectedItem={values.currencySymbol}
                    setSelectedItem={setFieldValue}
                    style={{
                      borderColor:
                        errors?.currencySymbol && touched.currencySymbol
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

export default CurrencyAddForm;
