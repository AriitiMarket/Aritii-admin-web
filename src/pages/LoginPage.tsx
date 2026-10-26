import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useLocalization } from '@/i18n/I18nProvider';
import { TextField } from '@/components/forms/TextField';
import { PasswordField } from '@/components/forms/PasswordField';
import { isEmail, isRequired } from '@/utils/validation';
import { TwoFactorVerify } from '@/components/TwoFactorVerify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldHalved,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';

interface LoginFormState {
  email: string;
  password: string;
}

interface TwoFAState {
  required: boolean;
  method?: 'TOTP' | 'EMAIL' | 'SMS';
  tempToken?: string;
}

export function LoginPage() {
  const { t } = useLocalization();
  const { login, loginWith2FAResult } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState<LoginFormState>({
    email: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<Partial<LoginFormState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [twoFA, setTwoFA] = useState<TwoFAState>({ required: false });

  const validate = (): boolean => {
    const next: Partial<LoginFormState> = {};
    if (!isRequired(form.email)) next.email = t('Email is required');
    else if (!isEmail(form.email)) next.email = t('Invalid email address');
    if (!isRequired(form.password)) next.password = t('Password is required');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleTwoFASuccess = async (data: Record<string, unknown>) => {
    try {
      if (data.access_token && data.refresh_token) {
        await loginWith2FAResult({
          access_token: data.access_token as string,
          refresh_token: data.refresh_token as string,
          expires_in: data.expires_in as string | number | undefined,
          user: data.user,
        });
      }
      showToast({
        type: 'success',
        title: t('Login'),
        message: t('User has been logged in successfully'),
      });

      const from =
        (location.state as { from?: string } | null)?.from ?? '/home';
      navigate(from, { replace: true });
    } catch (error) {
      showToast({
        type: 'error',
        title: t('Login'),
        message:
          error instanceof Error ? error.message : t('Login Failed'),
      });
    }
  };

  const handleTwoFAError = (errorMessage: string) => {
    showToast({
      type: 'error',
      title: t('2FA Verification'),
      message: errorMessage,
    });
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await login({ email: form.email, password: form.password });
      showToast({
        type: 'success',
        title: t('Login'),
        message: t('User has been logged in successfully'),
      });
      const from =
        (location.state as { from?: string } | null)?.from ?? '/home';
      navigate(from, { replace: true });
    } catch (error: unknown) {
      // Check if this is a 2FA required error
      if (
        error instanceof Object &&
        'message' in error &&
        typeof error.message === 'string' &&
        (error.message.toLowerCase().includes('2fa') ||
          error.message.toLowerCase().includes('two-factor') ||
          error.message.toLowerCase().includes('two_factor')) &&
        'method' in error
      ) {
        const errorObj = error as Record<string, unknown>;
        setTwoFA({
          required: true,
          method: errorObj.method as 'TOTP' | 'EMAIL' | 'SMS',
          tempToken: (errorObj.tempToken as string) || '',
        });
        setSubmitting(false);
        return;
      }

      showToast({
        type: 'error',
        title: t('Login'),
        message:
          error instanceof Error ? error.message : t('Login Failed'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Show 2FA verification screen if required
  if (twoFA.required && twoFA.method && twoFA.tempToken) {
    return (
      <div className="rounded-3xl border border-slate-200/90 bg-white/90 p-8 shadow-xl backdrop-blur-md dark:border-dark-700/80 dark:bg-dark-900/90">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-100 text-lime-700 shadow-sm dark:bg-lime-950/60 dark:text-lime-400">
            <FontAwesomeIcon icon={faShieldHalved} className="text-2xl" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {t('Two-Factor Authentication')}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t('Enter your one-time verification code to continue.')}
          </p>
        </div>

        <TwoFactorVerify
          method={twoFA.method}
          tempToken={twoFA.tempToken}
          onSuccess={handleTwoFASuccess}
          onError={handleTwoFAError}
        />

        <div className="mt-6 border-t border-slate-100 pt-4 text-center dark:border-dark-700">
          <button
            type="button"
            onClick={() => setTwoFA({ required: false })}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            ← {t('Back to Login')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white/95 p-6 shadow-xl backdrop-blur-md dark:border-dark-700/80 dark:bg-dark-900/95 sm:p-7">
      {/* Top Header Card */}
      <div className="mb-4">
        <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-lime-500/30 bg-lime-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-lime-700 dark:text-lime-400">
          <FontAwesomeIcon icon={faShieldHalved} className="text-[9px]" />
          {t('Marketplace Administration')}
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {t('Sign in to Admin Console')}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t('Enter your administrator credentials to manage platform merchants, orders, and logistics.')}
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-3.5">
        {/* Email Field with Icon */}
        <div className="space-y-1">
          <div className="relative">
            <TextField
              name="email"
              type="email"
              label={t('Administrator Email')}
              placeholder="admin@aritii.com"
              autoComplete="email"
              value={form.email}
              error={errors.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              className="rounded-xl border-slate-200 pl-3 focus:border-lime-500 focus:ring-lime-500/20 dark:border-dark-700"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <PasswordField
            name="password"
            label={t('Security Password')}
            placeholder="••••••••••••"
            autoComplete="current-password"
            value={form.password}
            error={errors.password}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, password: event.target.value }))
            }
            className="rounded-xl border-slate-200 focus:border-lime-500 focus:ring-lime-500/20 dark:border-dark-700"
          />
        </div>

        {/* Remember Me & Support */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded-md border-slate-300 text-lime-600 focus:ring-lime-500 dark:border-dark-600 dark:bg-dark-900"
            />
            <span>{t('Remember this device')}</span>
          </label>

          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="text-xs font-medium text-slate-500 hover:text-lime-600 dark:text-slate-400 dark:hover:text-lime-400 transition-colors"
          >
            {t('Forgot password?')}
          </button>
        </div>

        {/* Sign In CTA Button */}
        <button
          type="submit"
          disabled={submitting}
          className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-lime-500 via-lime-600 to-green-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-lime-500/25 transition-all hover:from-lime-600 hover:to-green-700 hover:shadow-lg hover:shadow-lime-500/35 disabled:opacity-60"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>{t('Authenticating credentials...')}</span>
            </span>
          ) : (
            <>
              <span>{t('Sign in to Admin Console')}</span>
              <FontAwesomeIcon
                icon={faArrowRight}
                className="text-xs transition-transform group-hover:translate-x-1"
              />
            </>
          )}
        </button>
      </form>
    </div>
  );
}