import { useParams, useNavigate } from 'react-router-dom';
import { ordersService } from '@/services/orders.service';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { Card } from '@/components/common/Card';
import { ErrorState } from '@/components/common/ErrorState';
import { PageLoader } from '@/components/common/PageLoader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { formatDate } from '@/utils/format';
import type { OrderDetail } from '@/types';

const ORDER_TIMELINE: Array<{
  status: string;
  label: string;
}> = [
  { status: 'PENDING', label: 'Order Placed' },
  { status: 'ACCEPTED', label: 'Accepted' },
  { status: 'ASSIGNED', label: 'Assigned' },
  { status: 'PICKED', label: 'Picked Up' },
  { status: 'ARRIVED', label: 'Arrived' },
  { status: 'DELIVERED', label: 'Delivered' },
];

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

  // Get the current status index
  const currentStatusIndex = ORDER_TIMELINE.findIndex(
    (item) => item.status === order.orderStatus
  );

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-sm text-primary-dark hover:underline dark:text-primary-color"
      >
        {t('← Back')}
      </button>

      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="heading-4 dark:text-white">
          {t('Order')} #{order.orderId}
        </h1>
        <StatusBadge label={order.orderStatus} />
      </div>

      {/* Timeline */}
      <Card>
        <h2 className="card-h2 mb-6 dark:text-white">{t('Order Timeline')}</h2>
        <div className="flex items-center justify-between">
          {ORDER_TIMELINE.map((item, index) => (
            <div key={item.status} className="flex flex-col items-center">
              {/* Circle */}
              <div
                className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                  index <= currentStatusIndex
                    ? 'border-green-500 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                    : 'border-gray-300 bg-gray-100 text-gray-500 dark:border-dark-600 dark:bg-dark-800 dark:text-gray-400'
                }`}
              >
                {index <= currentStatusIndex ? '✓' : index + 1}
              </div>
              {/* Label */}
              <span
                className={`text-center text-xs font-medium ${
                  index <= currentStatusIndex
                    ? 'text-gray-700 dark:text-gray-200'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {item.label}
              </span>
              {/* Connector Line */}
              {index < ORDER_TIMELINE.length - 1 && (
                <div
                  className={`mt-3 h-8 w-0.5 ${
                    index < currentStatusIndex
                      ? 'bg-green-500'
                      : 'bg-gray-300 dark:bg-dark-600'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Order Info */}
        <Card>
          <h2 className="card-h2 mb-3 dark:text-white">{t('Order Info')}</h2>
          <dl className="space-y-2 text-sm">
            <Detail label={t('Order ID')} value={order.orderId} />
            <Detail label={t('Amount')} value={`${order.orderAmount ?? 0}`} />
            <Detail label={t('Type')} value={order.orderType} />
            <Detail label={t('Payer')} value={order.payer} />
            <Detail label={t('Date')} value={formatDate(order.createdAt)} />
            {order.updatedAt && (
              <Detail label={t('Updated')} value={formatDate(order.updatedAt)} />
            )}
            {order.sector && (
              <Detail label={t('Sector')} value={order.sector} />
            )}
          </dl>
        </Card>

        {/* Payment Info */}
        <Card>
          <h2 className="card-h2 mb-3 dark:text-white">{t('Payment Details')}</h2>
          <dl className="space-y-2 text-sm">
            <Detail
              label={t('Payment Method')}
              value={order.paymentMethod ?? '—'}
            />
            <Detail label={t('Subtotal')} value={`${order.orderAmount ?? 0}`} />
            {order.deliveryCharges !== undefined && (
              <Detail
                label={t('Delivery Charges')}
                value={`${order.deliveryCharges}`}
              />
            )}
            {order.tax !== undefined && (
              <Detail label={t('Tax')} value={`${order.tax}`} />
            )}
            {order.deliveryCharges !== undefined && order.tax !== undefined && (
              <Detail
                label={t('Total')}
                value={`${(order.orderAmount ?? 0) + order.deliveryCharges + order.tax}`}
                isBold
              />
            )}
          </dl>
        </Card>

        {/* Parties Info */}
        <Card>
          <h2 className="card-h2 mb-3 dark:text-white">{t('Parties')}</h2>
          <dl className="space-y-2 text-sm">
            {order.customer && (
              <Detail label={t('Customer')} value={order.customer.name ?? '—'} />
            )}
            {order.store && (
              <Detail label={t('Store/Shop')} value={order.store.name ?? '—'} />
            )}
            {order.rider && (
              <Detail label={t('Rider')} value={order.rider.name ?? '—'} />
            )}
            {order.notes && <Detail label={t('Notes')} value={order.notes} />}
          </dl>
        </Card>

        {/* Delivery Address */}
        {order.deliveryAddress && (
          <Card>
            <h2 className="card-h2 mb-3 dark:text-white">{t('Delivery Address')}</h2>
            <p className="text-sm text-gray-700 dark:text-gray-200">
              {order.deliveryAddress}
            </p>
          </Card>
        )}

        {/* Items Table */}
        {order.items && order.items.length > 0 && (
          <Card className="md:col-span-2">
            <h2 className="card-h2 mb-4 dark:text-white">{t('Order Items')}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-dark-600">
                    <th className="py-2 text-left font-semibold text-gray-700 dark:text-gray-200">
                      {t('Item')}
                    </th>
                    <th className="py-2 text-center font-semibold text-gray-700 dark:text-gray-200">
                      {t('Qty')}
                    </th>
                    <th className="py-2 text-right font-semibold text-gray-700 dark:text-gray-200">
                      {t('Price')}
                    </th>
                    <th className="py-2 text-right font-semibold text-gray-700 dark:text-gray-200">
                      {t('Total')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => (
                    <tr
                      key={item.id ?? idx}
                      className="border-b border-gray-100 dark:border-dark-700"
                    >
                      <td className="py-3 text-gray-700 dark:text-gray-200">
                        {item.title ?? `Item ${idx + 1}`}
                      </td>
                      <td className="py-3 text-center text-gray-700 dark:text-gray-200">
                        {item.quantity ?? 1}
                      </td>
                      <td className="py-3 text-right text-gray-700 dark:text-gray-200">
                        {item.price ?? 0}
                      </td>
                      <td className="py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                        {((item.quantity ?? 1) * (item.price ?? 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4">
        <Button onClick={() => navigate(-1)} variant="secondary">
          {t('Back')}
        </Button>
      </div>
    </div>
  );
}

interface DetailProps {
  label: string;
  value: string;
  isBold?: boolean;
}

function Detail({ label, value, isBold = false }: DetailProps) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
      <dd
        className={`text-right ${
          isBold
            ? 'font-semibold text-gray-900 dark:text-gray-100'
            : 'text-gray-800 dark:text-gray-100'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}