'use client';

// Core
import { useContext, useState } from 'react';

// Formik
import { Form, Formik } from 'formik';

// Prime React
import { Card } from 'primereact/card';

// Interface
import {
  ISignInForm,
} from '@/lib/utils/interfaces/forms';

// Component
import CustomButton from '@/lib/ui/useable-components/button';
import CustomIconTextField from '@/lib/ui/useable-components/input-icon-field';
import CustomPasswordTextField from '@/lib/ui/useable-components/password-input-field';

// Constants
import {
  APP_NAME,
  SignInErrors,
} from '@/lib/utils/constants';

// Methods
import { onErrorMessageMatcher } from '@/lib/utils/methods/error';

// Icons
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';

// API
import { authAPI } from '@/lib/api/api';
import restClient from '@/lib/api/restClient';
import { ToastContext } from '@/lib/context/global/toast.context';

// Schema
import { onUseLocalStorage } from '@/lib/utils/methods';
import { setAuthTokens } from '@/lib/utils/methods/auth';
import { useRouter } from 'next/navigation';
import { useUserContext } from '@/lib/hooks/useUser';
import { DEFAULT_ROUTES } from '@/lib/utils/constants/routes';
import { useTranslations } from 'next-intl';

const initialValues: ISignInForm = {
  email: process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? '',
  password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? '',
};

export default function LoginEmailPasswordMain() {
  // Context
  const { showToast } = useContext(ToastContext);

  // Hooks
  const t = useTranslations();
  const router = useRouter();
  const { refreshUserSession } = useUserContext();
  const [loading, setLoading] = useState(false);

  // Handler
  const onSubmitHandler = async (data: ISignInForm) => {
    try {
      setLoading(true);
      
      const response = await authAPI.login(data.email, data.password, 'email');
      const ownerLogin = response.data;
      
      if (!ownerLogin) {
        throw new Error('Unable to load session');
      }

      onUseLocalStorage('save', `user-${APP_NAME}`, JSON.stringify(ownerLogin));
      setAuthTokens({
        userId: ownerLogin.userId,
        token: ownerLogin.token,
        tokenExpiration: ownerLogin.tokenExpiration,
        userType: ownerLogin.userType,
      });
      
      // Set token in REST client
      restClient.setToken(ownerLogin.token);

      const verifiedUser = await refreshUserSession(ownerLogin);
      if (!verifiedUser) {
        showToast({
          type: 'error',
          title: 'Login',
          message: 'Unable to verify your session. Please try again.',
        });
        return;
      }

      router.replace(DEFAULT_ROUTES[verifiedUser.userType]);

      showToast({
        type: 'success',
        title: t('Login'),
        message: t('User has been logged in successfully'),
      });
    } catch (err) {
      const error = err as Error;
      showToast({
        type: 'error',
        title: t('Login'),
        message: error.message || t('Login Failed'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full w-screen items-center justify-center bg-white dark:bg-dark-950">
      <div className="w-full md:w-1/2 lg:w-[30%]">
        <Card className='dark:bg-dark-900 border dark:border-dark-600'>
          <div className="flex flex-col gap-2 ">
            <div className="mb-2 flex flex-col items-center gap-y-[0.5rem] p-2">
              <span className="font-inter text-center text-3xl font-semibold dark:text-white">
                {t('Login to your account')}
              </span>
              <span className="font-inter text-center text-base font-normal text-[#667085] dark:bg-dark-900 dark:text-white">
                {t('Welcome back! Please enter your details')}.
              </span>
            </div>

            <div>
              <Formik
                initialValues={initialValues}
                onSubmit={onSubmitHandler}
                validateOnChange={false}
              >
                {({ values, errors, handleChange }) => {
                  return (
                    <Form>
                      <div className="mb-2">
                        <CustomIconTextField
                          placeholder={t('Email')}
                          name="email"
                          type="email"
                          maxLength={35}
                          value={values.email}
                          iconProperties={{
                            icon: faEnvelope,
                            position: 'right',
                            style: {
                              marginTop: '-10px',
                            },
                          }}
                          showLabel={false}
                          onChange={handleChange}
                          style={{
                            borderColor: onErrorMessageMatcher(
                              'email',
                              errors?.email,
                              SignInErrors
                            )
                              ? 'red'
                              : '',
                          }}
                        />
                      </div>

                      <div className="mb-2">
                        <CustomPasswordTextField
                          className="h-[2.4rem] w-full"
                          placeholder={t('Password')}
                          name="password"
                          maxLength={20}
                          showLabel={false}
                          value={values.password}
                          onChange={handleChange}
                          feedback={false}
                          style={{
                            borderColor: onErrorMessageMatcher(
                              'password',
                              errors?.password,
                              SignInErrors
                            )
                              ? 'red'
                              : '',
                          }}
                        />
                      </div>

                      <CustomButton
                        className="hover-border-black h-10 w-full border border-black dark:border-dark-600 bg-[#18181B] px-32 text-white hover:bg-white hover:text-black"
                        label={t('Login')}
                        type="submit"
                        loading={loading}
                      />
                    </Form>
                  );
                }}
              </Formik>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
