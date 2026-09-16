import { useEffect, useState } from 'react';
import { settingsService } from '@/services/settings.service';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { TextField } from '@/components/forms/TextField';
import { SelectField } from '@/components/forms/SelectField';
import { ErrorState } from '@/components/common/ErrorState';
import { PageLoader } from '@/components/common/PageLoader';
import type { SystemSettings } from '@/types';

export function SystemSettingsPage() {
  const { t } = useLocalization();
  const { showToast } = useToast();
  const { data, loading, error, refetch } = useAsync(() => settingsService.getSystem(), []);
  const [form, setForm] = useState<SystemSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm(data as SystemSettings);
  }, [data]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!form) return <PageLoader />;

  function update<K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await settingsService.updateSystem(form);
      showToast({ type: 'success', message: t('System settings saved') });
      refetch();
    } catch (err) {
      showToast({ type: 'error', message: err instanceof Error ? err.message : 'Could not save' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('System Settings')} description={t('Control system behavior, security, and limits')} />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('Maintenance')}</h3>
          <label className="flex cursor-pointer items-center justify-between py-1">
            <span className="text-sm text-gray-700 dark:text-gray-200">{t('Maintenance Mode')}</span>
            <input type="checkbox" checked={form.maintenanceMode} onChange={() => update('maintenanceMode', !form.maintenanceMode)} className="h-4 w-4 rounded border-gray-300" />
          </label>
          {form.maintenanceMode && (
            <TextField label={t('Maintenance Message')} value={form.maintenanceMessage} onChange={(e) => update('maintenanceMessage', e.target.value)} name="maintenanceMessage" className="mt-3" />
          )}
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('Security')}</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField label={t('Max Login Attempts')} type="number" value={form.maxLoginAttempts} onChange={(e) => update('maxLoginAttempts', Number(e.target.value))} name="maxLoginAttempts" />
            <TextField label={t('Lockout Duration (minutes)')} type="number" value={form.lockoutDurationMinutes} onChange={(e) => update('lockoutDurationMinutes', Number(e.target.value))} name="lockoutDurationMinutes" />
            <TextField label={t('Password Min Length')} type="number" value={form.passwordMinLength} onChange={(e) => update('passwordMinLength', Number(e.target.value))} name="passwordMinLength" />
            <TextField label={t('Session Timeout (minutes)')} type="number" value={form.sessionTimeoutMinutes} onChange={(e) => update('sessionTimeoutMinutes', Number(e.target.value))} name="sessionTimeoutMinutes" />
          </div>
          <div className="mt-3 space-y-2">
            <label className="flex cursor-pointer items-center justify-between py-1">
              <span className="text-sm text-gray-700 dark:text-gray-200">{t('Require Email Verification')}</span>
              <input type="checkbox" checked={form.requireEmailVerification} onChange={() => update('requireEmailVerification', !form.requireEmailVerification)} className="h-4 w-4 rounded border-gray-300" />
            </label>
            <label className="flex cursor-pointer items-center justify-between py-1">
              <span className="text-sm text-gray-700 dark:text-gray-200">{t('Require Phone Verification')}</span>
              <input type="checkbox" checked={form.requirePhoneVerification} onChange={() => update('requirePhoneVerification', !form.requirePhoneVerification)} className="h-4 w-4 rounded border-gray-300" />
            </label>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('API & Performance')}</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField label={t('Max Requests Per Minute')} type="number" value={form.maxRequestsPerMinute} onChange={(e) => update('maxRequestsPerMinute', Number(e.target.value))} name="maxRequestsPerMinute" />
            <TextField label={t('Request Timeout (ms)')} type="number" value={form.requestTimeoutMs} onChange={(e) => update('requestTimeoutMs', Number(e.target.value))} name="requestTimeoutMs" />
            <TextField label={t('Max Retry Attempts')} type="number" value={form.maxRetryAttempts} onChange={(e) => update('maxRetryAttempts', Number(e.target.value))} name="maxRetryAttempts" />
            <SelectField label={t('Logging Level')} value={form.loggingLevel} options={[
              { value: 'error', label: 'Error' },
              { value: 'warn', label: 'Warning' },
              { value: 'info', label: 'Info' },
              { value: 'debug', label: 'Debug' },
            ]} onChange={(e) => update('loggingLevel', e.target.value)} name="loggingLevel" />
          </div>
          <div className="mt-3 space-y-2">
            <label className="flex cursor-pointer items-center justify-between py-1">
              <span className="text-sm text-gray-700 dark:text-gray-200">{t('API Rate Limiting')}</span>
              <input type="checkbox" checked={form.apiRateLimitEnabled} onChange={() => update('apiRateLimitEnabled', !form.apiRateLimitEnabled)} className="h-4 w-4 rounded border-gray-300" />
            </label>
            <label className="flex cursor-pointer items-center justify-between py-1">
              <span className="text-sm text-gray-700 dark:text-gray-200">{t('Force Update Enabled')}</span>
              <input type="checkbox" checked={form.forceUpdateEnabled} onChange={() => update('forceUpdateEnabled', !form.forceUpdateEnabled)} className="h-4 w-4 rounded border-gray-300" />
            </label>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} loading={saving}>{saving ? t('Saving...') : t('Save')}</Button>
        </div>
      </form>
    </div>
  );
}
