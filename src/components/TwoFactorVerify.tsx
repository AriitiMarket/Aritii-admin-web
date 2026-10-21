/**
 * 2FA Verification Component for Login
 * Handles verification for all 3 methods: Email, SMS, Google Authenticator
 * Uses tempToken for authentication during the login 2FA challenge flow.
 * Matches the admin web design system (Card, Button, TextField, dark mode).
 */

import { useState, useEffect } from 'react';
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

  if (!gateway) {
    setError('API Gateway URL is not configured. Set VITE_API_GATEWAY_URL in your .env file.');
  }

  const getMethodMessage = () => {
    if (useBackupCode) return 'Enter one of your backup codes';
    switch (method) {
      case 'TOTP': return 'Enter the 6-digit code from your authenticator app';
      case 'EMAIL': return 'Enter the 6-digit code sent to your email';
      case 'SMS': return 'Enter the 6-digit code sent to your phone';
    }
  };

  const getDeviceName = () => {
    switch (method) {
      case 'TOTP': return 'authenticator app';
      case 'EMAIL': return 'email';
      case 'SMS': return 'phone';
    }
  };

  const handleVerify = async () => {
    if (!cleanCode) {
      setError('Please enter the code');
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
    if (method === 'TOTP') return; // TOTP doesn't need resend

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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Two-Factor Authentication
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            {getMethodMessage()}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="mb-6">
          <input
            type="text"
            maxLength={6}
            placeholder="000 000"
            value={code}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              setCode(val);
            }}
            className="w-full px-4 py-3 text-2xl text-center tracking-widest border-2 border-slate-300 rounded-lg focus:outline-none focus:border-primary-dark/60 focus:ring-2 focus:ring-primary-dark/30 font-mono dark:bg-dark-900 dark:text-white dark:border-dark-600"
            autoFocus
          />
        </div>

        <Button
          variant="primary"
          disabled={loading || cleanCode.length !== 6}
          onClick={handleVerify}
          loading={loading}
          className="w-full mb-4"
        >
          {loading && <Spinner size="sm" className="mr-2" />}
          Verify
        </Button>

        {method !== 'TOTP' && (
          <Button
            variant="outline"
            disabled={loading || resendCountdown > 0}
            onClick={handleResend}
            className="w-full mb-4"
          >
            {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}
          </Button>
        )}

        <button
          onClick={() => setUseBackupCode(true)}
          className="w-full text-sm text-primary-dark hover:text-primary-dark/80 dark:text-primary-dark dark:hover:text-primary-dark/80 underline"
        >
          Can't access your {getDeviceName()}? Use a backup code
        </button>
      </Card>
    );
  }

  // ===== Backup Code Entry =====
  return (
    <Card className="p-6 sm:p-8 max-w-md mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Backup Code
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Enter one of your backup codes. Each code can only be used once.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="mb-6">
        <input
          type="text"
          placeholder="XXXXXX-XXXXXX"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
          className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-primary-dark/60 focus:ring-2 focus:ring-primary-dark/30 font-mono text-center text-lg tracking-widest dark:bg-dark-900 dark:text-white dark:border-dark-600"
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

      <button
        onClick={() => {
          setUseBackupCode(false);
          setCode('');
        }}
        className="w-full text-sm text-primary-dark hover:text-primary-dark/80 dark:text-primary-dark dark:hover:text-primary-dark/80 underline"
      >
        Back to {getDeviceName()} code
      </button>
    </Card>
  );
}

export default TwoFactorVerify;