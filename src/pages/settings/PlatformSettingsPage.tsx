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
import type { PlatformSettings } from '@/types';

export function PlatformSettingsPage() {
  const { t } = useLocalization();
  const { showToast } = useToast();

  const { data, loading, error, refetch } = useAsync(
    () => settingsService.getPlatform(),
    []
  );

  const [form, setForm] = useState<PlatformSettings>({
    currency: '',
    currencySymbol: '',
    deliveryRate: 0,
    commissionRate: 0,
    defaultSector: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm(data as PlatformSettings);
  }, [data]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsService.updatePlatform(form);
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
        title={t('Platform Settings')}
        description={t('Configure marketplace-wide defaults')}
      />

      <Card>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField
            label={t('Currency')}
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            name="currency"
          />
          <TextField
            label={t('Currency Symbol')}
            value={form.currencySymbol}
            onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })}
            name="currencySymbol"
          />
          <TextField
            label={t('Delivery Rate')}
            type="number"
            value={form.deliveryRate}
            onChange={(e) =>
              setForm({ ...form, deliveryRate: Number(e.target.value) })
            }
            name="deliveryRate"
          />
          <TextField
            label={t('Commission Rate')}
            type="number"
            value={form.commissionRate}
            onChange={(e) =>
              setForm({ ...form, commissionRate: Number(e.target.value) })
            }
            name="commissionRate"
          />
          <TextField
            label={t('Default Sector')}
            value={form.defaultSector}
            onChange={(e) => setForm({ ...form, defaultSector: e.target.value })}
            name="defaultSector"
            className="md:col-span-2"
          />

          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={saving} loading={saving}>
              {saving ? t('Saving...') : t('Save')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}