import { useEffect, useState } from 'react';
import { settingsService } from '@/services/settings.service';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { PageLoader } from '@/components/common/PageLoader';
import type { NotificationsSettings } from '@/types';

const DEFAULTS: NotificationsSettings = {
  orderCreated: true,
  orderDelivered: true,
  riderAssigned: true,
  disputeRaised: true,
  reviewSubmitted: false,
};

export function NotificationsSettingsPage() {
  const { t } = useLocalization();
  const { showToast } = useToast();

  const { data, loading, error, refetch } = useAsync(
    () => settingsService.getNotifications(),
    []
  );

  const [form, setForm] = useState<NotificationsSettings>(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm(data as NotificationsSettings);
  }, [data]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsService.updateNotifications(form);
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

  function toggle(key: keyof NotificationsSettings) {
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const fields: { key: keyof NotificationsSettings; label: string }[] = [
    { key: 'orderCreated', label: t('Order Created') },
    { key: 'orderDelivered', label: t('Order Delivered') },
    { key: 'riderAssigned', label: t('Rider Assigned') },
    { key: 'disputeRaised', label: t('Dispute Raised') },
    { key: 'reviewSubmitted', label: t('Review Submitted') },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('Notification Settings')}
        description={t('Choose which events trigger notifications')}
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <label
              key={field.key}
              className="flex cursor-pointer items-center justify-between"
            >
              <span className="text-sm text-gray-700 dark:text-gray-200">
                {field.label}
              </span>
              <input
                type="checkbox"
                checked={form[field.key]}
                onChange={() => toggle(field.key)}
                className="h-4 w-4 rounded border-gray-300 text-primary-dark focus:ring-primary-dark"
              />
            </label>
          ))}

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