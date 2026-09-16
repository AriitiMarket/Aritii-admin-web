import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { businessesService } from '@/services/businesses.service';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/hooks/useToast';
import { useLocalization } from '@/i18n/I18nProvider';
import { Card } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { PageLoader } from '@/components/common/PageLoader';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate } from '@/utils/format';

export function BusinessDetailPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const { t } = useLocalization();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const { data: application, loading, error, refetch } = useAsync(
    () => businessesService.getApplication(businessId && businessId !== 'undefined' ? businessId : ''),
    [businessId]
  );

  const handleApprove = async () => {
    if (!application) return;
    setActionLoading(true);
    try {
      await businessesService.approveApplication(application.id);
      showToast({
        type: 'success',
        title: t('Success'),
        message: 'Application approved successfully',
      });
      refetch();
      setTimeout(() => navigate('/businesses'), 1500);
    } catch (err) {
      showToast({
        type: 'error',
        title: t('Error'),
        message: err instanceof Error ? err.message : 'Failed to approve',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!application) return;
    setActionLoading(true);
    try {
      await businessesService.rejectApplication(application.id, rejectReason);
      showToast({
        type: 'success',
        title: t('Success'),
        message: 'Application rejected',
      });
      refetch();
      setShowRejectDialog(false);
      setTimeout(() => navigate('/businesses'), 1500);
    } catch (err) {
      showToast({
        type: 'error',
        title: t('Error'),
        message: err instanceof Error ? err.message : 'Failed to reject',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!application) return;
    setActionLoading(true);
    try {
      await businessesService.suspendBusiness(application.id);
      showToast({
        type: 'success',
        title: t('Success'),
        message: 'Business suspended',
      });
      refetch();
    } catch (err) {
      showToast({
        type: 'error',
        title: t('Error'),
        message: err instanceof Error ? err.message : 'Failed to suspend',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!application) return;
    setActionLoading(true);
    try {
      await businessesService.reactivateBusiness(application.id);
      showToast({
        type: 'success',
        title: t('Success'),
        message: 'Business reactivated',
      });
      refetch();
    } catch (err) {
      showToast({
        type: 'error',
        title: t('Error'),
        message: err instanceof Error ? err.message : 'Failed to reactivate',
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <PageLoader label={t('Loading')} />;
  if (error || !application) return <ErrorState message={error ?? 'Not found'} onRetry={refetch} />;

  const isPending = application.status === 'PENDING_REVIEW';
  const isApproved = application.status === 'APPROVED';
  const isSuspended = application.status === 'SUSPENDED';

  return (
    <div className="space-y-6">
      <PageHeader
        title={application.businessName || 'Application'}
        description={application.ownerName}
        actions={
          <Link to="/businesses">
            <Button variant="outline">{t('Back')}</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Applicant Info */}
        <Card>
          <p className="card-h1 mb-4 dark:text-white">{t('Applicant')}</p>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Name')}</dt>
              <dd className="text-gray-900 dark:text-white">{application.ownerName}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Email')}</dt>
              <dd className="text-gray-900 dark:text-white">{application.ownerEmail}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Status')}</dt>
              <dd><StatusBadge label={application.status} /></dd>
            </div>
          </dl>
        </Card>

        {/* Business Info */}
        <Card>
          <p className="card-h1 mb-4 dark:text-white">{t('Business')}</p>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Name')}</dt>
              <dd className="text-gray-900 dark:text-white">{application.businessName || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Category')}</dt>
              <dd className="text-gray-900 dark:text-white">{application.businessCategory || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Submitted')}</dt>
              <dd className="text-gray-900 dark:text-white">{formatDate(application.submittedAt || application.createdAt)}</dd>
            </div>
          </dl>
        </Card>

        {/* Location Info */}
        <Card>
          <p className="card-h1 mb-4 dark:text-white">{t('Location')}</p>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Address')}</dt>
              <dd className="text-gray-900 dark:text-white">{application.location?.address || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('City')}</dt>
              <dd className="text-gray-900 dark:text-white">{application.location?.city || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Region')}</dt>
              <dd className="text-gray-900 dark:text-white">{application.location?.region || '—'}</dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* Shop Info */}
      {application.shopName && (
        <Card>
          <p className="card-h1 mb-4 dark:text-white">{t('Shop Information')}</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{application.shopName}</p>
          {application.shopId && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-mono">ID: {application.shopId}</p>
          )}
        </Card>
      )}

      {/* Linked Shop (if approved) */}
      {application.status === 'APPROVED' && application.shopId && (
        <Card className="border-l-4 border-green-500">
          <p className="card-h1 mb-4 dark:text-white">{t('Seller Shop Relationship')}</p>
          <div className="space-y-2 text-sm">
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-medium">{t('Owner')}:</span> {application.ownerName}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-medium">{t('Shop')}:</span> {application.shopName}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-medium">{t('Shop ID')}:</span> <span className="font-mono text-xs">{application.shopId}</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              This seller owns this shop. They can create products and manage orders.
            </p>
          </div>
        </Card>
      )}

      {/* Review History */}
      {application.review && (
        <Card>
          <p className="card-h1 mb-4 dark:text-white">{t('Review History')}</p>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Reviewed By')}</dt>
              <dd className="text-gray-900 dark:text-white">{application.review.reviewedBy || 'System'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Reviewed At')}</dt>
              <dd className="text-gray-900 dark:text-white">{formatDate(application.review.reviewedAt)}</dd>
            </div>
            {application.review.rejectionReason && (
              <div>
                <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{t('Reason')}</dt>
                <dd className="text-gray-900 dark:text-white">{application.review.rejectionReason}</dd>
              </div>
            )}
          </dl>
        </Card>
      )}

      {/* Actions */}
      <Card className="flex gap-3">
        {isPending && (
          <>
            <Button
              variant="secondary"
              loading={actionLoading}
              onClick={handleApprove}
            >
              {t('Approve')}
            </Button>
            <Button
              variant="danger"
              loading={actionLoading}
              onClick={() => setShowRejectDialog(true)}
            >
              {t('Reject')}
            </Button>
          </>
        )}
        {isApproved && (
          <Button
            variant="secondary"
            loading={actionLoading}
            onClick={handleSuspend}
          >
            {t('Suspend')}
          </Button>
        )}
        {isSuspended && (
          <Button
            variant="secondary"
            loading={actionLoading}
            onClick={handleReactivate}
          >
            {t('Reactivate')}
          </Button>
        )}
      </Card>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="max-w-md w-full mx-4">
            <h3 className="heading-5 dark:text-white mb-3">{t('Reject Application?')}</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t('Enter rejection reason...')}
              className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white mb-4"
              rows={3}
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowRejectDialog(false)}
              >
                {t('Cancel')}
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                loading={actionLoading}
                onClick={handleReject}
              >
                {t('Reject')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
