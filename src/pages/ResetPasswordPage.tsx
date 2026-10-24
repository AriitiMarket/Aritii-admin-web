import { useState, useEffect, type FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { useLocalization } from '@/i18n/I18nProvider';
import { PasswordField } from '@/components/forms/PasswordField';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faArrowLeft,
  faCheckCircle,
  faTriangleExclamation,
  faLock,
} from '@fortawesome/free-solid-svg-icons';

export function ResetPasswordPage() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [verifying, setVerifying] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [tokenError, setTokenError] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setIsValidToken(false);
      setTokenError(t('Missing password reset token. Please request a new link.'));
      return;
    }

    const checkToken = async () => {
      try {
        const res = await authService.verifyResetToken(token);
        if (res.valid) {
          setIsValidToken(true);
          if (res.email) setMaskedEmail(res.email);
        } else {
          setIsValidToken(false);
          setTokenError(res.message || t('This password reset link is invalid or has expired.'));
        }
      } catch (err) {
        setIsValidToken(false);
        setTokenError(
          err instanceof Error
            ? err.message
            : t('This password reset link is invalid or has expired.')
        );
      } finally {
        setVerifying(false);
      }
    };

    void checkToken();
  }, [token, t]);

  const validate = (): boolean => {
    const next: { newPassword?: string; confirmPassword?: string } = {};
    if (!newPassword) {
      next.newPassword = t('Password is required');
    } else if (newPassword.length < 8) {
      next.newPassword = t('Password must be at least 8 characters');
    }

    if (!confirmPassword) {
      next.confirmPassword = t('Please confirm your password');
    } else if (newPassword !== confirmPassword) {
      next.confirmPassword = t('Passwords do not match');
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await authService.resetPassword(token, newPassword, confirmPassword);
      setIsSuccess(true);
    } catch (err) {
      setErrors({
        newPassword:
          err instanceof Error ? err.message : t('Failed to reset password. Please try again.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  // State 1: Verifying token
  if (verifying) {
    return (
      <div className="rounded-3xl border border-slate-200/90 bg-white/95 p-8 shadow-xl backdrop-blur-md dark:border-dark-700/80 dark:bg-dark-900/95 sm:p-10 text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-3 border-lime-600 border-t-transparent" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {t('Verifying secure reset token...')}
        </p>
      </div>
    );
  }

  // State 2: Invalid or Expired Token
  if (!isValidToken) {
    return (
      <div className="rounded-3xl border border-slate-200/90 bg-white/95 p-7 shadow-xl backdrop-blur-md dark:border-dark-700/80 dark:bg-dark-900/95 sm:p-9 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-2xl" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t('Invalid or Expired Link')}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {tokenError}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-lime-500 via-lime-600 to-green-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-lime-500/25 transition-all hover:from-lime-600 hover:to-green-700"
          >
            <span>{t('Request New Reset Link')}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-dark-700 dark:bg-dark-900 dark:text-slate-300 dark:hover:bg-dark-800"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-[10px]" />
            <span>{t('Back to Sign In')}</span>
          </button>
        </div>
      </div>
    );
  }

  // State 3: Success after reset
  if (isSuccess) {
    return (
      <div className="rounded-3xl border border-slate-200/90 bg-white/95 p-7 shadow-xl backdrop-blur-md dark:border-dark-700/80 dark:bg-dark-900/95 sm:p-9 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
          <FontAwesomeIcon icon={faCheckCircle} className="text-2xl" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t('Password Reset Complete')}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {t('Your password has been securely updated. All previous active sessions have been invalidated for security.')}
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-lime-500 via-lime-600 to-green-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-lime-500/25 transition-all hover:from-lime-600 hover:to-green-700"
          >
            <span>{t('Sign In With New Password')}</span>
            <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
          </button>
        </div>
      </div>
    );
  }

  // State 4: Reset Form
  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white/95 p-7 shadow-xl backdrop-blur-md dark:border-dark-700/80 dark:bg-dark-900/95 sm:p-9">
      <div className="mb-6">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-lime-500/30 bg-lime-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-lime-700 dark:text-lime-400">
          <FontAwesomeIcon icon={faLock} className="text-[9px]" />
          {t('Set New Credentials')}
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {t('Create New Password')}
        </h1>
        {maskedEmail && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t('Setting new password for')} <span className="font-semibold text-slate-800 dark:text-slate-200">{maskedEmail}</span>
          </p>
        )}
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div className="space-y-1">
          <PasswordField
            name="newPassword"
            label={t('New Password (min 8 characters)')}
            placeholder="••••••••••••"
            autoComplete="new-password"
            value={newPassword}
            error={errors.newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: undefined }));
            }}
            className="rounded-xl border-slate-200 focus:border-lime-500 focus:ring-lime-500/20 dark:border-dark-700"
          />
        </div>

        <div className="space-y-1">
          <PasswordField
            name="confirmPassword"
            label={t('Confirm New Password')}
            placeholder="••••••••••••"
            autoComplete="new-password"
            value={confirmPassword}
            error={errors.confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }}
            className="rounded-xl border-slate-200 focus:border-lime-500 focus:ring-lime-500/20 dark:border-dark-700"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-lime-500 via-lime-600 to-green-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-lime-500/25 transition-all hover:from-lime-600 hover:to-green-700 hover:shadow-lg hover:shadow-lime-500/35 disabled:opacity-60"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>{t('Updating password...')}</span>
            </span>
          ) : (
            <>
              <span>{t('Reset Password & Sign In')}</span>
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
