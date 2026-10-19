/**
 * 2FA Settings Component
 * Allows users to enable, disable, and manage 2FA
 */

import { useState, useEffect } from 'react';
import { getAccessToken } from '@/utils/auth-storage';
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const getApiGateway = (): string => {
    const env = import.meta.env.VITE_API_GATEWAY_URL;
    console.log('VITE_API_GATEWAY_URL:', env); // Debug log
    if (!env || env.trim() === '') {
      throw new Error('API Gateway URL is empty - check .env.local has VITE_API_GATEWAY_URL');
    }
    return env;
  };

  const fetchStatus = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      let gateway: string;
      try {
        gateway = getApiGateway();
      } catch (err) {
        console.error('Gateway error:', err);
        setLoading(false);
        return;
      }

      const response = await fetch(`${gateway}/user/2fa/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
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
      setError('Please enter your password to disable 2FA');
      return;
    }

    setDisabling(true);
    setError('');
    setSuccess('');

    try {
      // Check gateway URL FIRST
      let gateway: string;
      try {
        gateway = getApiGateway();
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'API Gateway URL not configured';
        setError(errMsg);
        setDisabling(false);
        return;
      }

      const token = getAccessToken();
      if (!token) {
        setError('Authentication required');
        setDisabling(false);
        return;
      }

      const response = await fetch(`${gateway}/user/2fa/disable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to disable 2FA');
        setDisabling(false);
        return;
      }

      setStatus({ enabled: false });
      setPassword('');
      setSuccess('2FA has been disabled');
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
    try {
      // Check gateway URL FIRST
      let gateway: string;
      try {
        gateway = getApiGateway();
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'API Gateway URL not configured';
        setError(errMsg);
        return;
      }

      const token = getAccessToken();
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`${gateway}/user/2fa/backup-codes/regenerate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to regenerate backup codes');
        return;
      }

      setSuccess('Backup codes regenerated successfully');
      fetchStatus();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to regenerate backup codes';
      console.error('Regenerate error:', errorMsg);
      setError(errorMsg);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center text-gray-500">Loading 2FA settings...</div>
      </div>
    );
  }

  if (showSetup) {
    return (
      <div>
        <button
          onClick={() => {
            setShowSetup(false);
            fetchStatus();
          }}
          className="mb-4 text-blue-500 hover:text-blue-700 text-sm underline"
        >
          ← Back to Settings
        </button>
        <TwoFactorSetup />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold mb-6">Two-Factor Authentication</h2>

        {/* Status Section */}
        {status?.enabled ? (
          <div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 font-semibold">✓ 2FA is enabled</p>
              <div className="text-sm text-green-700 mt-2 space-y-1">
                <p>Method: <span className="font-mono">{status.type}</span></p>
                {status.phoneNumber && <p>Phone: {status.phoneNumber}</p>}
                {status.backupCodesRemaining !== undefined && (
                  <p>Backup codes remaining: {status.backupCodesRemaining}</p>
                )}
              </div>
            </div>

            {/* Disable Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Disable 2FA</h3>
              <p className="text-gray-600 text-sm mb-4">
                To disable 2FA, enter your password for confirmation.
              </p>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <button
                onClick={handleDisable}
                disabled={!password || disabling}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                {disabling ? 'Disabling...' : 'Disable 2FA'}
              </button>
            </div>

            {/* Manage Backup Codes */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">Backup Codes</h3>
              <p className="text-gray-600 text-sm mb-4">
                Backup codes can be used if you lose access to your authenticator device or phone.
              </p>
              <button
                onClick={handleRegenerateBackupCodes}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
              >
                Regenerate Backup Codes
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 font-semibold">⚠ 2FA is not enabled</p>
              <p className="text-sm text-yellow-700 mt-2">
                Enable two-factor authentication to protect your account.
              </p>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {success}
              </div>
            )}

            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h3 className="font-semibold mb-3">Benefits:</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✓ Protect your account with an additional security layer</li>
                <li>✓ Choose your preferred method: Authenticator app, Email, or SMS</li>
                <li>✓ Backup codes for account recovery</li>
              </ul>
            </div>

            <button
              onClick={() => setShowSetup(true)}
              className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 font-semibold"
            >
              Enable 2FA
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TwoFactorSettings;
