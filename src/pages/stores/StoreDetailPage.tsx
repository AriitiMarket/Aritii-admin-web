import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { storesService } from '@/services/stores.service';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/hooks/useToast';
import { useLocalization } from '@/i18n/I18nProvider';
import { Card } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { PageLoader } from '@/components/common/PageLoader';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate } from '@/utils/format';
import { apiErrorMessage } from '@/utils/error';

export function StoreDetailPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { t } = useLocalization();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const { data: store, loading, error, refetch } = useAsync(
    () => storesService.get(storeId ?? ''),
    [storeId]
  );

  const status = (store as any)?.status as string | undefined;

  const handleSuspend = async () => {
    if (!storeId) return;
    const reason = window.prompt(t('Reason for suspending this shop (optional)'), '');
    if (reason === null) return;
    setBusy(true);
    try {
      await storesService.suspend(storeId, reason || undefined);
      showToast({ type: 'success', message: t('Shop suspended') });
      refetch();
    } catch (err) {
      showToast({ type: 'error', message: apiErrorMessage(err, t('Could not suspend this shop')) });
    } finally {
      setBusy(false);
    }
  };

  const handleActivate = async () => {
    if (!storeId) return;
    setBusy(true);
    try {
      await storesService.activate(storeId);
      showToast({ type: 'success', message: t('Shop activated') });
      refetch();
    } catch (err) {
      showToast({ type: 'error', message: apiErrorMessage(err, t('Could not activate this shop')) });
    } finally {
      setBusy(false);
    }
  };

  // Onboarding decisions — a PENDING_APPROVAL shop has no action at all today,
  // so it could only be decided from the pending queue. Approve → APPROVED
  // (publicly visible), reject → INACTIVE (hidden, reason stored).
  const handleApprove = async () => {
    if (!storeId) return;
    setBusy(true);
    try {
      await storesService.approve(storeId);
      showToast({ type: 'success', message: t('Shop approved') });
      refetch();
    } catch (err) {
      showToast({ type: 'error', message: apiErrorMessage(err, t('Could not approve this shop')) });
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!storeId) return;
    const reason = window.prompt(t('Reason for rejecting this shop (optional)'), '');
    if (reason === null) return;
    setBusy(true);
    try {
      await storesService.reject(storeId, reason || undefined);
      showToast({ type: 'success', message: t('Shop rejected') });
      refetch();
    } catch (err) {
      showToast({ type: 'error', message: apiErrorMessage(err, t('Could not reject this shop')) });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <PageLoader label={t('Loading')} />;
  if (error || !store) {
    return <ErrorState message={error ?? 'Not found'} onRetry={refetch} />;
  }

  const snap = (store as any).locationSnapshot || {};
  const owner = (store as any).owner || {};
  const bi = (store as any).businessInformation || {};

  const getLocationDisplay = () => {
    const parts = [snap.regionName, snap.cityName, snap.sectorName].filter(Boolean);
    if (snap.fullAddress) parts.push(snap.fullAddress);
    return parts.length ? parts.join(' › ') : (store as any).address || '—';
  };

  const getShopStatusBadge = () => {
    const statusMap: Record<string, string> = {
      PENDING_APPROVAL: 'Pending Approval',
      APPROVED: 'Approved',
      ACTIVE: 'Active',
      SUSPENDED: 'Suspended',
      INACTIVE: 'Inactive',
    };
    return statusMap[(store as any).status] || (store as any).status;
  };

  const coords = snap.coordinates || {};

  // Mirrors the backend `publicVisibilityFilter()`: guests only ever see
  // APPROVED/ACTIVE shops that the admin has not hidden via `showOnPublic`.
  const publiclyVisible =
    (status === 'APPROVED' || status === 'ACTIVE') && (store as any).showOnPublic !== false;

  return (
    <div className="space-y-6">
      <PageHeader
        title={(store as any).name}
        description={getLocationDisplay()}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {status === 'PENDING_APPROVAL' && (
              <>
                <Button variant="primary" loading={busy} onClick={handleApprove}>
                  {t('Approve')}
                </Button>
                <Button variant="danger" loading={busy} onClick={handleReject}>
                  {t('Reject')}
                </Button>
              </>
            )}
            {(status === 'APPROVED' || status === 'ACTIVE') && (
              <Button variant="danger" loading={busy} onClick={handleSuspend}>
                {t('Suspend')}
              </Button>
            )}
            {(status === 'SUSPENDED' || status === 'INACTIVE') && (
              <>
                <Button variant="primary" loading={busy} onClick={handleActivate}>
                  {t('Activate')}
                </Button>
                <Button variant="danger" loading={busy} onClick={handleReject}>
                  {t('Reject')}
                </Button>
              </>
            )}
            <Link to="/stores">
              <Button variant="outline">{t('Back to stores')}</Button>
            </Link>
          </div>
        }
      />

      {/* Shop Header Card */}
      <Card className="flex flex-col items-center gap-3 p-6">
        <Avatar src={(store as any).image} name={(store as any).name} size="lg" />
        <div className="text-center">
          <p className="heading-4 dark:text-white">{(store as any).name}</p>
          <div className="mt-2 flex items-center justify-center gap-3">
            <StatusBadge label={getShopStatusBadge()} />
            {(store as any).ratings != null && Number((store as any).ratings) > 0 && (
              <span className="text-sm text-gray-500">{Number((store as any).ratings).toFixed(1)} ★</span>
            )}
          </div>
          <p
            className={`mt-1.5 text-xs font-medium ${
              publiclyVisible ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            {publiclyVisible
              ? t('Visible on the public marketplace')
              : t('Hidden from the public marketplace')}
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Shop Info */}
        <Card>
          <p className="card-h2 mb-4 dark:text-white">{t('Shop Information')}</p>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Description')}</dt>
              <dd className="text-gray-900 dark:text-white">{(store as any).description || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Phone')}</dt>
              <dd className="text-gray-900 dark:text-white">{(store as any).phoneNumber || (store as any).phone || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Email')}</dt>
              <dd className="text-gray-900 dark:text-white">{(store as any).email ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Shop Category')}</dt>
              <dd className="text-gray-900 dark:text-white">{store?.category || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Commission')}</dt>
              <dd className="text-gray-900 dark:text-white">
                {(store as any).commissionRate !== undefined ? `${Math.round((store as any).commissionRate * 100)}%` : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Tax')}</dt>
              <dd className="text-gray-900 dark:text-white">
                {(store as any).tax !== undefined ? `${Math.round((store as any).tax * 100)}%` : '—'}
              </dd>
            </div>
          </dl>
        </Card>

        {/* Owner Info */}
        <Card>
          <p className="card-h2 mb-4 dark:text-white">{t('Owner')}</p>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Name')}</dt>
              <dd className="text-gray-900 dark:text-white">
                {(store as any).ownerId ? (
                  <Link to={`/sellers/${(store as any).ownerId}`} className="text-primary-dark hover:underline dark:text-primary-color">
                    {owner.name || (store as any).ownerName || '—'}
                  </Link>
                ) : (
                  owner.name || (store as any).ownerName || '—'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Email')}</dt>
              <dd className="text-gray-900 dark:text-white">{owner.email || (store as any).ownerEmail || (store as any).email || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Owner Role')}</dt>
              <dd className="text-gray-900 dark:text-white">
                {owner.role || '—'}
                {owner.status ? ` · ${owner.status}` : ''}
              </dd>
            </div>
          </dl>
        </Card>

        {/* Business Info */}
        <Card>
          <p className="card-h2 mb-4 dark:text-white">{t('Business')}</p>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Business Type')}</dt>
              <dd className="text-gray-900 dark:text-white capitalize">{bi.businessCategory || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Business Name')}</dt>
              <dd className="text-gray-900 dark:text-white">
                {(store as any).applicationId ? (
                  <Link to={`/businesses/${(store as any).applicationId}`} className="text-primary-dark hover:underline dark:text-primary-color">
                    {bi.businessName || '—'}
                  </Link>
                ) : (
                  bi.businessName || '—'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Business Description')}</dt>
              <dd className="text-gray-900 dark:text-white">{bi.description || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Business Status')}</dt>
              <dd className="text-gray-900 dark:text-white">{(store as any).businessStatus || '—'}</dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* Catalogue & operations — counts are computed by the Commerce Service.
          Product MANAGEMENT itself stays in the Product module (the link opens
          the existing products page filtered to this shop). */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <p className="card-h2 mb-4 dark:text-white">{t('Products')}</p>
          <p className="text-3xl font-semibold text-gray-900 dark:text-white">
            {(store as any).productCount ?? '—'}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('Products listed in this shop')}
          </p>
          <div className="mt-4">
            <Link to={`/commerce/products?shopId=${storeId}`}>
              <Button variant="outline">{t('View products')}</Button>
            </Link>
          </div>
        </Card>

        <Card>
          <p className="card-h2 mb-4 dark:text-white">{t('Orders')}</p>
          <p className="text-3xl font-semibold text-gray-900 dark:text-white">
            {(store as any).orderCount ?? '—'}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('Orders containing items from this shop')}
          </p>
          <div className="mt-4">
            <Link to="/orders">
              <Button variant="outline">{t('View orders')}</Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Location */}
      <Card>
        <p className="card-h2 mb-4 dark:text-white">{t('Location')}</p>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <dt className="text-gray-500 dark:text-gray-400">{t('Region')}</dt>
          <dd className="text-gray-900 dark:text-white">{snap.regionName || '—'}</dd>
          <dt className="text-gray-500 dark:text-gray-400">{t('City/Village/Area')}</dt>
          <dd className="text-gray-900 dark:text-white">{snap.cityName || '—'}</dd>
          <dt className="text-gray-500 dark:text-gray-400">{t('Sector')}</dt>
          <dd className="text-gray-900 dark:text-white">{snap.sectorName || '—'}</dd>
          <dt className="text-gray-500 dark:text-gray-400">{t('Full Address')}</dt>
          <dd className="text-gray-900 dark:text-white">{snap.fullAddress || (store as any).address || '—'}</dd>
          <dt className="text-gray-500 dark:text-gray-400">{t('Landmark')}</dt>
          <dd className="text-gray-900 dark:text-white">{snap.landmark || '—'}</dd>
          <dt className="text-gray-500 dark:text-gray-400">{t('Building')}</dt>
          <dd className="text-gray-900 dark:text-white">{snap.building || '—'}</dd>
          <dt className="text-gray-500 dark:text-gray-400">{t('Contact Phone')}</dt>
          <dd className="text-gray-900 dark:text-white">{snap.contactPhone || (store as any).phoneNumber || (store as any).phone || '—'}</dd>
          <dt className="text-gray-500 dark:text-gray-400">{t('Coordinates')}</dt>
          <dd className="text-gray-900 dark:text-white">
            {coords.latitude && coords.longitude
              ? `${coords.latitude}, ${coords.longitude}`
              : '—'}
          </dd>
        </dl>
      </Card>

      {/* Approval Information */}
      {(store as any).approvalMetadata && (
        <Card>
          <p className="card-h2 mb-4 dark:text-white">{t('Approval Information')}</p>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <dt className="text-gray-500 dark:text-gray-400">{t('Approved By')}</dt>
            <dd className="text-gray-900 dark:text-white">{(store as any).approvalMetadata.approvedBy ?? '—'}</dd>
            <dt className="text-gray-500 dark:text-gray-400">{t('Approved At')}</dt>
            <dd className="text-gray-900 dark:text-white">
              {formatDate((store as any).approvalMetadata.approvedAt)}
            </dd>
            {(store as any).approvalMetadata.rejectionReason && (
              <>
                <dt className="text-gray-500 dark:text-gray-400">{t('Rejection Reason')}</dt>
                <dd className="text-gray-900 dark:text-white">{(store as any).approvalMetadata.rejectionReason}</dd>
              </>
            )}
            {(store as any).approvalMetadata.suspensionReason && (
              <>
                <dt className="text-gray-500 dark:text-gray-400">{t('Suspension Reason')}</dt>
                <dd className="text-gray-900 dark:text-white">{(store as any).approvalMetadata.suspensionReason}</dd>
              </>
            )}
          </dl>
        </Card>
      )}

      {/* Created/Updated */}
      <Card>
        <p className="card-h2 mb-4 dark:text-white">{t('Dates')}</p>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <dt className="text-gray-500 dark:text-gray-400">{t('Created')}</dt>
          <dd className="text-gray-900 dark:text-white">{formatDate((store as any).createdAt)}</dd>
          <dt className="text-gray-500 dark:text-gray-400">{t('Updated')}</dt>
          <dd className="text-gray-900 dark:text-white">{formatDate((store as any).updatedAt)}</dd>
        </dl>
      </Card>
    </div>
  );
}
