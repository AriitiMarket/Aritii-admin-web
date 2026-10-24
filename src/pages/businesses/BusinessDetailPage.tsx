import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { businessesService } from '@/services/businesses.service';
import { storesService } from '@/services/stores.service';
import { adminApi } from '@/api/admin';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/hooks/useToast';
import { useLocalization } from '@/i18n/I18nProvider';
import { Card } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { PageLoader } from '@/components/common/PageLoader';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatCard } from '@/components/common/StatCard';
import { Tabs, TabContent } from '@/components/common/Tabs';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate, formatNumber } from '@/utils/format';

interface BusinessShopRow {
  id: string;
  name: string;
  email?: string;
  description?: string;
  status: string;
  address?: string;
  locationSnapshot?: {
    regionName?: string;
    cityName?: string;
    sectorName?: string;
    fullAddress?: string;
  } | null;
  productCount?: number;
  orders?: number;
  showOnPublic?: boolean;
  createdAt?: string;
  deliveryCoverage?: {
    zoneIds?: string[];
    status?: 'UNCONFIGURED' | 'ACTIVE' | 'PAUSED';
  };
}

const locationParts = (loc?: Record<string, any> | null) => {
  if (!loc) return [];
  const parts = [loc.regionName || loc.region, loc.cityName || loc.city].filter(Boolean);
  if (loc.sectorName) parts.push(loc.sectorName);
  if (loc.address) parts.push(loc.address);
  return parts;
};

const shopLocation = (shop: BusinessShopRow) => {
  const snap = shop.locationSnapshot || {};
  const parts = [snap.regionName, snap.cityName, snap.sectorName].filter(Boolean);
  if (parts.length) return parts.join(' › ');
  return shop.address || '—';
};

export function BusinessDetailPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const { t } = useLocalization();
  const { showToast } = useToast();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [busyShopId, setBusyShopId] = useState<string | null>(null);

  const { data: application, loading, error, refetch } = useAsync(
    () => businessesService.getApplication(businessId && businessId !== 'undefined' ? businessId : ''),
    [businessId]
  );

  const { data: detail, refetch: refetchDetail } = useAsync(
    () =>
      businessId && businessId !== 'undefined'
        ? adminApi.getBusinessDetail(businessId)
        : Promise.resolve(null),
    [businessId]
  );

  const refreshAll = () => {
    refetch();
    refetchDetail();
  };

  const handleApprove = async () => {
    if (!application) return;
    setActionLoading('approve');
    try {
      await businessesService.approveApplication(application.id);
      showToast({ type: 'success', title: t('Success'), message: 'Application approved' });
      refreshAll();
      setActiveTab('shops');
    } catch (err) {
      showToast({ type: 'error', title: t('Error'), message: err instanceof Error ? err.message : 'Failed to approve' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!application) return;
    setActionLoading('reject');
    try {
      await businessesService.rejectApplication(application.id, rejectReason);
      showToast({ type: 'success', title: t('Success'), message: 'Application rejected' });
      refreshAll();
      setShowRejectDialog(false);
    } catch (err) {
      showToast({ type: 'error', title: t('Error'), message: err instanceof Error ? err.message : 'Failed to reject' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestInformation = async () => {
    if (!application) return;
    const reason = window.prompt('What information should the seller provide?')?.trim();
    if (!reason) return;
    setActionLoading('info');
    try {
      await businessesService.requestInformation(application.id, reason);
      showToast({ type: 'success', title: t('Success'), message: 'Additional information requested' });
      refreshAll();
    } catch (err) {
      showToast({ type: 'error', title: t('Error'), message: err instanceof Error ? err.message : 'Failed to request information' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async () => {
    if (!application) return;
    setActionLoading('suspend');
    try {
      await businessesService.suspendBusiness(application.id);
      showToast({ type: 'success', title: t('Success'), message: 'Business suspended' });
      refreshAll();
    } catch (err) {
      showToast({ type: 'error', title: t('Error'), message: err instanceof Error ? err.message : 'Failed to suspend' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async () => {
    if (!application) return;
    setActionLoading('reactivate');
    try {
      await businessesService.reactivateBusiness(application.id);
      showToast({ type: 'success', title: t('Success'), message: 'Business reactivated' });
      refreshAll();
    } catch (err) {
      showToast({ type: 'error', title: t('Error'), message: err instanceof Error ? err.message : 'Failed to reactivate' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleShopSuspend = async (shopId: string) => {
    const reason = window.prompt(t('Reason for suspending this shop (optional)'), '');
    if (reason === null) return;
    setBusyShopId(shopId);
    try {
      await storesService.suspend(shopId, reason || undefined);
      showToast({ type: 'success', message: t('Shop suspended') });
      refetchDetail();
    } catch (err) {
      showToast({ type: 'error', message: err instanceof Error ? err.message : t('Could not suspend this shop') });
    } finally {
      setBusyShopId(null);
    }
  };

  const handleShopActivate = async (shopId: string) => {
    setBusyShopId(shopId);
    try {
      await storesService.activate(shopId);
      showToast({ type: 'success', message: t('Shop activated') });
      refetchDetail();
    } catch (err) {
      showToast({ type: 'error', message: err instanceof Error ? err.message : t('Could not activate this shop') });
    } finally {
      setBusyShopId(null);
    }
  };

  const shops: BusinessShopRow[] = detail?.shops ?? [];
  const business = detail?.business ?? null;

  const overview = useMemo(() => {
    const src: any = business || (application as any) || {};
    return {
      shops: detail?.shopCount ?? shops.length ?? 0,
      products: src.totalProducts ?? 0,
      orders: src.totalOrders ?? 0,
      score: typeof src.verificationScore === 'number' ? src.verificationScore : null,
      risks: Array.isArray(src.riskFlags) ? src.riskFlags : [],
      location: locationParts(src.location),
      ownerName:
        src.owner?.name || src.ownerName || (application as any)?.ownerName || null,
      ownerEmail:
        src.owner?.email || src.ownerEmail || (application as any)?.ownerEmail || null,
      reviewedByName:
        src.reviewedByName ||
        (application as any)?.review?.reviewedByName ||
        (application as any)?.review?.reviewedBy ||
        null,
      reviewedAt: src.reviewedAt || (application as any)?.review?.reviewedAt || null,
      rejectionReason:
        src.rejectionReason || (application as any)?.review?.rejectionReason || null,
    };
  }, [business, application, detail, shops.length]);

  if (loading) return <PageLoader label={t('Loading')} />;
  if (error || !application) return <ErrorState message={error ?? 'Not found'} onRetry={refetch} />;

  const status: string = application.status;
  const isPending = status === 'PENDING_REVIEW';
  const isApproved = status === 'APPROVED';
  const isSuspended = status === 'SUSPENDED';
  const isRejected = status === 'REJECTED';
  const isMoreInfo = status === 'MORE_INFORMATION_REQUIRED';
  const bi = application.businessInformation || {};
  const loc = application.location || {};
  const businessName = bi.businessName || (business as any)?.name || application.businessName || 'Application';
  const ownerLabel = overview.ownerName || 'Unknown owner';

  const tabs = [
    { value: 'overview', label: t('Overview') },
    { value: 'shops', label: `${t('Shops')} (${overview.shops})` },
    { value: 'application', label: t('Application') },
    { value: 'history', label: t('History') },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={businessName}
        description={
          <span className="flex flex-wrap items-center gap-2 text-sm">
            <span>{ownerLabel}</span>
            {overview.ownerEmail ? (
              <span className="text-gray-400">· {overview.ownerEmail}</span>
            ) : null}
            <StatusBadge label={status} />
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
{isPending && (
    <>
        <Button variant="primary" loading={actionLoading === 'approve'} disabled={Boolean(actionLoading)} onClick={handleApprove}>
            {t('Approve')}
        </Button>
        <Button variant="secondary" loading={actionLoading === 'info'} disabled={Boolean(actionLoading)} onClick={handleRequestInformation}>
            {t('Request information')}
        </Button>
        <Button variant="danger" loading={actionLoading === 'reject'} disabled={Boolean(actionLoading)} onClick={() => setShowRejectDialog(true)}>
            {t('Reject')}
        </Button>
    </>
)}
{isMoreInfo && (
    <>
        <Button variant="secondary" loading={actionLoading === 'info'} disabled={Boolean(actionLoading)} onClick={handleRequestInformation}>
            {t('Request information')}
        </Button>
        <p className="text-sm text-gray-500">
            {t('The applicant needs to update the application before it can be approved or rejected.')}
        </p>
    </>
)}
            {isApproved && (
              <Button variant="danger" loading={actionLoading === 'suspend'} disabled={Boolean(actionLoading)} onClick={handleSuspend}>
                {t('Suspend')}
              </Button>
            )}
            {isSuspended && (
              <Button variant="primary" loading={actionLoading === 'reactivate'} disabled={Boolean(actionLoading)} onClick={handleReactivate}>
                {t('Reactivate')}
              </Button>
            )}
            <Link to="/businesses">
              <Button variant="outline">{t('Back')}</Button>
            </Link>
          </div>
        }
      />

      {/* Overview stat cards — business-level analysis */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t('Shops')} value={formatNumber(overview.shops)} hint={t('Owned by this business')} />
        <StatCard label={t('Products')} value={formatNumber(overview.products)} hint={t('Across all shops')} />
        <StatCard label={t('Orders')} value={formatNumber(overview.orders)} hint={t('Across all shops')} />
        <StatCard
          label={t('Verification')}
          value={overview.score != null ? `${overview.score}/100` : '—'}
          hint={
            overview.risks.length
              ? `${overview.risks.length} risk flag${overview.risks.length === 1 ? '' : 's'}`
              : t('No risk flags')
          }
        />
      </div>

      <Tabs activeTab={activeTab} onChange={setActiveTab} tabs={tabs} />

      <TabContent>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Card>
                <p className="card-h2 mb-4 dark:text-white">{t('Applicant')}</p>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Owner')}</dt>
                    <dd className="text-gray-900 dark:text-white">{overview.ownerName || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Email')}</dt>
                    <dd className="text-gray-900 dark:text-white break-all">
                      {overview.ownerEmail || bi.email || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Type')}</dt>
                    <dd className="text-gray-900 dark:text-white capitalize">{application.sellerType || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Submitted')}</dt>
                    <dd className="text-gray-900 dark:text-white">
                      {formatDate(application.submittedAt || application.createdAt)}
                    </dd>
                  </div>
                </dl>
              </Card>

              <Card>
                <p className="card-h2 mb-4 dark:text-white">{t('Business')}</p>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Name')}</dt>
                    <dd className="text-gray-900 dark:text-white">{businessName}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Category')}</dt>
                    <dd className="text-gray-900 dark:text-white">{bi.businessCategory || (business as any)?.sector || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Phone')}</dt>
                    <dd className="text-gray-900 dark:text-white">{bi.phone || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Description')}</dt>
                    <dd className="text-gray-900 dark:text-white">{bi.description || '—'}</dd>
                  </div>
                </dl>
              </Card>

              <Card>
                <p className="card-h2 mb-4 dark:text-white">{t('Location')}</p>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Hierarchy')}</dt>
                    <dd className="text-gray-900 dark:text-white">
                      {overview.location.length ? overview.location.join(' › ') : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Landmark')}</dt>
                    <dd className="text-gray-900 dark:text-white">{loc.landmark || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Coordinates')}</dt>
                    <dd className="text-gray-900 dark:text-white">
                      {loc.latitude && loc.longitude ? `${loc.latitude}, ${loc.longitude}` : '—'}
                    </dd>
                  </div>
                </dl>
              </Card>
            </div>

            {overview.risks.length > 0 && (
              <Card className="border-l-4 border-amber-500">
                <p className="card-h2 mb-3 dark:text-white">{t('Risk flags')}</p>
                <ul className="flex flex-wrap gap-2">
                  {overview.risks.map((flag: string) => (
                    <li key={flag}>
                      <StatusBadge label={flag} variant="warning" />
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {overview.reviewedAt && (
              <Card>
                <p className="card-h2 mb-4 dark:text-white">{t('Review')}</p>
                <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <dt className="text-gray-500 dark:text-gray-400">{t('Reviewed by')}</dt>
                  <dd className="text-gray-900 dark:text-white">{overview.reviewedByName || '—'}</dd>
                  <dt className="text-gray-500 dark:text-gray-400">{t('Reviewed at')}</dt>
                  <dd className="text-gray-900 dark:text-white">{formatDate(overview.reviewedAt)}</dd>
                  {overview.rejectionReason && (
                    <>
                      <dt className="text-gray-500 dark:text-gray-400">{t('Reason')}</dt>
                      <dd className="text-gray-900 dark:text-white">{overview.rejectionReason}</dd>
                    </>
                  )}
                </dl>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'shops' && (
          <div className="space-y-4">
            {shops.length === 0 ? (
              <EmptyState
                title={t('No shops yet')}
                description={
                  isApproved
                    ? t('This business has been approved but has not created a shop yet.')
                    : t('Shops appear here after the business is approved and onboarding completes.')
                }
              />
            ) : (
              shops.map((shop) => {
                const canSuspend = shop.status === 'APPROVED' || shop.status === 'ACTIVE';
                const canActivate = shop.status === 'SUSPENDED' || shop.status === 'INACTIVE';
                return (
                  <Card key={shop.id} className="overflow-hidden">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/stores/${shop.id}`}
                            className="text-base font-semibold text-gray-900 hover:text-primary-dark dark:text-white dark:hover:text-primary-color"
                          >
                            {shop.name || t('Unnamed shop')}
                          </Link>
                          <StatusBadge label={shop.status} />
                          {shop.showOnPublic === false && (
                            <StatusBadge label={t('Hidden')} variant="neutral" />
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{shopLocation(shop)}</p>
                        {shop.deliveryCoverage && (
                          <p className="mt-0.5 text-xs font-medium ${
                            shop.deliveryCoverage.status === 'ACTIVE' ? 'text-green-700 dark:text-green-500' : 'text-amber-700 dark:text-amber-500'
                          }">
                            {shop.deliveryCoverage.status} • {shop.deliveryCoverage.zoneIds?.length ?? 0} zone{shop.deliveryCoverage.zoneIds?.length !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-semibold text-gray-900 dark:text-white">{formatNumber(shop.productCount || 0)}</p>
                          <p className="text-xs text-gray-500">{t('Products')}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-gray-900 dark:text-white">{formatNumber(shop.orders || 0)}</p>
                          <p className="text-xs text-gray-500">{t('Orders')}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {/* Products open on the Products page filtered to this
                              shop — the same destination the shop's own detail
                              page uses, so the catalogue is never rendered a
                              second time as a nested list here. */}
                          <Link to={`/commerce/products?shopId=${shop.id}`}>
                            <Button variant="outline" size="sm">{t('View products')}</Button>
                          </Link>
                          <Link to={`/stores/${shop.id}`}>
                            <Button variant="secondary" size="sm">{t('Manage')}</Button>
                          </Link>
                          {canSuspend && (
                            <Button
                              variant="danger"
                              size="sm"
                              loading={busyShopId === shop.id}
                              onClick={() => handleShopSuspend(shop.id)}
                            >
                              {t('Suspend')}
                            </Button>
                          )}
                          {canActivate && (
                            <Button
                              variant="primary"
                              size="sm"
                              loading={busyShopId === shop.id}
                              onClick={() => handleShopActivate(shop.id)}
                            >
                              {t('Activate')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                  </Card>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'application' && (
          <div className="space-y-6">
            <Card>
              <p className="card-h2 mb-4 dark:text-white">{t('Business information')}</p>
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <dt className="text-gray-500 dark:text-gray-400">{t('Business name')}</dt>
                <dd className="text-gray-900 dark:text-white">{bi.businessName || '—'}</dd>
                <dt className="text-gray-500 dark:text-gray-400">{t('Category')}</dt>
                <dd className="text-gray-900 dark:text-white">{bi.businessCategory || '—'}</dd>
                <dt className="text-gray-500 dark:text-gray-400">{t('Email')}</dt>
                <dd className="text-gray-900 dark:text-white break-all">{bi.email || '—'}</dd>
                <dt className="text-gray-500 dark:text-gray-400">{t('Phone')}</dt>
                <dd className="text-gray-900 dark:text-white">{bi.phone || '—'}</dd>
                <dt className="text-gray-500 dark:text-gray-400">{t('Description')}</dt>
                <dd className="text-gray-900 dark:text-white">{bi.description || '—'}</dd>
              </dl>
            </Card>

            <Card>
              <p className="card-h2 mb-4 dark:text-white">{t('Shop Information')}</p>
              {application.shopInformation ? (
                <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <dt className="text-gray-500 dark:text-gray-400">{t('Shop name')}</dt>
                  <dd className="text-gray-900 dark:text-white">
                    {application.shopInformation.shopName || '—'}
                  </dd>
                  <dt className="text-gray-500 dark:text-gray-400">{t('Category')}</dt>
                  <dd className="text-gray-900 dark:text-white">{application.shopInformation.category || '—'}</dd>
                  <dt className="text-gray-500 dark:text-gray-400">{t('Public phone')}</dt>
                  <dd className="text-gray-900 dark:text-white">
                    {application.shopInformation.publicPhone || '—'}
                  </dd>
                  <dt className="text-gray-500 dark:text-gray-400">{t('Public email')}</dt>
                  <dd className="text-gray-900 dark:text-white break-all">
                    {application.shopInformation.publicEmail || '—'}
                  </dd>
                  <dt className="text-gray-500 dark:text-gray-400">{t('Description')}</dt>
                  <dd className="text-gray-900 dark:text-white">
                    {application.shopInformation.description || '—'}
                  </dd>
                </dl>
              ) : (
                <p className="text-sm text-gray-500">—</p>
              )}
            </Card>

            {application.shop && (
              <Card className="border-l-4 border-green-500">
                <p className="card-h2 mb-3 dark:text-white">{t('Linked Shop')}</p>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <Link
                    to={`/stores/${application.shop.id}`}
                    className="font-semibold text-primary-dark hover:underline dark:text-primary-color"
                  >
                    {application.shop.name || '—'}
                  </Link>
                  <StatusBadge label={application.shop.status || '—'} />
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <Card>
            <p className="card-h2 mb-4 dark:text-white">{t('Review History')}</p>
            {application.review ? (
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Reviewed by')}</dt>
                  <dd className="text-gray-900 dark:text-white">
                    {overview.reviewedByName || application.review.reviewedBy || 'System'}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Reviewed at')}</dt>
                  <dd className="text-gray-900 dark:text-white">{formatDate(application.review.reviewedAt)}</dd>
                </div>
                {application.review.rejectionReason && (
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Reason')}</dt>
                    <dd className="text-gray-900 dark:text-white">{application.review.rejectionReason}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-sm text-gray-500">{t('No review recorded yet.')}</p>
            )}

            {Array.isArray((application as any).timeline) && (application as any).timeline.length > 0 && (
              <div className="mt-6 border-t border-gray-100 pt-4 dark:border-dark-700">
                <p className="card-h2 mb-3 dark:text-white">{t('Timeline')}</p>
                <ol className="space-y-3">
                  {(application as any).timeline.map((entry: any, idx: number) => (
                    <li key={`${entry.status}-${idx}`} className="flex flex-wrap items-center gap-2 text-sm">
                      <StatusBadge label={entry.status} />
                      <span className="text-gray-500">{formatDate(entry.changedAt)}</span>
                      {entry.changedBy && <span className="text-gray-700 dark:text-gray-300">· {entry.changedBy}</span>}
                      {entry.reason && <span className="text-gray-500">— {entry.reason}</span>}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </Card>
        )}
      </TabContent>

      {isRejected && (
        <p className="text-sm text-red-600">{t('This application has been rejected.')}</p>
      )}

      {showRejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="max-w-md w-full mx-4">
            <h3 className="heading-5 dark:text-white mb-3">{t('Reject Application?')}</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t('Enter rejection reason...')}
              className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 px-3 py-2 text-sm text-gray-900 dark:text-white mb-4"
              rows={3}
            />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowRejectDialog(false)}>
                {t('Cancel')}
              </Button>
              <Button variant="danger" className="flex-1" loading={actionLoading} onClick={handleReject}>
                {t('Reject')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
