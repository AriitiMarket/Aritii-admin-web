import { Link, useParams, useNavigate } from 'react-router-dom';
import { sellersService } from '@/services/sellers.service';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { Card } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { PageLoader } from '@/components/common/PageLoader';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate, formatNumber } from '@/utils/format';

export function SellerDetailPage() {
  const { sellerId } = useParams<{ sellerId: string }>();
  const { t } = useLocalization();
  const navigate = useNavigate();
  const { data: seller, loading, error, refetch } = useAsync(
    () => sellersService.get(sellerId ?? ''),
    [sellerId]
  );

  if (loading) return <PageLoader label={t('Loading')} />;
  if (error || !seller) {
    return <ErrorState message={error ?? 'Not found'} onRetry={refetch} />;
  }

  return (
    <div>
      <PageHeader
        title={seller.name}
        description={seller.email}
        actions={
          <Link to="/sellers">
            <Button variant="outline">{t('Back to sellers')}</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center gap-3 text-center">
          <Avatar name={seller.name} size="lg" />
          <p className="heading-5 dark:text-white">{seller.name}</p>
          <StatusBadge label={seller.status} />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatNumber(seller.storesCount)} {t('Stores')}
          </p>
        </Card>

        <Card className="lg:col-span-2">
          <p className="card-h1 mb-4 dark:text-white">{t('Details')}</p>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <dt className="text-gray-500 dark:text-gray-400">{t('Email')}</dt>
            <dd className="text-gray-800 dark:text-gray-100">{seller.email}</dd>
            <dt className="text-gray-500 dark:text-gray-400">{t('Phone')}</dt>
            <dd className="text-gray-800 dark:text-gray-100">{seller.phone ?? '—'}</dd>
            <dt className="text-gray-500 dark:text-gray-400">{t('Address')}</dt>
            <dd className="text-gray-800 dark:text-gray-100">{seller.address ?? '—'}</dd>
            <dt className="text-gray-500 dark:text-gray-400">Commission</dt>
            <dd className="text-gray-800 dark:text-gray-100">
              {seller.commissionRate !== undefined
                ? `${Math.round(seller.commissionRate * 100)}%`
                : '—'}
            </dd>
            <dt className="text-gray-500 dark:text-gray-400">Created</dt>
            <dd className="text-gray-800 dark:text-gray-100">
              {formatDate(seller.createdAt)}
            </dd>
            <dt className="text-gray-500 dark:text-gray-400">Sector</dt>
            <dd className="text-gray-800 dark:text-gray-100">
              {seller.sector || 'All'}
            </dd>
          </dl>

          {(seller.stores || []).length > 0 && (
            <div className="mt-4">
              <p className="card-h2 mb-2 dark:text-gray-300">{t('Stores')}</p>
              <ul className="space-y-1 text-sm">
                {(seller.stores || []).map((storeId) => (
                  <li key={storeId}>
                    <button
                      type="button"
                      onClick={() => navigate(`/stores/${storeId}`)}
                      className="text-primary-dark hover:underline"
                    >
                      {storeId}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}