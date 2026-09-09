import { useEffect, useState } from 'react';
import { settingsService } from '@/services/settings.service';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { TextField } from '@/components/forms/TextField';
import { ErrorState } from '@/components/common/ErrorState';
import { PageLoader } from '@/components/common/PageLoader';
import type { SystemSettings } from '@/types';

export function SystemSettingsPage() {
  const { t } = useLocalization();
  const { showToast } = useToast();

  const { data, loading, error, refetch } = useAsync(
    () => settingsService.getSystem(),
    []
  );

  const [form, setForm] = useState<SystemSettings>({
    underMaintenance: false,
    forceUpdateEnabled: false,
    maxRetryAttempts: 3,
    requestTimeoutMs: 30000,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm(data as SystemSettings);
  }, [data]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsService.updateSystem(form);
      showToast({ type: 'success', message: t('Settings saved') });
      refetch();
    } catch (err) {
      showToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Could not save',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('System Settings')}
        description={t('Control system behavior and limits')}
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField
              label={t('Max Retry Attempts')}
              type="number"
              value={form.maxRetryAttempts}
              onChange={(e) =>
                setForm({ ...form, maxRetryAttempts: Number(e.target.value) })
              }
              name="maxRetryAttempts"
            />
            <TextField
              label={t('Request Timeout (ms)')}
              type="number"
              value={form.requestTimeoutMs}
              onChange={(e) =>
                setForm({ ...form, requestTimeoutMs: Number(e.target.value) })
              }
              name="requestTimeoutMs"
            />
          </div>

          <label className="flex cursor-pointer items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-200">
              {t('Under Maintenance')}
            </span>
            <input
              type="checkbox"
              checked={form.underMaintenance}
              onChange={() =>
                setForm({ ...form, underMaintenance: !form.underMaintenance })
              }
              className="h-4 w-4 rounded border-gray-300 text-primary-dark focus:ring-primary-dark"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-200">
              {t('Force Update Enabled')}
            </span>
            <input
              type="checkbox"
              checked={form.forceUpdateEnabled}
              onChange={() =>
                setForm({
                  ...form,
                  forceUpdateEnabled: !form.forceUpdateEnabled,
                })
              }
              className="h-4 w-4 rounded border-gray-300 text-primary-dark focus:ring-primary-dark"
            />
          </label>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={saving} loading={saving}>
              {saving ? t('Saving...') : t('Save')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}