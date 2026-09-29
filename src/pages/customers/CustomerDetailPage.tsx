import { Link, useParams } from 'react-router-dom';
import { customersService } from '@/services/customers.service';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { Card } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { PageLoader } from '@/components/common/PageLoader';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatCurrency, formatNumber } from '@/utils/format';

export function CustomerDetailPage() {
  const { buyerId } = useParams<{ buyerId: string }>();
  const { t } = useLocalization();
  const { data: customer, loading, error, refetch } = useAsync(
    () => customersService.get(buyerId ?? ''),
    [buyerId]
  );

  if (loading) return <PageLoader label={t('Loading')} />;
  if (error || !customer) {
    return <ErrorState message={error ?? 'Not found'} onRetry={refetch} />;
  }

  return (
    <div>
      <PageHeader
        title={customer.name}
        description={customer.email}
        actions={
          <Link to="/users?tab=customers">
            <Button variant="outline">{t('Back to customers')}</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center gap-3 text-center">
          <Avatar name={customer.name} size="lg" />
          <p className="heading-5 dark:text-white">{customer.name}</p>
          <StatusBadge label={customer.status} />
        </Card>

        <Card className="lg:col-span-2">
          <p className="card-h1 mb-4 dark:text-white">{t('Details')}</p>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <dt className="text-gray-500 dark:text-gray-400">{t('Email')}</dt>
            <dd className="text-gray-800 dark:text-gray-100">{customer.email}</dd>
            <dt className="text-gray-500 dark:text-gray-400">{t('Phone')}</dt>
            <dd className="text-gray-800 dark:text-gray-100">{customer.phone ?? '—'}</dd>
            <dt className="text-gray-500 dark:text-gray-400">{t('Orders')}</dt>
            <dd className="text-gray-800 dark:text-gray-100">
              {formatNumber(customer.ordersCount)}
            </dd>
            <dt className="text-gray-500 dark:text-gray-400">Spent</dt>
            <dd className="text-gray-800 dark:text-gray-100">
              {formatCurrency(customer.totalSpent)}
            </dd>
            <dt className="text-gray-500 dark:text-gray-400">{t('Sectors')}</dt>
            <dd className="text-gray-800 dark:text-gray-100">
              {customer.sector || 'All'}
            </dd>
          </dl>

          {customer.addresses.length > 0 && (
            <div className="mt-4">
              <p className="card-h2 mb-2 dark:text-gray-300">{t('Address')}</p>
              <ul className="space-y-1 text-sm">
                {customer.addresses.map((address, index) => (
                  <li key={index} className="text-gray-700 dark:text-gray-200">
                    {address.label ? `${address.label}: ` : ''}
                    {address.deliveryAddress ?? '—'}
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