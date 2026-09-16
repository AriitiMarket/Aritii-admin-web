import { Link, useParams } from 'react-router-dom';
import { storesService } from '@/services/stores.service';
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

export function StoreDetailPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { t } = useLocalization();
  const { data: store, loading, error, refetch } = useAsync(
    () => storesService.get(storeId ?? ''),
    [storeId]
  );

  if (loading) return <PageLoader label={t('Loading')} />;
  if (error || !store) {
    return <ErrorState message={error ?? 'Not found'} onRetry={refetch} />;
  }

  return (
    <div>
      <PageHeader
        title={store.name}
        description={store.address ?? (typeof store.sector === 'string' ? store.sector : store.sector?.name)}
        actions={
          <Link to="/stores">
            <Button variant="outline">{t('Back to stores')}</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center gap-3 text-center">
          <Avatar src={store.image} name={store.name} size="lg" />
          <p className="heading-5 dark:text-white">{store.name}</p>
          <StatusBadge label={store.status} />
          <p className="text-xs text-gray-400">
            {store.rating ? `${store.rating.toFixed(1)} ★` : '—'}
          </p>
        </Card>

        <Card className="lg:col-span-2">
          <p className="card-h1 mb-4 dark:text-white">{t('Details')}</p>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <dt className="text-gray-500 dark:text-gray-400">{t('Phone')}</dt>
            <dd className="text-gray-800 dark:text-gray-100">{store.phone ?? '—'}</dd>
            <dt className="text-gray-500 dark:text-gray-400">{t('Address')}</dt>
            <dd className="text-gray-800 dark:text-gray-100">{store.address ?? '—'}</dd>
            <dt className="text-gray-500 dark:text-gray-400">{t('Sector')}</dt>
            <dd className="text-gray-800 dark:text-gray-100">
              {typeof store.sector === 'string' ? store.sector : (store.sector?.name || '—')}
            </dd>
            <dt className="text-gray-500 dark:text-gray-400">{t('Location')}</dt>
            <dd className="text-gray-800 dark:text-gray-100">
              {store.locationId ? store.locationId.substring(0, 12) : '—'}
            </dd>
            <dt className="text-gray-500 dark:text-gray-400">Commission</dt>
            <dd className="text-gray-800 dark:text-gray-100">
              {store.commissionRate !== undefined
                ? `${Math.round(store.commissionRate * 100)}%`
                : '—'}
            </dd>
            <dt className="text-gray-500 dark:text-gray-400">Tax</dt>
            <dd className="text-gray-800 dark:text-gray-100">
              {store.tax !== undefined ? `${Math.round(store.tax * 100)}%` : '—'}
            </dd>
            <dt className="text-gray-500 dark:text-gray-400">Created</dt>
            <dd className="text-gray-800 dark:text-gray-100">
              {formatDate(store.createdAt)}
            </dd>
            <dt className="text-gray-500 dark:text-gray-400">Updated</dt>
            <dd className="text-gray-800 dark:text-gray-100">
              {formatDate(store.updatedAt)}
            </dd>
          </dl>
        </Card>

        {store.approvalMetadata && (
          <Card className="lg:col-span-3">
            <p className="card-h1 mb-4 dark:text-white">{t('Approval Information')}</p>
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <dt className="text-gray-500 dark:text-gray-400">{t('Approved By')}</dt>
              <dd className="text-gray-800 dark:text-gray-100">
                {store.approvalMetadata.approvedBy ?? '—'}
              </dd>
              <dt className="text-gray-500 dark:text-gray-400">{t('Approved At')}</dt>
              <dd className="text-gray-800 dark:text-gray-100">
                {formatDate(store.approvalMetadata.approvedAt)}
              </dd>
              {store.approvalMetadata.rejectionReason && (
                <>
                  <dt className="text-gray-500 dark:text-gray-400">{t('Rejection Reason')}</dt>
                  <dd className="text-gray-800 dark:text-gray-100">
                    {store.approvalMetadata.rejectionReason}
                  </dd>
                </>
              )}
              {store.approvalMetadata.suspensionReason && (
                <>
                  <dt className="text-gray-500 dark:text-gray-400">{t('Suspension Reason')}</dt>
                  <dd className="text-gray-800 dark:text-gray-100">
                    {store.approvalMetadata.suspensionReason}
                  </dd>
                </>
              )}
            </dl>
          </Card>
        )}
      </div>
    </div>
  );
}