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
import type { PlatformSettings } from '@/types';

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between py-1">
      <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded border-gray-300 text-primary-dark focus:ring-primary-dark" />
    </label>
  );
}

export function PlatformSettingsPage() {
  const { t } = useLocalization();
  const { showToast } = useToast();
  const { data, loading, error, refetch } = useAsync(() => settingsService.getPlatform(), []);
  const [form, setForm] = useState<PlatformSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (data) {
      const d = data as any;
      setForm({
        ...d,
        features: d.features ?? {
          wishlistEnabled: false,
          reviewsEnabled: false,
          chatEnabled: false,
          promotionsEnabled: false,
          couponsEnabled: false,
          subscriptionsEnabled: false,
          multiVendorEnabled: false,
        },
      });
    }
  }, [data]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!form) return <PageLoader />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await settingsService.updatePlatform(form);
      showToast({ type: 'success', message: t('Settings saved successfully') });
      refetch();
    } catch (err) {
      showToast({ type: 'error', message: err instanceof Error ? err.message : 'Could not save settings' });
    } finally {
      setSaving(false);
    }
  }

  function update<K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  function updateFeature(key: keyof PlatformSettings['features']) {
    setForm((prev) => prev ? { ...prev, features: { ...(prev.features ?? {}), [key]: !prev.features?.[key] } } : prev);
  }

  const tabs = [
    { key: 'general', label: t('General') },
    { key: 'marketplace', label: t('Marketplace') },
    { key: 'registration', label: t('Registration') },
    { key: 'orders', label: t('Orders') },
    { key: 'delivery', label: t('Delivery') },
    { key: 'features', label: t('Features') },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('Platform Settings')}
        description={t('Configure marketplace-wide platform settings')}
        actions={<Button variant="outline" onClick={refetch}>{t('Refresh')}</Button>}
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-b-2 border-primary text-primary dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* General Tab */}
        {activeTab === 'general' && (
          <Card>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('General Information')}</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <TextField label={t('Platform Name')} value={form.platformName} onChange={(e) => update('platformName', e.target.value)} name="platformName" />
              <TextField label={t('Support Email')} type="email" value={form.supportEmail} onChange={(e) => update('supportEmail', e.target.value)} name="supportEmail" />
              <TextField label={t('Support Phone')} value={form.supportPhone} onChange={(e) => update('supportPhone', e.target.value)} name="supportPhone" />
              <TextField label={t('Platform Description')} value={form.platformDescription} onChange={(e) => update('platformDescription', e.target.value)} name="platformDescription" className="md:col-span-2" />
            </div>
          </Card>
        )}

        {/* Marketplace Tab */}
        {activeTab === 'marketplace' && (
          <Card>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('Marketplace Configuration')}</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SelectField label={t('Default Currency')} value={form.defaultCurrency} options={[
                { value: 'ETB', label: 'ETB - Ethiopian Birr' },
                { value: 'USD', label: 'USD - US Dollar' },
              ]} onChange={(e) => update('defaultCurrency', e.target.value)} name="defaultCurrency" />
              <TextField label={t('Commission Rate (%)')} type="number" value={form.commissionRate} onChange={(e) => update('commissionRate', Number(e.target.value))} name="commissionRate" />
              <TextField label={t('Tax Rate (%)')} type="number" value={form.taxRate} onChange={(e) => update('taxRate', Number(e.target.value))} name="taxRate" />
              <SelectField label={t('Seller Payout Schedule')} value={form.sellerPayoutSchedule} options={[
                { value: 'daily', label: t('Daily') },
                { value: 'weekly', label: t('Weekly') },
                { value: 'biweekly', label: t('Bi-weekly') },
                { value: 'monthly', label: t('Monthly') },
              ]} onChange={(e) => update('sellerPayoutSchedule', e.target.value)} name="sellerPayoutSchedule" />
            </div>
            <Toggle label={t('Marketplace Active')} checked={form.marketplaceActive} onChange={() => update('marketplaceActive', !form.marketplaceActive)} />
          </Card>
        )}

        {/* Registration Tab */}
        {activeTab === 'registration' && (
          <Card>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('Registration Settings')}</h3>
            <div className="space-y-2">
              <Toggle label={t('Open Registration')} checked={form.registrationOpen} onChange={() => update('registrationOpen', !form.registrationOpen)} />
              <Toggle label={t('Seller Registration Open')} checked={form.sellerRegistrationOpen} onChange={() => update('sellerRegistrationOpen', !form.sellerRegistrationOpen)} />
              <Toggle label={t('Rider Registration Open')} checked={form.riderRegistrationOpen} onChange={() => update('riderRegistrationOpen', !form.riderRegistrationOpen)} />
              <Toggle label={t('Auto-approve Shops')} checked={form.autoApproveShops} onChange={() => update('autoApproveShops', !form.autoApproveShops)} />
              <Toggle label={t('Auto-approve Riders')} checked={form.autoApproveRiders} onChange={() => update('autoApproveRiders', !form.autoApproveRiders)} />
            </div>
          </Card>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <Card>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('Order Configuration')}</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <TextField label={t('Min Order Amount')} type="number" value={form.minOrderAmount} onChange={(e) => update('minOrderAmount', Number(e.target.value))} name="minOrderAmount" />
              <TextField label={t('Max Order Amount')} type="number" value={form.maxOrderAmount} onChange={(e) => update('maxOrderAmount', Number(e.target.value))} name="maxOrderAmount" />
              <TextField label={t('Order Timeout (minutes)')} type="number" value={form.orderTimeoutMinutes} onChange={(e) => update('orderTimeoutMinutes', Number(e.target.value))} name="orderTimeoutMinutes" />
              <TextField label={t('Cancellation Window (minutes)')} type="number" value={form.cancellationWindowMinutes} onChange={(e) => update('cancellationWindowMinutes', Number(e.target.value))} name="cancellationWindowMinutes" />
              <TextField label={t('Refund Window (days)')} type="number" value={form.refundWindowDays} onChange={(e) => update('refundWindowDays', Number(e.target.value))} name="refundWindowDays" />
              <TextField label={t('Delivery Fee')} type="number" value={form.deliveryFee} onChange={(e) => update('deliveryFee', Number(e.target.value))} name="deliveryFee" />
            </div>
          </Card>
        )}

        {/* Delivery Tab */}
        {activeTab === 'delivery' && (
          <Card>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('Delivery Configuration')}</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <TextField label={t('Max Delivery Distance (km)')} type="number" value={form.maxDeliveryDistanceKm} onChange={(e) => update('maxDeliveryDistanceKm', Number(e.target.value))} name="maxDeliveryDistanceKm" />
              <TextField label={t('Express Delivery Multiplier')} type="number" value={form.expressDeliveryMultiplier} onChange={(e) => update('expressDeliveryMultiplier', Number(e.target.value))} name="expressDeliveryMultiplier" />
              <TextField label={t('Default Delivery Zone')} value={form.defaultDeliveryZone} onChange={(e) => update('defaultDeliveryZone', e.target.value)} name="defaultDeliveryZone" />
            </div>
          </Card>
        )}

        {/* Features Tab */}
        {activeTab === 'features' && (
          <Card>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('Feature Toggles')}</h3>
            <div className="space-y-2">
              <Toggle label={t('Wishlist')} checked={form.features?.wishlistEnabled ?? false} onChange={() => updateFeature('wishlistEnabled')} />
              <Toggle label={t('Reviews')} checked={form.features?.reviewsEnabled ?? false} onChange={() => updateFeature('reviewsEnabled')} />
              <Toggle label={t('Chat / Messaging')} checked={form.features?.chatEnabled ?? false} onChange={() => updateFeature('chatEnabled')} />
              <Toggle label={t('Promotions')} checked={form.features?.promotionsEnabled ?? false} onChange={() => updateFeature('promotionsEnabled')} />
              <Toggle label={t('Coupons')} checked={form.features?.couponsEnabled ?? false} onChange={() => updateFeature('couponsEnabled')} />
              <Toggle label={t('Subscriptions')} checked={form.features?.subscriptionsEnabled ?? false} onChange={() => updateFeature('subscriptionsEnabled')} />
              <Toggle label={t('Multi-Vendor')} checked={form.features?.multiVendorEnabled ?? false} onChange={() => updateFeature('multiVendorEnabled')} />
            </div>
          </Card>
        )}

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={saving} loading={saving}>
            {saving ? t('Saving...') : t('Save Settings')}
          </Button>
        </div>
      </form>
    </div>
  );
}
