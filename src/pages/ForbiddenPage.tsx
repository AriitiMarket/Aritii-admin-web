import { useLocalization } from '@/i18n/I18nProvider';
import { Button } from '@/components/common/Button';
import { Link } from 'react-router-dom';

export function ForbiddenPage() {
  const { t } = useLocalization();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <p className="heading-1 text-gray-200 dark:text-dark-600" aria-hidden="true">
        403
      </p>
      <h1 className="heading-4 dark:text-white">{t('Route access denied')}</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t('You do not have permission to view this page')}
      </p>
      <Link to="/home">
        <Button variant="outline">{t('Back to dashboard')}</Button>
      </Link>
    </div>
  );
}