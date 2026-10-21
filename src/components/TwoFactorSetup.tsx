/**
 * Complete 2FA Setup Component
 * Supports 3 methods: Email OTP, SMS OTP, Google Authenticator (TOTP)
 * Frontend React component for Ariiti Admin
 * Uses the project's HTTP client and matches the admin web design system.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAccessToken } from '@/utils/auth-storage';
import { http } from '@/services/client/httpClient';
import { env } from '@/utils/env';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { TextField } from '@/components/forms/TextField';
import { Spinner } from '@/components/common/Spinner';

interface BackupCode {
  code: string;
  used?: boolean;
}

interface SetupResponse {
  method: string;
  qrCode?: string;
  tempOTP?: string;
  backupCodes: string[];
  expiresAt?: string;
}

interface VerifySetupResponse {
  enabled: boolean;
  backupCodes: string[];
  message: string;
}

interface TwoFactorSetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function TwoFactorSetup({ onComplete, onCancel }: TwoFactorSetupProps = {}) {
  const navigate = useNavigate();
  const [step, setStep] = useState<'choose-method' | 'setup' | 'verify' | 'backup' | 'success'>('choose-method');
  const [method, setMethod] = useState<'EMAIL' | 'SMS' | 'TOTP' | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailDest, setEmailDest] = useState('');
  const [qrCode, setQrCode] = useState<string | undefined>();
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<BackupCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempOTP, setTempOTP] = useState('');

  const gateway = env.apiGatewayUrl;

  if (!gateway) {
    setError('API Gateway URL is not configured. Set VITE_API_GATEWAY_URL in your .env file.');
  }

  // Step 1: Choose 2FA Method
  const handleChooseMethod = async (selectedMethod: 'EMAIL' | 'SMS' | 'TOTP') => {
    if (selectedMethod === 'SMS' && !phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }
    if (selectedMethod === 'EMAIL' && !emailDest.trim()) {
      setError('Please enter an email address');
      return;
    }

    setMethod(selectedMethod);
    setLoading(true);
    setError('');

    try {
      const token = getAccessToken();
      if (!token) {
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await http.post<SetupResponse>(
        '/user/2fa/setup',
        { method: selectedMethod, phoneNumber: phoneNumber || undefined, email: emailDest || undefined },
        { authenticated: true }
      );

      if (response.qrCode) {
        setQrCode(response.qrCode);
      }
      if (response.tempOTP) {
        setTempOTP(response.tempOTP);
      }
      setBackupCodes(response.backupCodes.map((code) => ({ code })));
      setStep('setup');
      setLoading(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start 2FA setup';
      console.error('Setup error:', msg);
      setError(msg);
      setLoading(false);
    }
  };

  // Step 2: Verify setup code
  const handleVerifySetup = async () => {
    if (!code.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = getAccessToken();
      if (!token) {
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await http.post<VerifySetupResponse>(
        '/user/2fa/verify-setup',
        { method: method!, code: code.trim(), phoneNumber: phoneNumber || undefined },
        { authenticated: true }
      );

      setBackupCodes(response.backupCodes.map((code) => ({ code })));
      setStep('backup');
      setLoading(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      console.error('Verify setup error:', msg);
      setError(msg);
      setLoading(false);
    }
  };

  // Step 3: Confirm backup codes saved
  const handleConfirmBackupCodes = () => {
    setStep('success');
  };

  // Helper to render method icon
  const getMethodIcon = (m: 'TOTP' | 'EMAIL' | 'SMS') => {
    switch (m) {
      case 'TOTP': return '🔐';
      case 'EMAIL': return '📧';
      case 'SMS': return '📱';
    }
  };

  const getMethodLabel = (m: 'TOTP' | 'EMAIL' | 'SMS') => {
    switch (m) {
      case 'TOTP': return 'Authenticator App (TOTP)';
      case 'EMAIL': return 'Email OTP';
      case 'SMS': return 'SMS OTP';
    }
  };

  const getMethodDescription = (m: 'TOTP' | 'EMAIL' | 'SMS') => {
    switch (m) {
      case 'TOTP': return 'Scan QR code with Google Authenticator, Authy, or Microsoft Authenticator';
      case 'EMAIL': return '6-digit code sent to your email address';
      case 'SMS': return '6-digit code sent to your phone via SMS';
    }
  };

  // Step 1: Choose Method UI
  if (step === 'choose-method') {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card className="p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Enable Two-Factor Authentication
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Add an extra layer of security to your account. Choose your preferred verification method.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(['TOTP', 'EMAIL', 'SMS'] as const).map((m) => {
              const isSelected = method === m;
              const needsPhone = m === 'SMS';
              return (
                <div
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`
                    cursor-pointer p-6 rounded-xl border transition-all
                    ${isSelected
                      ? 'border-primary-dark bg-primary-dark/5 shadow-sm'
                      : 'border-slate-200 bg-white dark:border-dark-600 dark:bg-dark-900 hover:border-primary-dark/50'}
                  `}
                >
                  <div className="text-2xl mb-3">{getMethodIcon(m)}</div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                    {getMethodLabel(m)}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {getMethodDescription(m)}
                  </p>
                  {needsPhone && !phoneNumber.trim() && (
                    <p className="mt-3 text-xs text-red-500 dark:text-red-400 font-medium">
                      Phone number required
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {method === 'SMS' && (
            <div className="mt-6">
              <TextField
                label="Phone Number"
                placeholder="+1 234 567 8900"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                error={
                  method === 'SMS' && !phoneNumber.trim()
                    ? 'Phone number is required for SMS'
                    : undefined
                }
              />
            </div>
          )}

          {method === 'EMAIL' && (
            <div className="mt-6">
              <TextField
                label="Email Address"
                placeholder="you@example.com"
                value={emailDest}
                onChange={(e) => setEmailDest(e.target.value)}
                error={
                  method === 'EMAIL' && !emailDest.trim()
                    ? 'Email is required for Email OTP'
                    : undefined
                }
              />
            </div>
          )}

          <div className="mt-8 flex gap-3">
            <Button
              variant="primary"
              disabled={loading || !method || (method === 'SMS' && !phoneNumber.trim()) || (method === 'EMAIL' && !emailDest.trim())}
              onClick={() => method && handleChooseMethod(method)}
              loading={loading}
            >
              {loading && <Spinner size="sm" className="mr-2" />}
              Continue
            </Button>
            <Button
              variant="ghost"
              onClick={() => (onCancel ? onCancel() : navigate('/settings/security'))}
            >
              Cancel
            </Button>
          </div>
        </Card>
      </div>
    );
  }



  // Step 2: Setup / Verify Code UI
  if (step === 'setup') {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card className="p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Set up {getMethodLabel(method!)}
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              {method === 'TOTP'
                ? 'Scan the QR code with your authenticator app, then enter the 6-digit code it generates.'
                : method === 'EMAIL'
                ? 'A 6-digit code has been sent to your email. Enter it below to verify.'
                : 'A 6-digit code has been sent to your phone via SMS. Enter it below to verify.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {method === 'TOTP' && qrCode && (
            <div className="mb-6 flex flex-col items-center">
              <div className="w-48 h-48 bg-white dark:bg-dark-900 rounded-xl p-2 border border-slate-200 dark:border-dark-600 shadow-sm">
                <img src={qrCode} alt="QR Code" className="w-full h-full object-contain" />
              </div>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                Scan with Google Authenticator, Authy, or Microsoft Authenticator
              </p>
            </div>
          )}

          {tempOTP && (
            <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm flex items-center gap-3">
              <span className="text-xl">💡</span>
              <span>
                Demo OTP: <span className="font-mono font-semibold">{tempOTP}</span> (for testing only)
              </span>
            </div>
          )}

          <TextField
            label="Verification Code"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className="font-mono tracking-widest text-center"
            maxLength={6}
          />

          <div className="mt-6 flex gap-3">
            <Button
              variant="primary"
              disabled={loading || code.length !== 6}
              onClick={handleVerifySetup}
              loading={loading}
            >
              {loading && <Spinner size="sm" className="mr-2" />}
              Verify Code
            </Button>
            <Button variant="outline" onClick={() => setStep('choose-method')}>
              Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Step 3: Backup Codes UI
  if (step === 'backup') {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card className="p-8">
          <div className="mb-6 text-center">
            <div className="text-6xl mb-4">🔑</div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Save Your Backup Codes
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              ⚠️ Save these codes in a safe place. Each code can only be used once.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="text-sm text-yellow-700">
              If you lose access to your authenticator device, use one of these codes to log in.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-dark-900/50 p-6 rounded-lg mb-6 font-mono space-y-2">
            {backupCodes.map((backupCode, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300">
                  {i + 1}. {backupCode.code}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(backupCode.code)}
                  className="text-xs text-primary-dark hover:text-primary-dark/80 dark:text-primary-dark dark:hover:text-primary-dark/80"
                >
                  Copy
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => {
                const text = backupCodes.map((b) => b.code).join('\n');
                const element = document.createElement('a');
                element.setAttribute(
                  'href',
                  `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`
                );
                element.setAttribute('download', '2fa-backup-codes.txt');
                element.style.display = 'none';
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
              }}
              className="flex-1 bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-white py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-dark-700 text-sm font-medium"
            >
              Download
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-white py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-dark-700 text-sm font-medium"
            >
              Print
            </button>
          </div>

          <div className="mt-6">
            <Button variant="primary" onClick={handleConfirmBackupCodes} className="w-full">
              ✓ I've Saved the Codes
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Step 4: Success UI
  if (step === 'success') {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card className="p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            2FA Enabled!
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Your account is now protected with two-factor authentication ({method}).
          </p>

          <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 p-4 rounded-lg mb-6">
            <p className="text-green-700 dark:text-green-400 text-sm">
              You'll need to enter a{' '}
              {method === 'TOTP'
                ? '6-digit code from your authenticator app'
                : method === 'EMAIL'
                ? 'code sent to your email'
                : 'code sent to your phone'
              } every time you log in.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => (onComplete ? onComplete() : navigate('/settings/security'))}
            className="w-full"
          >
            Back to Settings
          </Button>
        </Card>
      </div>
    );
  }

  return null;
}

export default TwoFactorSetup;
