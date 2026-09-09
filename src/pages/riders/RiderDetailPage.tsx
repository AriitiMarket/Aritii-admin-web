import { Link, useParams } from 'react-router-dom';
import { ridersService } from '@/services/riders.service';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { Card } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { PageLoader } from '@/components/common/PageLoader';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate } from '@/utils/format';

export function RiderDetailPage() {
  const { riderId } = useParams<{ riderId: string }>();
  const { t } = useLocalization();
  const { data: rider, loading, error, refetch } = useAsync(
    () => ridersService.get(riderId ?? ''),
    [riderId]
  );

  if (loading) return <PageLoader label={t('Loading')} />;
  if (error || !rider) {
    return <ErrorState message={error ?? 'Not found'} onRetry={refetch} />;
  }

  return (
    <div>
      <PageHeader
        title={rider.name}
        description={rider.email}
        actions={
          <Link to="/riders">
            <Button variant="outline">{t('Back to riders')}</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center gap-3 text-center">
          <Avatar name={rider.name} size="lg" />
          <p className="heading-5 dark:text-white">{rider.name}</p>
          <StatusBadge label={rider.status} />
        </Card>

        <Card className="lg:col-span-2">
          <p className="card-h1 mb-4 dark:text-white">{t('Details')}</p>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <dt className="text-gray-500 dark:text-gray-400">{t('Email')}</dt>
            <dd className="text-gray-800 dark:text-gray-100">{rider.email ?? '—'}</dd>
            <dt className="text-gray-500 dark:text-gray-400">{t('Phone')}</dt>
            <dd className="text-gray-800 dark:text-gray-100">{rider.phone ?? '—'}</dd>
            <dt className="text-gray-500 dark:text-gray-400">Vehicle</dt>
            <dd className="text-gray-800 dark:text-gray-100">
              {rider.vehicleType ?? '—'}
            </dd>
            <dt className="text-gray-500 dark:text-gray-400">{t('Sectors')}</dt>
            <dd className="text-gray-800 dark:text-gray-100">
              {rider.sector || 'All'}
            </dd>
            <dt className="text-gray-500 dark:text-gray-400">Zone</dt>
            <dd className="text-gray-800 dark:text-gray-100">
              {rider.zone?.name ?? '—'}
            </dd>
            <dt className="text-gray-500 dark:text-gray-400">Created</dt>
            <dd className="text-gray-800 dark:text-gray-100">
              {formatDate(rider.createdAt)}
            </dd>
          </dl>
        </Card>
      </div>
    </div>
  );
}