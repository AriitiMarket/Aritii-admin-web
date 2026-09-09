import { useParams, useNavigate } from 'react-router-dom';
import { ordersService } from '@/services/orders.service';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { Card } from '@/components/common/Card';
import { ErrorState } from '@/components/common/ErrorState';
import { PageLoader } from '@/components/common/PageLoader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate } from '@/utils/format';
import type { OrderDetail } from '@/types';

export function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { t } = useLocalization();

  const { data, loading, error, refetch } = useAsync(
    async () => {
      if (!orderId) throw new Error('Missing order id');
      return ordersService.get(orderId);
    },
    [orderId]
  );

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  const order = data as OrderDetail;

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-sm text-primary-dark hover:underline dark:text-primary-color"
      >
        {t('← Back')}
      </button>

      <div className="flex items-center justify-between">
        <h1 className="heading-4 dark:text-white">
          {t('Order')} #{order.orderId}
        </h1>
        <StatusBadge label={order.orderStatus} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <h2 className="card-h2 mb-3 dark:text-white">{t('Order Info')}</h2>
          <dl className="space-y-2 text-sm">
            <Detail label={t('Amount')} value={`${order.orderAmount ?? 0}`} />
            <Detail label={t('Type')} value={order.orderType} />
            <Detail label={t('Payer')} value={order.payer} />
            <Detail label={t('Payment Method')} value={order.paymentMethod ?? '—'} />
            <Detail label={t('Sector')} value={order.sector} />
            <Detail label={t('Date')} value={formatDate(order.createdAt)} />
          </dl>
        </Card>

        <Card>
          <h2 className="card-h2 mb-3 dark:text-white">{t('Parties')}</h2>
          <dl className="space-y-2 text-sm">
            <Detail label={t('Store')} value={order.store?.name ?? '—'} />
            <Detail label={t('Rider')} value={order.rider?.name ?? '—'} />
            <Detail label={t('Customer')} value={order.customer?.name ?? '—'} />
          </dl>
        </Card>

        {order.items && order.items.length > 0 && (
          <Card className="md:col-span-2">
            <h2 className="card-h2 mb-3 dark:text-white">{t('Items')}</h2>
            <ul className="divide-y divide-gray-100 dark:divide-dark-700">
              {order.items.map((item, idx) => (
                <li
                  key={item.id ?? idx}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <span className="text-gray-700 dark:text-gray-200">
                    {item.title ?? `Item ${idx + 1}`}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {item.quantity ?? 1} × {item.price ?? 0}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-right text-gray-800 dark:text-gray-100">{value}</dd>
    </div>
  );
}