import { TwoFactorSettings } from '@/components/TwoFactorSettings';
import { useLocalization } from '@/i18n/I18nProvider';

export function SecuritySettingsPage() {
  const { t } = useLocalization();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold dark:text-white">
          {t('Security Settings')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {t('Manage your account security and authentication methods')}
        </p>
      </div>

      <section>
        <TwoFactorSettings />
      </section>
    </div>
  );
}
