import { PageHeader } from '@/components/common/PageHeader';
import { TwoFactorSettings } from '@/components/TwoFactorSettings';
import { useLocalization } from '@/i18n/I18nProvider';

export function SecuritySettingsPage() {
  const { t } = useLocalization();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('Security Settings')}
        description={t('Manage your account security and authentication methods')}
      />

      <section>
        <TwoFactorSettings />
      </section>
    </div>
  );
}
