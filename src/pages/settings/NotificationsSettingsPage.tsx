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

export function NotificationsSettingsPage() {
  const { t } = useLocalization();
  const { showToast } = useToast();
  const { data, loading, error, refetch } = useAsync(() => settingsService.getNotifications(), []);
  const [form, setForm] = useState<NotificationsSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm(data as NotificationsSettings);
  }, [data]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!form) return <PageLoader />;

  function toggle(key: keyof NotificationsSettings) {
    setForm((prev) => prev ? { ...prev, [key]: !prev[key] } : prev);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await settingsService.updateNotifications(form);
      showToast({ type: 'success', message: t('Notification settings saved') });
      refetch();
    } catch (err) {
      showToast({ type: 'error', message: err instanceof Error ? err.message : 'Could not save' });
    } finally {
      setSaving(false);
    }
  }

  const channels: { key: keyof NotificationsSettings; label: string }[] = [
    { key: 'emailNotificationsEnabled', label: t('Email Notifications') },
    { key: 'smsNotificationsEnabled', label: t('SMS Notifications') },
    { key: 'pushNotificationsEnabled', label: t('Push Notifications') },
  ];

  const orderEvents: { key: keyof NotificationsSettings; label: string }[] = [
    { key: 'orderCreated', label: t('Order Created') },
    { key: 'orderDelivered', label: t('Order Delivered') },
    { key: 'orderCancelled', label: t('Order Cancelled') },
    { key: 'riderAssigned', label: t('Rider Assigned') },
  ];

  const platformEvents: { key: keyof NotificationsSettings; label: string }[] = [
    { key: 'disputeRaised', label: t('Dispute Raised') },
    { key: 'reviewSubmitted', label: t('Review Submitted') },
    { key: 'sellerApproved', label: t('Seller Approved') },
    { key: 'sellerRejected', label: t('Seller Rejected') },
    { key: 'newSellerApplication', label: t('New Seller Application') },
    { key: 'lowStockAlert', label: t('Low Stock Alert') },
  ];

  const reports: { key: keyof NotificationsSettings; label: string }[] = [
    { key: 'dailyDigestEnabled', label: t('Daily Digest') },
    { key: 'weeklyReportEnabled', label: t('Weekly Report') },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t('Notification Settings')} description={t('Configure notification channels and events')} />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('Channels')}</h3>
          <div className="space-y-2">
            {channels.map((f) => (
              <label key={f.key} className="flex cursor-pointer items-center justify-between py-1">
                <span className="text-sm text-gray-700 dark:text-gray-200">{f.label}</span>
                <input type="checkbox" checked={form[f.key] as boolean} onChange={() => toggle(f.key)} className="h-4 w-4 rounded border-gray-300" />
              </label>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('Order Events')}</h3>
          <div className="space-y-2">
            {orderEvents.map((f) => (
              <label key={f.key} className="flex cursor-pointer items-center justify-between py-1">
                <span className="text-sm text-gray-700 dark:text-gray-200">{f.label}</span>
                <input type="checkbox" checked={form[f.key] as boolean} onChange={() => toggle(f.key)} className="h-4 w-4 rounded border-gray-300" />
              </label>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('Platform Events')}</h3>
          <div className="space-y-2">
            {platformEvents.map((f) => (
              <label key={f.key} className="flex cursor-pointer items-center justify-between py-1">
                <span className="text-sm text-gray-700 dark:text-gray-200">{f.label}</span>
                <input type="checkbox" checked={form[f.key] as boolean} onChange={() => toggle(f.key)} className="h-4 w-4 rounded border-gray-300" />
              </label>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('Reports')}</h3>
          <div className="space-y-2">
            {reports.map((f) => (
              <label key={f.key} className="flex cursor-pointer items-center justify-between py-1">
                <span className="text-sm text-gray-700 dark:text-gray-200">{f.label}</span>
                <input type="checkbox" checked={form[f.key] as boolean} onChange={() => toggle(f.key)} className="h-4 w-4 rounded border-gray-300" />
              </label>
            ))}
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} loading={saving}>{saving ? t('Saving...') : t('Save')}</Button>
        </div>
      </form>
    </div>
  );
}
