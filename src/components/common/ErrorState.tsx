import { useLocalization } from '@/i18n/I18nProvider';
import { Button } from '@/components/common/Button';

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const { t } = useLocalization();
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-6 py-10 text-center dark:border-red-900 dark:bg-red-950/30"
    >
      <div className="text-3xl" aria-hidden="true">
        ⚠️
      </div>
      <p className="text-sm font-medium text-red-700 dark:text-red-300">
        {message}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={onRetry}
        >
          {t('Retry') || 'Retry'}
        </Button>
      )}
    </div>
  );
}