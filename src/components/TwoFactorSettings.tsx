/**
 * 2FA Settings Component
 * Allows administrators to review status, enable, disable, and manage backup codes
 * Matches Ariiti Admin design system tokens, typography, and dark mode.
 */

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldHalved,
  faRotateRight,
  faTriangleExclamation,
  faCheck,
  faArrowLeft,
  faLock,
} from '@fortawesome/free-solid-svg-icons';
import { getAccessToken } from '@/utils/auth-storage';
import { http } from '@/services/client/httpClient';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PasswordField } from '@/components/forms/PasswordField';
import { Spinner } from '@/components/common/Spinner';
import { TwoFactorSetup } from './TwoFactorSetup';

interface TwoFAStatus {
  enabled: boolean;
  type?: 'TOTP' | 'EMAIL' | 'SMS';
  phoneNumber?: string;
  setupAt?: string;
  backupCodesRemaining?: number;
}

interface TwoFactorSettingsProps {
  onSettingsUpdate?: () => void;
}

export function TwoFactorSettings({ onSettingsUpdate }: TwoFactorSettingsProps) {
  const [status, setStatus] = useState<TwoFAStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [password, setPassword] = useState('');

  const fetchStatus = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const data = await http.get<TwoFAStatus>('/user/2fa/status', { authenticated: true });
      if (data) {
        setStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch 2FA status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleDisable = async () => {
    if (!password) {
      setError('Please enter your administrator password to disable 2FA');
      return;
    }

    setDisabling(true);
    setError('');
    setSuccess('');

    try {
      const token = getAccessToken();
      if (!token) {
        setError('Authentication required');
        setDisabling(false);
        return;
      }

      await http.post(
        '/user/2fa/disable',
        { password },
        { authenticated: true }
      );

      setStatus({ enabled: false });
      setPassword('');
      setSuccess('Two-factor authentication has been disabled successfully.');
      onSettingsUpdate?.();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to disable 2FA';
      console.error('Disable error:', errorMsg);
      setError(errorMsg);
    } finally {
      setDisabling(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    setRegenerating(true);
    setError('');
    setSuccess('');
    try {
      const token = getAccessToken();
      if (!token) {
        setError('Authentication required');
        setRegenerating(false);
        return;
      }

      await http.post(
        '/user/2fa/backup-codes/regenerate',
        {},
        { authenticated: true }
      );

      setSuccess('New backup codes generated successfully.');
      await fetchStatus();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to regenerate backup codes';
      console.error('Regenerate error:', errorMsg);
      setError(errorMsg);
    } finally {
      setRegenerating(false);
    }
  };

  const getMethodName = (type?: string) => {
    switch (type) {
      case 'TOTP':
        return 'Authenticator App (TOTP)';
      case 'EMAIL':
        return 'Email OTP Verification';
      case 'SMS':
        return 'SMS Text Verification';
      default:
        return type || 'Configured Method';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="md" />
        <span className="ml-3 text-sm text-slate-500 dark:text-slate-400">Loading security configuration...</span>
      </div>
    );
  }

  if (showSetup) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowSetup(false);
            fetchStatus();
          }}
          className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Back to Security Settings
        </Button>
        <TwoFactorSetup
          onComplete={() => {
            setShowSetup(false);
            fetchStatus();
            onSettingsUpdate?.();
          }}
          onCancel={() => {
            setShowSetup(false);
            fetchStatus();
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl space-y-6">
      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 text-sm flex items-start gap-2.5">
          <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-sm flex items-start gap-2.5">
          <FontAwesomeIcon icon={faCheck} className="mt-0.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {status?.enabled ? (
        <div className="space-y-6">
          {/* Active Status Card */}
          <Card className="p-6 md:p-8">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <FontAwesomeIcon icon={faShieldHalved} className="text-lg" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Two-Factor Authentication
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    High security active for your administrative access
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Enabled & Protected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-dark-900/50 border border-slate-200 dark:border-dark-700 mb-6">
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                  Primary Verification Method
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {getMethodName(status.type)}
                </span>
                {status.phoneNumber && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                    Phone: {status.phoneNumber}
                  </span>
                )}
              </div>

              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                  Emergency Backup Codes
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {status.backupCodesRemaining !== undefined
                    ? `${status.backupCodesRemaining} code${status.backupCodesRemaining === 1 ? '' : 's'} remaining`
                    : 'Active'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-dark-700 flex-wrap">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Need fresh recovery codes? Regenerating will invalidate any previous unused codes.
              </p>
              <Button
                variant="outline"
                size="sm"
                loading={regenerating}
                onClick={handleRegenerateBackupCodes}
              >
                <FontAwesomeIcon icon={faRotateRight} className="mr-2" />
                Regenerate Backup Codes
              </Button>
            </div>
          </Card>

          {/* Danger Zone: Disable 2FA */}
          <Card className="p-6 md:p-8 border-red-200/80 dark:border-red-950/60">
            <h3 className="text-base font-semibold text-red-600 dark:text-red-400 mb-1 flex items-center gap-2">
              <FontAwesomeIcon icon={faTriangleExclamation} />
              Disable Two-Factor Authentication
            </h3>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mb-4">
              Disabling two-factor authentication lowers account defense. To confirm, enter your administrator password below.
            </p>

            <div className="max-w-md space-y-4">
              <PasswordField
                label="Admin Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password to confirm"
              />
              <Button
                variant="danger"
                size="sm"
                disabled={!password || disabling}
                onClick={handleDisable}
                loading={disabling}
              >
                Disable 2FA Protection
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        /* Disabled State */
        <Card className="p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faLock} className="text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Two-Factor Authentication
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Protect sensitive marketplace resources, vendor finances, and administrative controls
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Not Enabled
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-900/50 border border-slate-200 dark:border-dark-700 mb-6">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
              Security Protections Included:
            </h4>
            <ul className="space-y-2 text-xs md:text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <FontAwesomeIcon icon={faCheck} className="text-emerald-500 mt-1 flex-shrink-0" />
                <span>Protects your administrative privileges even if your password is compromised.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <FontAwesomeIcon icon={faCheck} className="text-emerald-500 mt-1 flex-shrink-0" />
                <span>Supports Authenticator Apps (Google Authenticator, Microsoft Authenticator), Email OTP, and SMS text message.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <FontAwesomeIcon icon={faCheck} className="text-emerald-500 mt-1 flex-shrink-0" />
                <span>Provides single-use offline recovery backup codes for emergency device recovery.</span>
              </li>
            </ul>
          </div>

          <Button
            variant="primary"
            onClick={() => setShowSetup(true)}
          >
            <FontAwesomeIcon icon={faShieldHalved} className="mr-2" />
            Enable Two-Factor Authentication
          </Button>
        </Card>
      )}
    </div>
  );
}

export default TwoFactorSettings;
