import { catalogService } from '@/services/catalog.service';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { Card } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';

export function SectorsPage() {
  const { t } = useLocalization();
  const { data, loading, error, refetch } = useAsync(
    () => catalogService.listSectors(),
    []
  );

  return (
    <div>
      <PageHeader
        title={t('Sectors')}
        description={t('Marketplace sectors governing admin access')}
      />

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : loading ? (
        <p className="py-6 text-center text-sm text-gray-400">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(data ?? []).map((sector) => (
            <Card key={sector.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="heading-5 dark:text-white">{sector.name}</p>
                <StatusBadge label={sector.status} />
              </div>
              {sector.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {sector.description}
                </p>
              )}
              <p className="text-xs text-gray-400">Code: {sector.code}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}