/**
 * 2FA Verification Component for Login
 * Handles verification for all 3 methods: Email, SMS, Google Authenticator
 * Uses tempToken for authentication during the login 2FA challenge flow.
 * Matches the admin web design system (Card, Button, TextField, dark mode).
 */

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldHalved,
  faKey,
  faTriangleExclamation,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { env } from '@/utils/env';

interface TwoFactorVerifyProps {
  method: 'TOTP' | 'EMAIL' | 'SMS';
  tempToken: string;
  onSuccess: (data: Record<string, unknown>) => Promise<void>;
  onError: (error: string) => void;
}

export function TwoFactorVerify({ method = 'TOTP', tempToken, onSuccess, onError }: TwoFactorVerifyProps) {
  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  const cleanCode = code.replace(/\D/g, '');

  // Countdown for resend button (Email/SMS only)
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const gateway = env.apiGatewayUrl;

  if (!gateway && !error) {
    setError('API Gateway URL is not configured. Set VITE_API_GATEWAY_URL in your .env file.');
  }

  const getMethodMessage = () => {
    if (useBackupCode) return 'Enter one of your single-use recovery backup codes';
    switch (method) {
      case 'TOTP':
        return 'Enter the 6-digit verification code from your authenticator application';
      case 'EMAIL':
        return 'Enter the 6-digit verification code sent to your registered email';
      case 'SMS':
        return 'Enter the 6-digit verification code sent to your mobile phone';
    }
  };

  const getDeviceName = () => {
    switch (method) {
      case 'TOTP':
        return 'authenticator app';
      case 'EMAIL':
        return 'email code';
      case 'SMS':
        return 'SMS code';
    }
  };

  const handleVerify = async () => {
    if (!useBackupCode && !cleanCode) {
      setError('Please enter the verification code');
      return;
    }
    if (useBackupCode && !code.trim()) {
      setError('Please enter your backup code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!gateway) {
        setError('API Gateway URL is not configured');
        onError('API Gateway URL is not configured');
        setLoading(false);
        return;
      }

      const response = await fetch(`${gateway}/auth/verify-2fa`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tempToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          useBackupCode
            ? { backupCode: code.trim() }
            : { code: cleanCode }
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Verification failed');
        setLoading(false);
        return;
      }

      await onSuccess(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error. Please try again.';
      console.error('Verify error:', errorMsg);
      setError(errorMsg);
      onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (method === 'TOTP') return;

    setLoading(true);
    try {
      if (!gateway) {
        setError('API Gateway URL is not configured');
        setLoading(false);
        return;
      }

      const response = await fetch(`${gateway}/auth/resend-2fa-code`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tempToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ method }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to resend code');
        setLoading(false);
        return;
      }

      setResendCountdown(60);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error. Please try again.';
      console.error('Resend error:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ===== Regular Code Entry =====
  if (!useBackupCode) {
    return (
      <Card className="p-6 sm:p-8 max-w-md mx-auto">
        <div className="mb-6 text-center">
          <div className="w-12 h-12 rounded-full bg-primary-dark/10 text-primary-dark flex items-center justify-center mx-auto mb-3">
            <FontAwesomeIcon icon={faShieldHalved} className="text-xl" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1.5">
            Two-Factor Verification
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm">
            {getMethodMessage()}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 text-xs md:text-sm flex items-start gap-2.5">
            <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mb-6">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000 000"
            value={code}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              setCode(val);
            }}
            className="w-full px-4 py-3 text-2xl text-center tracking-[0.35em] border border-slate-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-primary-dark font-mono font-bold bg-white dark:bg-dark-900 text-slate-900 dark:text-white transition-all"
            autoFocus
          />
        </div>

        <Button
          variant="primary"
          disabled={loading || cleanCode.length !== 6}
          onClick={handleVerify}
          loading={loading}
          className="w-full mb-3"
        >
          {loading && <Spinner size="sm" className="mr-2" />}
          Verify Code
        </Button>

        {method !== 'TOTP' && (
          <Button
            variant="outline"
            disabled={loading || resendCountdown > 0}
            onClick={handleResend}
            className="w-full mb-4"
          >
            {resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : 'Resend Code'}
          </Button>
        )}

        <div className="pt-3 border-t border-slate-200 dark:border-dark-700 text-center">
          <button
            type="button"
            onClick={() => setUseBackupCode(true)}
            className="text-xs text-primary-dark hover:underline font-medium"
          >
            Cannot access your {getDeviceName()}? Use backup code
          </button>
        </div>
      </Card>
    );
  }

  // ===== Backup Code Entry =====
  return (
    <Card className="p-6 sm:p-8 max-w-md mx-auto">
      <div className="mb-6 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
          <FontAwesomeIcon icon={faKey} className="text-xl" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1.5">
          Emergency Backup Code
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm">
          Enter one of your 10-character backup codes. Each code can only be used once.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 text-xs md:text-sm flex items-start gap-2.5">
          <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mb-6">
        <input
          type="text"
          placeholder="XXXXXX-XXXXXX"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
          className="w-full px-4 py-3 border border-slate-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-primary-dark font-mono text-center text-lg tracking-widest font-semibold bg-white dark:bg-dark-900 text-slate-900 dark:text-white transition-all"
          autoFocus
        />
      </div>

      <Button
        variant="primary"
        disabled={loading || !code.trim()}
        onClick={handleVerify}
        loading={loading}
        className="w-full mb-4"
      >
        {loading && <Spinner size="sm" className="mr-2" />}
        Verify Backup Code
      </Button>

      <div className="pt-3 border-t border-slate-200 dark:border-dark-700 text-center">
        <button
          type="button"
          onClick={() => {
            setUseBackupCode(false);
            setCode('');
            setError('');
          }}
          className="inline-flex items-center text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-1.5" />
          Back to standard verification
        </button>
      </div>
    </Card>
  );
}

export default TwoFactorVerify;