import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useLocalization } from '@/i18n/I18nProvider';
import { Button } from '@/components/common/Button';
import { TextField } from '@/components/forms/TextField';
import { PasswordField } from '@/components/forms/PasswordField';
import { isEmail, isRequired } from '@/utils/validation';
import { TwoFactorVerify } from '@/components/TwoFactorVerify';
import { setAuthTokens } from '@/utils/auth-storage';

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
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState<LoginFormState>({
    email: '',
    password: '',
  });
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

  const handleTwoFASuccess = async (_data: Record<string, unknown>) => {
    try {
      if (data.access_token && data.refresh_token) {
        setAuthTokens({
          accessToken: data.access_token as string,
          refreshToken: data.refresh_token as string,
          expiresAt: String(data.expires_in ?? ''),
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
      <div>
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="heading-4 dark:text-white">
            {t('Two-Factor Authentication')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('Verify your identity to continue')}
          </p>
        </div>

        <TwoFactorVerify
          method={twoFA.method}
          tempToken={twoFA.tempToken}
          onSuccess={handleTwoFASuccess}
          onError={handleTwoFAError}
        />

        <button
          onClick={() => setTwoFA({ required: false })}
          className="mt-4 w-full text-gray-500 hover:text-gray-700 text-sm underline"
        >
          {t('Back to Login')}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="heading-4 dark:text-white">
          {t('Login to your account')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('Welcome back! Please enter your details')}.
        </p>

      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <TextField
          name="email"
          type="email"
          label={t('Email')}
          placeholder={t('Email')}
          autoComplete="email"
          value={form.email}
          error={errors.email}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, email: event.target.value }))
          }
        />
        <PasswordField
          name="password"
          label={t('Password')}
          placeholder={t('Password')}
          autoComplete="current-password"
          value={form.password}
          error={errors.password}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, password: event.target.value }))
          }
        />
        <Button type="submit" className="w-full" loading={submitting}>
          {t('Login')}
        </Button>
      </form>
    </div>
  );
}