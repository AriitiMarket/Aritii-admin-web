import { useNavigate } from 'react-router-dom';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';

export function AdminNewPage() {
  const { t } = useLocalization();
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        title={t('New Admin')}
        description={t(
          'Admin provisioning is not available yet — grant an existing account the ADMIN role instead'
        )}
      />

      <div className="max-w-2xl rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/30">
        <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-200">
          {t('Administrator creation is unavailable')}
        </h2>
        <p className="mt-2 text-sm text-amber-800 dark:text-amber-300">
          {t(
            'The current Identity API does not expose a verified administrator-provisioning endpoint. No account was created.'
          )}
        </p>
        <p className="mt-2 text-sm text-amber-800 dark:text-amber-300">
          {t(
            'Use the existing user and role-management workflows only after the Identity owner confirms the approved provisioning process.'
          )}
        </p>
        <div className="mt-4">
          <Button type="button" variant="outline" onClick={() => navigate('/users?tab=admins')}>
            {t('Back to administrators')}
          </Button>
        </div>
      </div>
    </div>
  );
}