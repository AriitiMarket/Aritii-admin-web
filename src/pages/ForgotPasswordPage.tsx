import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { useLocalization } from '@/i18n/I18nProvider';
import { TextField } from '@/components/forms/TextField';
import { isEmail, isRequired } from '@/utils/validation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faKey,
  faArrowRight,
  faArrowLeft,
  faEnvelope,
} from '@fortawesome/free-solid-svg-icons';

export function ForgotPasswordPage() {
  const { t } = useLocalization();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validate = (): boolean => {
    if (!isRequired(email)) {
      setError(t('Email is required'));
      return false;
    }
    if (!isEmail(email)) {
      setError(t('Invalid email address'));
      return false;
    }
    setError(undefined);
    return true;
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await authService.forgotPassword(email.trim());
      setSubmitted(true);
    } catch {
      // Anti-enumeration: still display submitted state so attacker cannot probe
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-3xl border border-slate-200/90 bg-white/95 p-6 shadow-xl backdrop-blur-md dark:border-dark-700/80 dark:bg-dark-900/95 sm:p-7 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-lime-100 text-lime-600 dark:bg-lime-950/60 dark:text-lime-400">
          <FontAwesomeIcon icon={faEnvelope} className="text-2xl" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {t('Check Your Email')}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {t('If an administrator account exists for')} <span className="font-semibold text-slate-900 dark:text-white">{email}</span>, {t('we have sent password reset instructions.')}
        </p>
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
          {t('The link expires in 15 minutes. Check your spam folder if you do not see it.')}
        </p>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-lime-500 via-lime-600 to-green-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-lime-500/25 transition-all hover:from-lime-600 hover:to-green-700 hover:shadow-lg hover:shadow-lime-500/35"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-xs transition-transform group-hover:-translate-x-1" />
            <span>{t('Back to Sign In')}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white/95 p-6 shadow-xl backdrop-blur-md dark:border-dark-700/80 dark:bg-dark-900/95 sm:p-7">
      <div className="mb-6">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-lime-500/30 bg-lime-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-lime-700 dark:text-lime-400">
          <FontAwesomeIcon icon={faKey} className="text-[9px]" />
          {t('Account Recovery')}
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {t('Reset Password')}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t('Enter your administrator email to receive secure recovery instructions.')}
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div className="space-y-1">
          <TextField
            name="email"
            type="email"
            label={t('Administrator Email')}
            placeholder="admin@aritii.com"
            autoComplete="email"
            value={email}
            error={error}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(undefined);
            }}
            className="rounded-xl border-slate-200 pl-3 focus:border-lime-500 focus:ring-lime-500/20 dark:border-dark-700"
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
              <span>{t('Sending reset link...')}</span>
            </span>
          ) : (
            <>
              <span>{t('Send Reset Instructions')}</span>
              <FontAwesomeIcon
                icon={faArrowRight}
                className="text-xs transition-transform group-hover:translate-x-1"
              />
            </>
          )}
        </button>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-[10px]" />
            <span>{t('Back to Sign In')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
