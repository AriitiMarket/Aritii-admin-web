/**
 * Complete 2FA Setup Component
 * Supports 3 methods: Email OTP, SMS OTP, Authenticator App (TOTP)
 * Frontend React component for Ariiti Admin
 * Matches the admin web design system, brand colors, and typography.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldHalved,
  faCircleCheck,
  faCircleInfo,
  faTriangleExclamation,
  faCopy,
  faDownload,
  faPrint,
  faCheck,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import { getAccessToken } from '@/utils/auth-storage';
import { http } from '@/services/client/httpClient';
import { env } from '@/utils/env';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { TextField } from '@/components/forms/TextField';

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

type MethodType = 'TOTP' | 'EMAIL' | 'SMS';

interface MethodOption {
  id: MethodType;
  title: string;
  badge: string;
  badgeVariant: 'recommended' | 'standard';
  description: string;
}

const METHOD_OPTIONS: MethodOption[] = [
  {
    id: 'TOTP',
    title: 'Authenticator App (TOTP)',
    badge: 'Recommended',
    badgeVariant: 'recommended',
    description: 'Use Google Authenticator, Microsoft Authenticator, or 1Password to generate secure one-time passcodes.',
  },
  {
    id: 'EMAIL',
    title: 'Email Verification',
    badge: 'Instant Delivery',
    badgeVariant: 'standard',
    description: 'Receive a secure 6-digit verification code sent directly to your administrative email address.',
  },
  {
    id: 'SMS',
    title: 'SMS Text Message',
    badge: 'Cellular OTP',
    badgeVariant: 'standard',
    description: 'Receive a 6-digit verification code sent via text message to your registered mobile phone number.',
  },
];

export function TwoFactorSetup({ onComplete, onCancel }: TwoFactorSetupProps = {}) {
  const navigate = useNavigate();
  const [step, setStep] = useState<'choose-method' | 'setup' | 'backup' | 'success'>('choose-method');
  const [method, setMethod] = useState<MethodType | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailDest, setEmailDest] = useState('');
  const [qrCode, setQrCode] = useState<string | undefined>();
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<BackupCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempOTP, setTempOTP] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const gateway = env.apiGatewayUrl;

  if (!gateway && !error) {
    setError('API Gateway URL is not configured. Set VITE_API_GATEWAY_URL in your .env file.');
  }

  // Step 1: Choose 2FA Method
  const handleChooseMethod = async (selectedMethod: MethodType) => {
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
      setBackupCodes((response.backupCodes || []).map((c) => ({ code: c })));
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

      setBackupCodes((response.backupCodes || []).map((c) => ({ code: c })));
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

  const getMethodLabel = (m: MethodType) => {
    switch (m) {
      case 'TOTP':
        return 'Authenticator App (TOTP)';
      case 'EMAIL':
        return 'Email Verification';
      case 'SMS':
        return 'SMS Verification';
    }
  };

  const handleCopyCode = async (c: string, index: number) => {
    try {
      await navigator.clipboard.writeText(c);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // ignore
    }
  };

  // Step 1: Choose Method UI
  if (step === 'choose-method') {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <Card className="p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1.5">
              Enable Two-Factor Authentication
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Add a mandatory extra verification layer to your administrator account. Select your preferred authentication method to continue.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 text-sm flex items-start gap-2.5">
              <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5 text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3.5">
            {METHOD_OPTIONS.map((opt) => {
              const isSelected = method === opt.id;
              const needsPhone = opt.id === 'SMS';
              const needsEmail = opt.id === 'EMAIL';

              return (
                <div
                  key={opt.id}
                  onClick={() => setMethod(opt.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setMethod(opt.id);
                    }
                  }}
                  className={`
                    w-full text-left p-4 md:p-5 rounded-xl border transition-all cursor-pointer select-none
                    ${
                      isSelected
                        ? 'border-primary-dark ring-2 ring-primary-dark/20 bg-primary-dark/[0.04] dark:bg-primary-dark/[0.08] shadow-xs'
                        : 'border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-900/50 hover:border-slate-300 dark:hover:border-dark-600 hover:bg-slate-50/50 dark:hover:bg-dark-800/40'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      {/* Professional radio indicator */}
                      <div
                        className={`
                          mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors
                          ${
                            isSelected
                              ? 'border-primary-dark bg-primary-dark'
                              : 'border-slate-300 dark:border-dark-500 bg-transparent'
                          }
                        `}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="font-semibold text-slate-900 dark:text-white text-sm md:text-base">
                            {opt.title}
                          </h3>
                          {opt.badgeVariant === 'recommended' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                              {opt.badge}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-dark-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-dark-600">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                          {opt.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Context inputs when selected */}
                  {isSelected && needsPhone && (
                    <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-dark-700/80" onClick={(e) => e.stopPropagation()}>
                      <TextField
                        label="Mobile Phone Number"
                        placeholder="+251 91 234 5678"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        error={!phoneNumber.trim() ? 'Valid phone number is required' : undefined}
                      />
                    </div>
                  )}

                  {isSelected && needsEmail && (
                    <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-dark-700/80" onClick={(e) => e.stopPropagation()}>
                      <TextField
                        label="Destination Email Address"
                        placeholder="admin@ariitimarket.com"
                        type="email"
                        value={emailDest}
                        onChange={(e) => setEmailDest(e.target.value)}
                        error={!emailDest.trim() ? 'Valid email address is required' : undefined}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-5 border-t border-slate-200 dark:border-dark-700 flex items-center gap-3">
            <Button
              variant="primary"
              disabled={
                loading ||
                !method ||
                (method === 'SMS' && !phoneNumber.trim()) ||
                (method === 'EMAIL' && !emailDest.trim())
              }
              onClick={() => method && handleChooseMethod(method)}
              loading={loading}
            >
              Continue
            </Button>
            <Button
              variant="outline"
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
      <div className="w-full max-w-2xl mx-auto">
        <Card className="p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1.5">
              Set up {getMethodLabel(method!)}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {method === 'TOTP'
                ? 'Scan the QR code below using your authenticator application (Google Authenticator, Microsoft Authenticator, or Authy), then enter the 6-digit confirmation code.'
                : method === 'EMAIL'
                ? 'A 6-digit verification code has been dispatched to your email address. Enter the code below to complete setup.'
                : 'A 6-digit verification code has been dispatched to your phone number via SMS. Enter the code below to complete setup.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 text-sm flex items-start gap-2.5">
              <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5 text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {method === 'TOTP' && qrCode && (
            <div className="mb-6 flex flex-col items-center">
              <div className="w-48 h-48 bg-white dark:bg-white rounded-xl p-3 border border-slate-200 dark:border-dark-600 shadow-sm flex items-center justify-center">
                <img src={qrCode} alt="TOTP QR Code" className="w-full h-full object-contain" />
              </div>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 text-center max-w-sm">
                Open your authenticator app, tap <span className="font-semibold text-slate-700 dark:text-slate-300">+</span> or <span className="font-semibold text-slate-700 dark:text-slate-300">Add Account</span>, and scan the QR code.
              </p>
            </div>
          )}

          {tempOTP && (
            <div className="mb-6 p-3.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs md:text-sm flex items-center gap-3">
              <FontAwesomeIcon icon={faCircleInfo} className="text-blue-600 dark:text-blue-400 text-sm flex-shrink-0" />
              <span>
                Demo Environment Passcode: <strong className="font-mono font-bold tracking-wider">{tempOTP}</strong>
              </span>
            </div>
          )}

          <div className="max-w-xs mx-auto mb-6">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 text-center">
              Enter 6-Digit Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full h-12 text-center font-mono text-2xl font-bold tracking-[0.35em] border border-slate-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-primary-dark transition-all"
              autoFocus
            />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-dark-700 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setCode('');
                setError('');
                setStep('choose-method');
              }}
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              Change Method
            </Button>
            <Button
              variant="primary"
              disabled={loading || code.length !== 6}
              onClick={handleVerifySetup}
              loading={loading}
            >
              Verify & Enable
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Step 3: Backup Codes UI
  if (step === 'backup') {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <Card className="p-6 md:p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
              <FontAwesomeIcon icon={faShieldHalved} className="text-xl" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1.5">
              Save Your Backup Codes
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Store these single-use recovery codes in a secure password manager or physical safe. They provide account access if you lose your authentication device.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 text-sm flex items-start gap-2.5">
              <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5 text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs md:text-sm flex items-start gap-2.5 mb-6">
            <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span>Each backup code can only be used once. Keep them confidential and never share them.</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-4 rounded-xl bg-slate-50 dark:bg-dark-900/70 border border-slate-200 dark:border-dark-700 mb-6 font-mono text-sm">
            {backupCodes.map((backupCode, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-white dark:bg-dark-800 border border-slate-200/80 dark:border-dark-700"
              >
                <span className="text-slate-800 dark:text-slate-200 font-semibold tracking-wider">
                  <span className="text-slate-400 dark:text-slate-500 mr-2 text-xs select-none">
                    {String(i + 1).padStart(2, '0')}.
                  </span>
                  {backupCode.code}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(backupCode.code, i)}
                  className="p-1 text-slate-400 hover:text-primary-dark dark:hover:text-primary-dark transition-colors"
                  title="Copy code"
                >
                  <FontAwesomeIcon
                    icon={copiedIndex === i ? faCheck : faCopy}
                    className={`text-xs ${copiedIndex === i ? 'text-primary-dark' : ''}`}
                  />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <Button
              variant="outline"
              onClick={() => {
                const text = backupCodes.map((b) => b.code).join('\n');
                const element = document.createElement('a');
                element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`);
                element.setAttribute('download', 'ariiti-admin-2fa-backup-codes.txt');
                element.style.display = 'none';
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
              }}
              className="text-xs md:text-sm"
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2" />
              Download Codes
            </Button>
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="text-xs md:text-sm"
            >
              <FontAwesomeIcon icon={faPrint} className="mr-2" />
              Print Codes
            </Button>
          </div>

          <Button
            variant="primary"
            onClick={handleConfirmBackupCodes}
            className="w-full"
          >
            <FontAwesomeIcon icon={faCheck} className="mr-2" />
            I Have Saved My Backup Codes
          </Button>
        </Card>
      </div>
    );
  }

  // Step 4: Success UI
  if (step === 'success') {
    return (
      <div className="w-full max-w-xl mx-auto">
        <Card className="p-6 md:p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faCircleCheck} className="text-2xl" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Two-Factor Authentication Enabled
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Your administrator account is now protected with two-factor authentication ({getMethodLabel(method!)}).
          </p>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-900/60 border border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-300 text-xs md:text-sm mb-6 text-left">
            <p className="font-semibold text-slate-900 dark:text-white mb-1">What to expect next:</p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Upon your next sign-in, you will be prompted for your standard credentials followed by a 6-digit one-time code from your chosen verification method.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => (onComplete ? onComplete() : navigate('/settings/security'))}
            className="w-full"
          >
            Back to Security Settings
          </Button>
        </Card>
      </div>
    );
  }

  return null;
}

export default TwoFactorSetup;
