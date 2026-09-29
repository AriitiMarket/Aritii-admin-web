import { useState, type MouseEvent } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { useUserDirectory } from '@/hooks/useUserDirectory';
import { UserPicker } from '@/components/forms/UserPicker';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/useToast';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { ErrorState } from '@/components/common/ErrorState';
import { Pagination } from '@/components/common/Pagination';
import { StatCard } from '@/components/common/StatCard';
import { StatusBadge, type StatusVariant } from '@/components/common/StatusBadge';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { SelectField } from '@/components/forms/SelectField';
import { TextField } from '@/components/forms/TextField';
import { Tabs } from '@/components/common/Tabs';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { formatDate, formatDateTime } from '@/utils/format';
import { apiErrorMessage } from '@/utils/error';
import {
  requestsAdmin,
  type AdminRequestReport,
  type AdminRequestRow,
} from '@/api/admin';

const PAGE_SIZE = 10;

/** Stage tabs — every tab is a server-side `tab` value (see listAll). */
const TABS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'agreed', label: 'Agreed' },
  { value: 'ordered', label: 'Ordered' },
  { value: 'closed', label: 'Closed' },
  { value: 'reported', label: 'Reported' },
  { value: 'suspended', label: 'Suspended' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'REVIEWING', label: 'In review' },
  { value: 'NEGOTIATING', label: 'Negotiating' },
  { value: 'AGREED', label: 'Agreed' },
  { value: 'CONVERTED', label: 'Converted' },
  { value: 'DECLINED', label: 'Declined' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'EXPIRED', label: 'Expired' },
];

const STATUS_VARIANTS: Record<string, StatusVariant> = {
  PENDING: 'warning',
  REVIEWING: 'info',
  NEGOTIATING: 'info',
  AGREED: 'success',
  CONVERTED: 'success',
  DECLINED: 'danger',
  CANCELLED: 'neutral',
  EXPIRED: 'danger',
  ACTIVE: 'warning',
  SUPERSEDED: 'neutral',
  ACCEPTED: 'success',
  OPEN: 'warning',
  RESOLVED: 'success',
  DISMISSED: 'neutral',
};

/** A request in a terminal state can no longer be closed by an admin. */
const TERMINAL_STATUSES = new Set(['CONVERTED', 'CANCELLED', 'DECLINED', 'EXPIRED']);

function money(value: number | null | undefined): string {
  return value == null ? '—' : `ETB ${value.toLocaleString()}`;
}

function buyerLabel(
  row: AdminRequestRow,
  nameFor: (id?: string | null) => string = () => ''
): string {
  return row.buyer?.name || row.buyer?.email || nameFor(row.buyerId) || '—';
}

/**
 * Did a BUYER write this offer? `createdByRole` is canonical `BUYER`; older
 * stored offers still carry the legacy `CUSTOMER` spelling.
 */
function isBuyerOffer(role?: string | null): boolean {
  return role === 'BUYER' || role === 'CUSTOMER';
}

function attachmentUrl(attachment: { url?: string } | string): string {
  return typeof attachment === 'string' ? attachment : attachment.url || '';
}

/** Human label for a server activity type (`request.created` → …). */
function activityTitle(type: string): string {
  return type
    .replace(/^request\.|^admin\.|^offer\.|^agreement\.|^message\.|^order\./, '')
    .replace(/[._]+/g, ' ')
    .replace(/^./, (char) => char.toUpperCase());
}

export function RequestsManagementPage() {
  const { t } = useLocalization();
  const { showToast } = useToast();

  const [page, setPage] = useState(1);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [buyerFilter, setBuyerFilter] = useState('');
  const [sellerFilter, setSellerFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const debouncedBuyer = useDebounce(buyerFilter, 300);
  const debouncedSeller = useDebounce(sellerFilter, 300);

  const [detail, setDetail] = useState<AdminRequestRow | null>(null);
  const [closeTarget, setCloseTarget] = useState<AdminRequestRow | null>(null);
  const [reason, setReason] = useState('');
  const [closing, setClosing] = useState(false);

  const [suspendTarget, setSuspendTarget] = useState<AdminRequestRow | null>(null);
  const [suspending, setSuspending] = useState(false);

  const [reviewTarget, setReviewTarget] = useState<{
    row: AdminRequestRow;
    report: AdminRequestReport;
  } | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'RESOLVED' | 'DISMISSED'>('RESOLVED');
  const [resolution, setResolution] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const [restrictTarget, setRestrictTarget] = useState<AdminRequestRow | null>(null);
  const [restrictForm, setRestrictForm] = useState({
    userId: '',
    scope: 'BUYER' as 'BUYER' | 'SELLER' | 'BOTH',
    kind: 'TEMPORARY' as 'TEMPORARY' | 'PERMANENT',
    until: '',
    reason: '',
  });
  const [restricting, setRestricting] = useState(false);

  const [removeTarget, setRemoveTarget] = useState<{
    row: AdminRequestRow;
    index: number;
  } | null>(null);
  const [removing, setRemoving] = useState(false);

  const hasAdvancedFilters =
    Boolean(
      debouncedBuyer ||
        debouncedSeller ||
        productFilter ||
        fromDate ||
        toDate ||
        minPrice ||
        maxPrice
    ) || Boolean(status);

  const list = useAsync(
    () =>
      requestsAdmin.list({
        page,
        limit: PAGE_SIZE,
        ...(tab !== 'all' ? { tab } : {}),
        ...(tab === 'all' && status ? { status } : {}),
        q: debouncedSearch.trim(),
        buyer: debouncedBuyer.trim(),
        seller: debouncedSeller.trim(),
        productId: productFilter.trim(),
        from: fromDate,
        to: toDate,
        minPrice,
        maxPrice,
      }),
    [
      page,
      tab,
      status,
      debouncedSearch,
      debouncedBuyer,
      debouncedSeller,
      productFilter,
      fromDate,
      toDate,
      minPrice,
      maxPrice,
    ]
  );

  const stats = useAsync(() => requestsAdmin.stats(), []);

  const messages = useAsync(
    () => (detail ? requestsAdmin.getMessages(detail.id) : Promise.resolve([])),
    [detail?.id]
  );

  // Buyers shown by NAME across the list and the open detail drawer.
  const { nameFor } = useUserDirectory([
    ...(list.data?.items ?? []).map((row) => row.buyerId),
    detail?.buyerId,
  ]);

  const resetPageAnd = (apply: () => void) => {
    setPage(1);
    apply();
  };

  const clearFilters = () => {
    resetPageAnd(() => {
      setSearch('');
      setStatus('');
      setBuyerFilter('');
      setSellerFilter('');
      setProductFilter('');
      setFromDate('');
      setToDate('');
      setMinPrice('');
      setMaxPrice('');
    });
  };

  const refreshAll = () => {
    list.refetch();
    stats.refetch();
    if (detail) list.refetch();
  };

  const openClose = (row: AdminRequestRow, event?: MouseEvent<HTMLElement>) => {
    event?.stopPropagation();
    setReason('');
    setCloseTarget(row);
  };

  const confirmClose = async () => {
    if (!closeTarget) return;
    setClosing(true);
    try {
      await requestsAdmin.close(closeTarget.id, reason.trim());
      showToast({ type: 'success', message: t('Request closed') });
      setCloseTarget(null);
      setDetail(null);
      refreshAll();
    } catch (err) {
      showToast({
        type: 'error',
        message: apiErrorMessage(err, t('Could not close this request')),
      });
    } finally {
      setClosing(false);
    }
  };

  const openSuspend = (row: AdminRequestRow, event?: MouseEvent<HTMLElement>) => {
    event?.stopPropagation();
    setReason('');
    setSuspendTarget(row);
  };

  const confirmSuspend = async () => {
    if (!suspendTarget) return;
    setSuspending(true);
    try {
      const updated = await requestsAdmin.suspend(suspendTarget.id, reason.trim());
      showToast({ type: 'success', message: t('Request suspended') });
      setSuspendTarget(null);
      setDetail(updated);
      refreshAll();
    } catch (err) {
      showToast({
        type: 'error',
        message: apiErrorMessage(err, t('Could not suspend this request')),
      });
    } finally {
      setSuspending(false);
    }
  };

  const restoreRequest = async (row: AdminRequestRow, event?: MouseEvent<HTMLElement>) => {
    event?.stopPropagation();
    try {
      const updated = await requestsAdmin.restore(row.id);
      showToast({ type: 'success', message: t('Request restored') });
      setDetail((current) => (current && current.id === row.id ? updated : current));
      refreshAll();
    } catch (err) {
      showToast({
        type: 'error',
        message: apiErrorMessage(err, t('Could not restore this request')),
      });
    }
  };

  const openReview = (
    row: AdminRequestRow,
    report: AdminRequestReport,
    event?: MouseEvent<HTMLElement>
  ) => {
    event?.stopPropagation();
    setReviewTarget({ row, report });
    setReviewStatus('RESOLVED');
    setResolution('');
  };

  const confirmReview = async () => {
    if (!reviewTarget) return;
    setReviewing(true);
    try {
      const updated = await requestsAdmin.reviewReport(
        reviewTarget.row.id,
        reviewTarget.report.id,
        reviewStatus,
        resolution.trim()
      );
      showToast({ type: 'success', message: t('Report reviewed') });
      setReviewTarget(null);
      setDetail(updated);
      refreshAll();
    } catch (err) {
      showToast({
        type: 'error',
        message: apiErrorMessage(err, t('Could not review this report')),
      });
    } finally {
      setReviewing(false);
    }
  };

  const openRestrict = (row: AdminRequestRow, event?: MouseEvent<HTMLElement>) => {
    event?.stopPropagation();
    setRestrictForm({
      userId: row.buyerId || row.sellerId || '',
      scope: row.buyerId ? 'BUYER' : 'SELLER',
      kind: 'TEMPORARY',
      until: '',
      reason: '',
    });
    setRestrictTarget(row);
  };

  const confirmRestrict = async () => {
    if (!restrictTarget || !restrictForm.userId.trim()) {
      showToast({ type: 'error', message: t('Select a user first') });
      return;
    }
    setRestricting(true);
    try {
      await requestsAdmin.createRestriction({
        userId: restrictForm.userId.trim(),
        scope: restrictForm.scope,
        kind: restrictForm.kind,
        ...(restrictForm.kind === 'TEMPORARY' && restrictForm.until
          ? { until: new Date(restrictForm.until).toISOString() }
          : {}),
        reason: restrictForm.reason.trim(),
      });
      showToast({ type: 'success', message: t('User restricted from requests') });
      setRestrictTarget(null);
      stats.refetch();
    } catch (err) {
      showToast({
        type: 'error',
        message: apiErrorMessage(err, t('Could not restrict this user')),
      });
    } finally {
      setRestricting(false);
    }
  };

  const openRemoveAttachment = (
    row: AdminRequestRow,
    index: number,
    event?: MouseEvent<HTMLElement>
  ) => {
    event?.stopPropagation();
    setRemoveTarget({ row, index });
  };

  const confirmRemoveAttachment = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      const updated = await requestsAdmin.removeAttachment(
        removeTarget.row.id,
        removeTarget.index
      );
      showToast({ type: 'success', message: t('Attachment removed') });
      setRemoveTarget(null);
      setDetail(updated);
      refreshAll();
    } catch (err) {
      showToast({
        type: 'error',
        message: apiErrorMessage(err, t('Could not remove this attachment')),
      });
    } finally {
      setRemoving(false);
    }
  };

  const columns: Column<AdminRequestRow>[] = [
    {
      key: 'title',
      header: t('Request'),
      render: (row) => (
        <span className="font-medium text-gray-800 dark:text-gray-100">
          {row.title || '—'}
          {row.suspended && (
            <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
              {t('Suspended')}
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'buyer',
      header: t('Buyer'),
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {buyerLabel(row, nameFor)}
        </span>
      ),
    },
    {
      key: 'seller',
      header: t('Seller'),
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.sellerName || (row.shopId ? row.shopId.slice(-6) : t('Open to all'))}
        </span>
      ),
    },
    {
      key: 'quantity',
      header: t('Quantity'),
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.quantity} {row.unit || ''}
        </span>
      ),
    },
    {
      key: 'targetPrice',
      header: t('Target price'),
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {money(row.targetPrice)}
        </span>
      ),
    },
    {
      key: 'offers',
      header: t('Current offer'),
      render: (row) => {
        const active =
          [...row.offers].reverse().find((offer) => offer.status === 'ACTIVE') ||
          [...row.offers].reverse().find((offer) => offer.status === 'ACCEPTED');
        return (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {active ? money(active.totalPrice) : '—'}
          </span>
        );
      },
    },
    {
      key: 'reports',
      header: t('Reports'),
      render: (row) => {
        const openReports = (row.reports || []).filter(
          (report) => report.status === 'OPEN'
        ).length;
        return openReports > 0 ? (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-800">
            {openReports} {t('open')}
          </span>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        );
      },
    },
    {
      key: 'status',
      header: t('Status'),
      render: (row) => (
        <StatusBadge
          label={row.status || '—'}
          variant={STATUS_VARIANTS[row.status] || 'neutral'}
        />
      ),
    },
    {
      key: 'createdAt',
      header: t('Created'),
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (row) => (
        <span className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="outline" onClick={() => setDetail(row)}>
            {t('View')}
          </Button>
          {row.suspended ? (
            <Button size="sm" variant="secondary" onClick={(event) => restoreRequest(row, event)}>
              {t('Restore')}
            </Button>
          ) : (
            <Button size="sm" variant="danger" onClick={(event) => openClose(row, event)}>
              {t('Close')}
            </Button>
          )}
        </span>
      ),
    },
  ];

  const summary = stats.data;

  return (
    <div>
      <PageHeader
        title={t('Requests')}
        description={t('Customer-to-seller product requests')}
        actions={
          <SearchInput
            value={search}
            onChange={(next) => {
              resetPageAnd(() => setSearch(next));
            }}
            placeholder={t('Search requests')}
            aria-label={t('Search')}
          />
        }
      />

      {summary && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            label={t('Total requests')}
            value={String(summary.total)}
            hint={t('All time')}
          />
          <StatCard
            label={t('Active')}
            value={String(summary.active ?? 0)}
            hint={t('Pending and in review')}
          />
          <StatCard
            label={t('Negotiating')}
            value={String(summary.negotiating ?? 0)}
            hint={t('Offers in flight')}
          />
          <StatCard
            label={t('Agreed')}
            value={String(summary.agreed)}
            hint={t('Awaiting order')}
          />
          <StatCard
            label={t('Ordered')}
            value={String(summary.ordered ?? summary.converted)}
            hint={`${t('Conversion rate')}: ${summary.conversionRate}%`}
          />
          <StatCard
            label={t('Reported')}
            value={String(summary.reported ?? 0)}
            hint={`${t('Open reports')}: ${summary.openReports ?? 0}`}
          />
        </div>
      )}

      <Tabs
        activeTab={tab}
        onChange={(next) =>
          resetPageAnd(() => {
            setTab(next);
            setStatus('');
          })
        }
        tabs={TABS}
      />

      <div className="mb-6 mt-4 grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-4">
        <SelectField
          value={status}
          onChange={(e) => {
            resetPageAnd(() => {
              setStatus(e.target.value);
              setTab('all');
            });
          }}
          options={STATUS_OPTIONS}
          label={t('Status')}
        />
        <TextField
          label={t('Buyer')}
          placeholder={t('Name, email or id')}
          value={buyerFilter}
          onChange={(e) => resetPageAnd(() => setBuyerFilter(e.target.value))}
        />
        <TextField
          label={t('Seller')}
          placeholder={t('Shop name or id')}
          value={sellerFilter}
          onChange={(e) => resetPageAnd(() => setSellerFilter(e.target.value))}
        />
        <TextField
          label={t('Product')}
          placeholder={t('Product id')}
          value={productFilter}
          onChange={(e) => resetPageAnd(() => setProductFilter(e.target.value))}
        />
        <TextField
          label={t('From')}
          type="date"
          value={fromDate}
          onChange={(e) => resetPageAnd(() => setFromDate(e.target.value))}
        />
        <TextField
          label={t('To')}
          type="date"
          value={toDate}
          onChange={(e) => resetPageAnd(() => setToDate(e.target.value))}
        />
        <TextField
          label={t('Min price')}
          type="number"
          min={0}
          placeholder="0"
          value={minPrice}
          onChange={(e) => resetPageAnd(() => setMinPrice(e.target.value))}
        />
        <TextField
          label={t('Max price')}
          type="number"
          min={0}
          placeholder="—"
          value={maxPrice}
          onChange={(e) => resetPageAnd(() => setMaxPrice(e.target.value))}
        />
        {hasAdvancedFilters && (
          <div className="flex items-end">
            <Button variant="outline" onClick={clearFilters}>
              {t('Clear filters')}
            </Button>
          </div>
        )}
      </div>

      {list.error ? (
        <ErrorState message={list.error} onRetry={list.refetch} />
      ) : (
        <>
          <DataTable<AdminRequestRow>
            columns={columns}
            rows={list.data?.items ?? []}
            rowKey={(row) => row.id}
            loading={list.loading}
            emptyTitle={t('No requests')}
            emptyDescription={t('No request matches the current filters')}
            onRowClick={(row) => setDetail(row)}
          />
          <Pagination
            className="mt-4"
            page={page}
            totalPages={list.data?.totalPages ?? 0}
            total={list.data?.total}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Request detail — full moderation context before intervening */}
      {detail && (
        <Modal open onClose={() => setDetail(null)} title={detail.title || t('Request')} size="lg">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                label={detail.status}
                variant={STATUS_VARIANTS[detail.status] || 'neutral'}
              />
              {detail.suspended && (
                <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                  {t('Suspended')}: {detail.suspendReason || t('no reason given')}
                </span>
              )}
              <span className="text-xs text-gray-500">
                {t('Created')} {formatDateTime(detail.createdAt)}
              </span>
              {detail.expiresAt && (
                <span className="text-xs text-gray-500">
                  {t('Expires')} {formatDateTime(detail.expiresAt)}
                </span>
              )}
            </div>

            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">{t('Buyer')}</dt>
                <dd className="text-sm text-gray-700 dark:text-gray-200">{buyerLabel(detail, nameFor)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">{t('Seller')}</dt>
                <dd className="text-sm text-gray-700 dark:text-gray-200">
                  {detail.sellerName || (detail.shopId ? detail.shopId.slice(-6) : t('Open to all'))}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">{t('Product')}</dt>
                <dd className="text-sm text-gray-700 dark:text-gray-200">
                  {detail.productName || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">{t('Quantity')}</dt>
                <dd className="text-sm text-gray-700 dark:text-gray-200">
                  {detail.quantity} {detail.unit || ''}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">
                  {t('Target price')}
                </dt>
                <dd className="text-sm text-gray-700 dark:text-gray-200">
                  {money(detail.targetPrice)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">{t('Order')}</dt>
                <dd className="text-sm text-gray-700 dark:text-gray-200">
                  {detail.orderId ? `#${String(detail.orderId).slice(-6).toUpperCase()}` : '—'}
                </dd>
              </div>
            </dl>

            {detail.details && (
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-gray-400">
                  {t('Details')}
                </p>
                <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">
                  {detail.details}
                </p>
              </div>
            )}

            {Object.keys(detail.specs || {}).length > 0 && (
              <div>
                <p className="mb-1.5 text-xs uppercase tracking-wide text-gray-400">
                  {t('Requirements')}
                </p>
                <ul className="flex flex-wrap gap-2">
                  {Object.entries(detail.specs || {}).map(([key, value]) => (
                    <li
                      key={key}
                      className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700 dark:bg-dark-700 dark:text-gray-300"
                    >
                      <span className="font-semibold">{key}</span>: {value}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Attachments — each removable by a moderator */}
            {(detail.attachments?.length ?? 0) > 0 && (
              <div>
                <p className="mb-1.5 text-xs uppercase tracking-wide text-gray-400">
                  {t('Attachments')}
                </p>
                <div className="flex flex-wrap gap-3">
                  {(detail.attachments || []).map((attachment, index) => {
                    const url = attachmentUrl(attachment);
                    if (!url) return null;
                    return (
                      <div key={`${url}-${index}`} className="w-24">
                        <img
                          src={url}
                          alt={`${t('Attachment')} ${index + 1}`}
                          className="h-24 w-24 rounded-md border border-gray-200 object-cover dark:border-dark-600"
                        />
                        <button
                          type="button"
                          onClick={(event) => openRemoveAttachment(detail, index, event)}
                          className="mt-1 w-full rounded border border-red-200 py-0.5 text-[11px] font-medium text-red-600 hover:bg-red-50 dark:border-red-900"
                        >
                          {t('Remove')}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price history — every offer, with what it replaced */}
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-gray-400">
                {t('Price history')}
              </p>
              {(detail.offers?.length ?? 0) === 0 ? (
                <p className="text-sm text-gray-500">{t('No offers yet')}</p>
              ) : (
                <ul className="space-y-2">
                  {[...detail.offers].reverse().map((offer, index) => (
                    <li
                      key={`${offer.unitPrice}-${index}`}
                      className="rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-dark-600"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span>
                          {offer.quantity} {offer.unit || ''} × ETB{' '}
                          {offer.unitPrice.toLocaleString()} = ETB{' '}
                          {offer.totalPrice.toLocaleString()}
                          <span className="ml-2 text-xs text-gray-400">
                            {isBuyerOffer(offer.createdByRole) ? t('Buyer') : t('Seller')}
                          </span>
                        </span>
                        <StatusBadge label={offer.status} variant={STATUS_VARIANTS[offer.status] || 'neutral'} />
                      </div>
                      {offer.previous && (
                        <p className="mt-1 text-xs text-amber-700">
                          {t('Previous')}: {offer.previous.quantity} ×{' '}
                          {offer.previous.unitPrice?.toLocaleString()} ={' '}
                          {(offer.previous.totalPrice ??
                            (offer.previous.quantity || 0) * (offer.previous.unitPrice || 0)
                          ).toLocaleString()}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Agreement — dual confirmation state + final terms */}
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-gray-400">
                {t('Agreement')}
              </p>
              {detail.agreement || detail.status === 'AGREED' ? (
                <div className="rounded-md border border-gray-200 p-3 text-sm dark:border-dark-600">
                  <div className="flex flex-wrap gap-x-6 gap-y-1">
                    <span>
                      {t('Buyer')}:{' '}
                      {detail.agreement?.buyerConfirmedAt
                        ? formatDateTime(detail.agreement.buyerConfirmedAt)
                        : t('Not confirmed')}
                    </span>
                    <span>
                      {t('Seller')}:{' '}
                      {detail.agreement?.sellerConfirmedAt
                        ? formatDateTime(detail.agreement.sellerConfirmedAt)
                        : t('Not confirmed')}
                    </span>
                  </div>
                  {detail.agreement?.terms && (
                    <p className="mt-2 font-medium text-gray-800 dark:text-gray-100">
                      {detail.agreement.terms.quantity} {detail.agreement.terms.unit || ''} × ETB{' '}
                      {detail.agreement.terms.unitPrice.toLocaleString()} = ETB{' '}
                      {detail.agreement.terms.totalPrice.toLocaleString()}
                      {detail.agreement.confirmedAt && (
                        <span className="ml-2 text-xs font-semibold text-green-700">
                          {t('Confirmed both sides')}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">{t('No agreement yet')}</p>
              )}
            </div>

            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-gray-400">
                {t('Conversation')}
              </p>
              {messages.loading ? (
                <p className="text-sm text-gray-500">{t('Loading')}</p>
              ) : (messages.data ?? []).length === 0 ? (
                <p className="text-sm text-gray-500">{t('No messages yet')}</p>
              ) : (
                <ul className="max-h-56 space-y-2 overflow-y-auto pr-1">
                  {(messages.data ?? []).map((message) => (
                    <li
                      key={message.id}
                      className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-dark-700 dark:text-gray-200"
                    >
                      <span className="text-xs text-gray-400">
                        {formatDateTime(message.createdAt)} ·{' '}
                        {String(message.sender) === detail.buyerId
                          ? t('Buyer')
                          : t('Seller')}
                        {message.type && message.type !== 'text' && (
                          <span className="ml-1 rounded bg-gray-200 px-1 py-0.5 dark:bg-dark-600">
                            {message.type}
                          </span>
                        )}
                      </span>
                      <p className="whitespace-pre-wrap">{message.text}</p>
                      {Array.isArray(message.images) && message.images.length > 0 && (
                        <p className="text-xs text-gray-400">
                          {message.images.length} {t('image(s)')}
                          {message.label ? ` · ${message.label}` : ''}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Activity log — the server's own audit trail of this request */}
            {(detail.activity?.length ?? 0) > 0 && (
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-gray-400">
                  {t('Activity')}
                </p>
                <ul className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
                  {[...(detail.activity || [])].reverse().map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-start justify-between gap-3 text-xs text-gray-600 dark:text-gray-300"
                    >
                      <span>
                        <span className="font-semibold">{activityTitle(entry.type)}</span>
                        {entry.summary ? ` — ${entry.summary}` : ''}
                      </span>
                      <span className="whitespace-nowrap text-gray-400">
                        {formatDateTime(entry.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reports — open ones can be reviewed right here */}
            {(detail.reports?.length ?? 0) > 0 && (
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-gray-400">
                  {t('Reports')}
                </p>
                <ul className="space-y-2">
                  {detail.reports!.map((report) => (
                    <li
                      key={report.id}
                      className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm dark:border-amber-900 dark:bg-amber-900/20"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span>
                          <span className="font-semibold">{report.category}</span> —{' '}
                          {report.reason}
                        </span>
                        <span className="flex items-center gap-2">
                          <StatusBadge
                            label={report.status}
                            variant={STATUS_VARIANTS[report.status] || 'neutral'}
                          />
                          {report.status === 'OPEN' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(event) => openReview(detail, report, event)}
                            >
                              {t('Review report')}
                            </Button>
                          )}
                        </span>
                      </div>
                      {report.message && (
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                          {report.message}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-gray-400">
                        {formatDateTime(report.createdAt)}
                        {report.resolution ? ` · ${report.resolution}` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4 dark:border-dark-600">
              <Button variant="outline" onClick={() => setDetail(null)}>
                {t('Close')}
              </Button>
              <Button variant="secondary" onClick={(event) => openRestrict(detail, event)}>
                {t('Restrict')}
              </Button>
              {detail.suspended ? (
                <Button variant="secondary" onClick={(event) => restoreRequest(detail, event)}>
                  {t('Restore')}
                </Button>
              ) : (
                <>
                  <Button variant="danger" onClick={(event) => openSuspend(detail, event)}>
                    {t('Suspend')}
                  </Button>
                  {!TERMINAL_STATUSES.has(detail.status) && (
                    <Button variant="danger" onClick={(event) => openClose(detail, event)}>
                      {t('Close request')}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Admin intervention — the reason is stored on the request and audited */}
      {closeTarget && (
        <Modal
          open
          onClose={() => setCloseTarget(null)}
          title={t('Close request')}
          size="sm"
        >
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('This marks the request as declined and stops the negotiation.')}
          </p>
          <label className="mt-4 block text-sm font-medium text-gray-700 dark:text-gray-200">
            {t('Reason')}
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              placeholder={t('Reported as abusive, spam, off-topic…')}
              className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-dark dark:border-dark-600 dark:bg-dark-900 dark:text-white"
            />
          </label>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCloseTarget(null)}>
              {t('Cancel')}
            </Button>
            <Button variant="danger" loading={closing} onClick={confirmClose}>
              {t('Close request')}
            </Button>
          </div>
        </Modal>
      )}

      {/* Suspend — freezes every write on the request until restored */}
      {suspendTarget && (
        <Modal
          open
          onClose={() => setSuspendTarget(null)}
          title={t('Suspend request')}
          size="sm"
        >
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('While suspended, neither side can send messages, offers or confirmations.')}
          </p>
          <label className="mt-4 block text-sm font-medium text-gray-700 dark:text-gray-200">
            {t('Reason')}
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              placeholder={t('Under review, reported abuse…')}
              className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-dark dark:border-dark-600 dark:bg-dark-900 dark:text-white"
            />
          </label>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSuspendTarget(null)}>
              {t('Cancel')}
            </Button>
            <Button variant="danger" loading={suspending} onClick={confirmSuspend}>
              {t('Suspend')}
            </Button>
          </div>
        </Modal>
      )}

      {/* Review a report — resolve or dismiss, both are audited */}
      {reviewTarget && (
        <Modal
          open
          onClose={() => setReviewTarget(null)}
          title={t('Review report')}
          size="sm"
        >
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-semibold">{reviewTarget.report.category}</span> —{' '}
            {reviewTarget.report.reason}
          </p>
          {reviewTarget.report.message && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {reviewTarget.report.message}
            </p>
          )}
          <div className="mt-4 space-y-3">
            <SelectField
              label={t('Outcome')}
              value={reviewStatus}
              onChange={(event) =>
                setReviewStatus(event.target.value as 'RESOLVED' | 'DISMISSED')
              }
              options={[
                { value: 'RESOLVED', label: t('Resolve — report is valid') },
                { value: 'DISMISSED', label: t('Dismiss — no action needed') },
              ]}
            />
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              {t('Resolution note')}
              <textarea
                value={resolution}
                onChange={(event) => setResolution(event.target.value)}
                rows={2}
                placeholder={t('What was done, or why the report was dismissed…')}
                className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-dark dark:border-dark-600 dark:bg-dark-900 dark:text-white"
              />
            </label>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setReviewTarget(null)}>
              {t('Cancel')}
            </Button>
            <Button variant="primary" loading={reviewing} onClick={confirmReview}>
              {t('Save outcome')}
            </Button>
          </div>
        </Modal>
      )}

      {/* Restrict a user from the requests module entirely */}
      {restrictTarget && (
        <Modal
          open
          onClose={() => setRestrictTarget(null)}
          title={t('Restrict user from requests')}
          size="sm"
        >
          <div className="space-y-3">
            <UserPicker
              label={t('User')}
              value={restrictForm.userId}
              onChange={(userId) => setRestrictForm((current) => ({ ...current, userId }))}
              role={
                restrictForm.scope === 'SELLER'
                  ? 'SELLER'
                  : restrictForm.scope === 'BUYER'
                    ? 'BUYER'
                    : undefined
              }
              placeholder={t('Search a customer or seller by name')}
            />
            <SelectField
              label={t('Scope')}
              value={restrictForm.scope}
              onChange={(event) =>
                setRestrictForm((current) => ({
                  ...current,
                  scope: event.target.value as typeof restrictForm.scope,
                }))
              }
              options={[
                { value: 'BUYER', label: t('Buyer — cannot open requests') },
                { value: 'SELLER', label: t('Seller — cannot answer requests') },
                { value: 'BOTH', label: t('Both sides') },
              ]}
            />
            <SelectField
              label={t('Kind')}
              value={restrictForm.kind}
              onChange={(event) =>
                setRestrictForm((current) => ({
                  ...current,
                  kind: event.target.value as typeof restrictForm.kind,
                }))
              }
              options={[
                { value: 'TEMPORARY', label: t('Temporary') },
                { value: 'PERMANENT', label: t('Permanent') },
              ]}
            />
            {restrictForm.kind === 'TEMPORARY' && (
              <TextField
                label={t('Until')}
                type="date"
                value={restrictForm.until}
                onChange={(event) =>
                  setRestrictForm((current) => ({ ...current, until: event.target.value }))
                }
              />
            )}
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              {t('Reason')}
              <textarea
                value={restrictForm.reason}
                onChange={(event) =>
                  setRestrictForm((current) => ({ ...current, reason: event.target.value }))
                }
                rows={2}
                className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-dark dark:border-dark-600 dark:bg-dark-900 dark:text-white"
              />
            </label>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRestrictTarget(null)}>
              {t('Cancel')}
            </Button>
            <Button variant="danger" loading={restricting} onClick={confirmRestrict}>
              {t('Restrict')}
            </Button>
          </div>
        </Modal>
      )}

      {/* Remove one attachment from a request */}
      {removeTarget && (
        <Modal
          open
          onClose={() => setRemoveTarget(null)}
          title={t('Remove attachment')}
          size="sm"
        >
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('The image is deleted from the request for both sides. This cannot be undone.')}
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>
              {t('Cancel')}
            </Button>
            <Button variant="danger" loading={removing} onClick={confirmRemoveAttachment}>
              {t('Remove')}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
