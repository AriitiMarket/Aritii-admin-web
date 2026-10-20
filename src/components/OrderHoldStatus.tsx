import { useState } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/hooks/useToast';
import { useLocalization } from '@/i18n/I18nProvider';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { apiErrorMessage } from '@/utils/error';
import { orderHoldService } from '@/services/orderHold.admin.service';

/**
 * OrderHoldStatus — admin control to pause / release an order.
 *
 * A hold is used when an order needs manual clarification (payment verification,
 * suspected fraud, address problems) before it can proceed. When held, the panel
 * shows the reason and how long it has been held, with a one-click release.
 */
export function OrderHoldStatus({ orderId }: { orderId: string }) {
  const { t } = useLocalization();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState('');

  // A 404 (not currently held) is normalised to `null` by the service, so this
  // never renders an error state for a healthy un-held order.
  const { data: hold, loading, error, refetch } = useAsync(
    () => orderHoldService.getHoldStatus(orderId),
    [orderId]
  );

  const isHeld = Boolean(hold) && !hold?.releasedAt;

  const runAction = async (
    action: () => Promise<unknown>,
    successMessage: string
  ) => {
    setBusy(true);
    try {
      await action();
      showToast({ type: 'success', message: successMessage });
      refetch();
    } catch (err) {
      showToast({
        type: 'error',
        message: apiErrorMessage(err, t('Could not update the hold')),
      });
    } finally {
      setBusy(false);
    }
  };

  const handleHold = () => {
    const trimmed = reason.trim();
    if (!trimmed) return;
    void runAction(
      () => orderHoldService.holdOrder(orderId, trimmed),
      t('Order placed on hold')
    );
    setReason('');
  };

  const handleRelease = () => {
    void runAction(
      () => orderHoldService.releaseHold(orderId, 'Released by admin'),
      t('Order hold released')
    );
  };

  // Network error only (a 404 is already mapped to `null` by the service).
  if (error && !isHeld) {
    return (
      <Card className="border-l-4 border-red-500">
        <p className="card-h2 mb-2 dark:text-white">{t('Order Hold')}</p>
        <p className="text-sm text-red-600">{error}</p>
      </Card>
    );
  }

  return (
    <Card
      className={
        isHeld ? 'border-l-4 border-amber-500' : 'border-l-4 border-gray-200'
      }
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="card-h2 dark:text-white">{t('Order Hold')}</p>
        <StatusBadge
          label={isHeld ? t('On Hold') : t('Active')}
          variant={isHeld ? 'warning' : 'success'}
        />
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">{t('Loading…')}</p>
      ) : isHeld ? (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-gray-500 dark:text-gray-400">
              {t('Reason')}
            </span>
            <span className="text-right text-gray-800 dark:text-gray-100">
              {hold?.reason || '—'}
            </span>
          </div>
          {hold?.createdAt && (
            <div className="flex justify-between gap-4">
              <span className="text-gray-500 dark:text-gray-400">
                {t('Held since')}
              </span>
              <span className="text-right text-gray-800 dark:text-gray-100">
                {new Date(hold.createdAt).toLocaleString()}
              </span>
            </div>
          )}
          <div className="pt-2">
            <Button
              size="sm"
              variant="primary"
              loading={busy}
              onClick={handleRelease}
            >
              {t('Release Order')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            {t('This order is not on hold.')}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                {t('Reason for hold')}
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('e.g. Payment verification')}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-dark dark:border-dark-600 dark:bg-dark-900 dark:text-white"
              />
            </div>
            <Button
              size="sm"
              variant="secondary"
              disabled={!reason.trim()}
              loading={busy}
              onClick={handleHold}
            >
              {t('Place on Hold')}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default OrderHoldStatus;