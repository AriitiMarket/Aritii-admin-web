import { useLocalization } from '@/i18n/I18nProvider';
import { Button } from '@/components/common/Button';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  const { t } = useLocalization();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <p className="heading-1 text-gray-200 dark:text-dark-600" aria-hidden="true">
        404
      </p>
      <h1 className="heading-4 dark:text-white">
        {t('Page not found')}
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t('The page you are looking for does not exist')}
      </p>
      <Link to="/home">
        <Button variant="outline">{t('Back to dashboard')}</Button>
      </Link>
    </div>
  );
}