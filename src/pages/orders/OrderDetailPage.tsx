import { useParams, useNavigate } from 'react-router-dom';
import { useAsync } from '@/hooks/useAsync';
import { useUserDirectory } from '@/hooks/useUserDirectory';
import { useLocalization } from '@/i18n/I18nProvider';
import { Card } from '@/components/common/Card';
import { ErrorState } from '@/components/common/ErrorState';
import { PageLoader } from '@/components/common/PageLoader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { formatDate } from '@/utils/format';
import { commerceService } from '@/services/commerce.service';

const OPERATIONAL_TIMELINE: Array<{ stage: string; label: string }> = [
  { stage: 'new', label: 'Order Created' },
  { stage: 'accepted', label: 'Accepted' },
  { stage: 'ready_for_pickup', label: 'Ready for Pickup' },
  { stage: 'pickup_assigned', label: 'Pickup Assigned' },
  { stage: 'picked_up', label: 'Picked Up' },
  { stage: 'in_transit', label: 'In Transit' },
  { stage: 'delivered', label: 'Delivered' },
];

export function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { t } = useLocalization();

  const { data: lifecycle, loading, error, refetch } = useAsync(
    async () => {
      if (!orderId) throw new Error('Missing order id');
      return commerceService.getOrderLifecycle(orderId);
    },
    [orderId]
  );

  // Resolve the buyer's name for the destination card (and the assigned
  // rider's, when that id belongs to an identity account) — the console shows
  // people by name, never by uuid.
  const directoryId = lifecycle?.order?.buyerId || lifecycle?.pickup?.actorId || '';
  const { nameFor } = useUserDirectory(directoryId ? [directoryId] : []);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!lifecycle) return null;

  const order = lifecycle.order || {};
  const pickup = lifecycle.pickup || {};
  const dropOff = lifecycle.dropOff || {};
  const timeline = lifecycle.timeline || [];
  const sellerShipments = order.sellerShipments || [];

  const reached = new Map(
    timeline.map((entry: any) => [entry.stage, entry])
  );

  const renderAddress = (addr: any) => {
    if (!addr) return <p className="text-sm text-gray-500">—</p>;
    if (typeof addr === 'string') return <p className="text-sm text-gray-700 dark:text-gray-300">{addr}</p>;
    return (
      <div className="text-sm space-y-1">
        {addr.regionId && <p><span className="text-gray-500">Region:</span> {addr.regionId}</p>}
        {addr.cityId && <p><span className="text-gray-500">City:</span> {addr.cityId}</p>}
        {addr.areaId && <p><span className="text-gray-500">Area:</span> {addr.areaId}</p>}
        {addr.sectorId && <p><span className="text-gray-500">Sector:</span> {addr.sectorId}</p>}
        {addr.fullAddress && <p><span className="text-gray-500">Address:</span> {addr.fullAddress}</p>}
        {addr.landmark && <p><span className="text-gray-500">Landmark:</span> {addr.landmark}</p>}
        {addr.building && <p><span className="text-gray-500">Building:</span> {addr.building}</p>}
        {addr.phone && <p><span className="text-gray-500">Phone:</span> {addr.phone}</p>}
        {addr.additionalInstructions && <p><span className="text-gray-500">Instructions:</span> {addr.additionalInstructions}</p>}
        {addr.coordinates && (
          <p><span className="text-gray-500">GPS:</span> {addr.coordinates.lat}, {addr.coordinates.lng}</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-sm text-primary-dark hover:underline dark:text-primary-color"
      >
        {t('← Back to Orders')}
      </button>

      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="heading-4 dark:text-white">
            {t('Order')} #{(order.id || orderId || '').slice(-8)}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('Created')} {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge label={order.status || 'Processing'} />
          {order.paymentStatus && (
            <StatusBadge
              label={`Payment: ${order.paymentStatus}`}
              className={
                order.paymentStatus === 'FAILED'
                  ? 'bg-red-50 text-red-700'
                  : order.paymentStatus === 'CONFIRMED'
                    ? 'bg-green-50 text-green-700'
                    : ''
              }
            />
          )}
        </div>
      </div>

      {/* Timeline */}
      <Card>
        <h2 className="card-h2 mb-6 dark:text-white">{t('Order Timeline')}</h2>
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {OPERATIONAL_TIMELINE.map((item, index) => {
            const entry = reached.get(item.stage);
            const isDone = Boolean(entry);
            return (
              <div key={item.stage} className="flex flex-col items-center min-w-[80px]">
                <div
                  className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                    isDone
                      ? 'border-green-500 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      : 'border-gray-300 bg-gray-100 text-gray-500 dark:border-dark-600 dark:bg-dark-800 dark:text-gray-400'
                  }`}
                >
                  {isDone ? '✓' : index + 1}
                </div>
                <span
                  className={`text-center text-xs font-medium ${
                    isDone
                      ? 'text-gray-700 dark:text-gray-200'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {item.label}
                </span>
                <span className="mt-1 text-center text-[10px] text-gray-400 dark:text-gray-500">
                  {(entry as any)?.timestamp ? formatDate((entry as any).timestamp) : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Order Info */}
        <Card>
          <h2 className="card-h2 mb-3 dark:text-white">{t('Order Information')}</h2>
          <dl className="space-y-2 text-sm">
            <Detail label={t('Order ID')} value={`#${(order.id || '').slice(-8)}`} />
            <Detail label={t('Amount')} value={`${(order.totalPrice || 0).toLocaleString()} ETB`} />
            <Detail label={t('Status')} value={order.status || '—'} />
            <Detail label={t('Payment Status')} value={order.paymentStatus || '—'} />
            {lifecycle.stageLabel && (
              <Detail label={t('Operational Stage')} value={lifecycle.stageLabel} />
            )}
            {order.updatedAt && (
              <Detail label={t('Updated')} value={formatDate(order.updatedAt)} />
            )}
          </dl>
        </Card>

        {/* Customer Destination */}
        <Card>
          <h2 className="card-h2 mb-3 dark:text-white">{t('Customer Destination')}</h2>
          {renderAddress(order.destination || dropOff?.address)}
          {order.buyerId && (
            <p className="text-xs text-gray-500 mt-2">
              {t('Customer')}: {nameFor(order.buyerId) || order.buyerId}
            </p>
          )}
        </Card>

        {/* Delivery Info */}
        <Card>
          <h2 className="card-h2 mb-3 dark:text-white">{t('Delivery Information')}</h2>
          <dl className="space-y-2 text-sm">
            <Detail label={t('Delivery Status')} value={lifecycle.stageLabel || order.status || '—'} />
            {pickup.actorId && (
              <Detail label={t('Assigned Rider')} value={nameFor(pickup.actorId) || pickup.actorId} />
            )}
            {pickup.readyAt && (
              <Detail label={t('Ready for Pickup')} value={formatDate(pickup.readyAt)} />
            )}
            {pickup.pickedUpAt && (
              <Detail label={t('Picked Up At')} value={formatDate(pickup.pickedUpAt)} />
            )}
            {dropOff?.deliveredAt && (
              <Detail label={t('Delivered At')} value={formatDate(dropOff.deliveredAt)} />
            )}
            {dropOff?.failureReason && (
              <Detail label={t('Failure Reason')} value={dropOff.failureReason} />
            )}
          </dl>
        </Card>

        {/* Timeline */}
        {timeline.length > 0 && (
          <Card>
            <h2 className="card-h2 mb-3 dark:text-white">{t('Timeline')}</h2>
            <div className="space-y-3">
              {timeline.map((entry: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{entry.label}</p>
                    <p className="text-xs text-gray-500">{entry.timestamp ? formatDate(entry.timestamp) : '—'}</p>
                    {entry.source && (
                      <p className="text-xs text-gray-400">Source: {entry.source}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Seller Shipments */}
      {sellerShipments.length > 0 && (
        <Card>
          <h2 className="card-h2 mb-4 dark:text-white">{t('Seller Shipments')}</h2>
          <div className="space-y-4">
            {sellerShipments.map((shipment: any, idx: number) => (
              <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                  {t('Shipment')} {idx + 1}
                  {shipment.shopId && <span className="text-gray-500 ml-2">Shop: {shipment.shopId}</span>}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('Origin (Pickup)')}</h4>
                    {renderAddress(shipment.origin)}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('Items')}</h4>
                    {shipment.items && shipment.items.length > 0 ? (
                      <ul className="text-sm space-y-1">
                        {shipment.items.map((item: any, itemIdx: number) => (
                          <li key={itemIdx} className="flex justify-between">
                            <span>{item.name || item.productId || `Item ${itemIdx + 1}`}</span>
                            <span className="text-gray-500">x{item.quantity ?? item.qty ?? 1}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">—</p>
                    )}
                    {shipment.subtotal && (
                      <p className="text-sm font-medium mt-2">
                        {t('Subtotal')}: {shipment.subtotal.toLocaleString()} ETB
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Items Table */}
      {order.items && order.items.length > 0 && (
        <Card>
          <h2 className="card-h2 mb-4 dark:text-white">{t('Order Items')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-dark-600">
                  <th className="py-2 text-left font-semibold text-gray-700 dark:text-gray-200">{t('Item')}</th>
                  <th className="py-2 text-center font-semibold text-gray-700 dark:text-gray-200">{t('Qty')}</th>
                  <th className="py-2 text-right font-semibold text-gray-700 dark:text-gray-200">{t('Price')}</th>
                  <th className="py-2 text-right font-semibold text-gray-700 dark:text-gray-200">{t('Total')}</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item: any, idx: number) => (
                  <tr key={item.productId || idx} className="border-b border-gray-100 dark:border-dark-700">
                    <td className="py-3 text-gray-700 dark:text-gray-200">
                      {item.title || item.name || item.productName || `Item ${idx + 1}`}
                    </td>
                    <td className="py-3 text-center text-gray-700 dark:text-gray-200">
                      {item.quantity ?? item.qty ?? 1}
                    </td>
                    <td className="py-3 text-right text-gray-700 dark:text-gray-200">
                      {(item.price || 0).toLocaleString()}
                    </td>
                    <td className="py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                      {((item.quantity ?? item.qty ?? 1) * (item.price || 0)).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

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
