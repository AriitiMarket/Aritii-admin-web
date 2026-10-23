import { Link, useParams, useNavigate } from 'react-router-dom';
import { sellersService } from '@/services/sellers.service';
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
import { formatDate, formatNumber } from '@/utils/format';

export function SellerDetailPage() {
  const { sellerId } = useParams<{ sellerId: string }>();
  const { t } = useLocalization();
  const navigate = useNavigate();
  const { data: seller, loading, error, refetch } = useAsync(
    () => sellersService.get(sellerId ?? ''),
    [sellerId]
  );

  // A seller's shops are owned by their account id — one batched commerce call,
  // so the page shows shop NAMES (and the business each belongs to) instead of
  // the opaque shop ids identity alone can report.
  const { data: shops } = useAsync(
    () => storesService.list({ ownerId: sellerId ?? '', page: 1, limit: 50 }),
    [sellerId]
  );

  if (loading) return <PageLoader label={t('Loading')} />;
  if (error || !seller) {
    return <ErrorState message={error ?? 'Not found'} onRetry={refetch} />;
  }

  const storeIds = seller.stores || [];
  const shopRows = shops?.items ?? [];
  const hasAnyStore = shopRows.length > 0 || storeIds.length > 0;

  return (
    <div>
      <PageHeader
        title={seller.name}
        description={seller.email}
        actions={
          <div className="flex items-center gap-2">
            <Link to={`/sellers/${sellerId}/financial`}>
              <Button variant="primary">Financial & Wallet Details</Button>
            </Link>
            <Link to="/users?tab=sellers">
              <Button variant="outline">{t('Back to sellers')}</Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center gap-3 text-center">
          <Avatar name={seller.name} size="lg" />
          <p className="heading-5 dark:text-white">{seller.name}</p>
          <StatusBadge label={seller.status} />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatNumber(shops?.total ?? seller.storesCount ?? 0)} {t('Stores')}
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

          <div className="mt-4">
            <p className="card-h2 mb-2 dark:text-gray-300">{t('Stores')}</p>
            {hasAnyStore ? (
              <ul className="space-y-2 text-sm">
                {shopRows.map((shop) => (
                  <li key={shop.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    <button
                      type="button"
                      onClick={() => navigate(`/stores/${shop.id}`)}
                      className="text-primary-dark hover:underline"
                    >
                      {shop.name}
                    </button>
                    {shop.businessName &&
                      (shop.businessId ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/businesses/${shop.businessId}`)}
                          className="text-xs text-gray-500 hover:underline"
                        >
                          {shop.businessName}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500">{shop.businessName}</span>
                      ))}
                    <span className="text-xs text-gray-400">{shop.status}</span>
                  </li>
                ))}
                {/* Shops the commerce list has not returned (legacy records):
                    fall back to the ids on the seller record, no better source. */}
                {storeIds
                  .filter((id) => !shopRows.some((shop) => shop.id === id))
                  .map((storeId) => (
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
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('No shops registered for this seller yet')}
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}