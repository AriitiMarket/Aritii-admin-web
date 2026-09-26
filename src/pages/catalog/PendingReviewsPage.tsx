import { useState } from 'react';
import { catalogService } from '@/services/catalog.service';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { TextField } from '@/components/forms/TextField';
import { formatDate } from '@/utils/format';
import type { Review } from '@/types/catalog';

export function PendingReviewsPage() {
  const { t } = useLocalization();
  const { showToast } = useToast();
  const { data, loading, error, refetch } = useAsync(
    () => catalogService.listPendingReviews(),
    []
  );

  const [rejectTarget, setRejectTarget] = useState<Review | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const approve = async (id: string) => {
    try {
      await catalogService.approveReview(id);
      showToast({
        type: 'success',
        title: t('Success'),
        message: t('Review approved') || 'Review approved',
      });
      refetch();
    } catch (err) {
      showToast({
        type: 'error',
        title: t('Error'),
        message: err instanceof Error ? err.message : t('Something went wrong - Please try again'),
      });
    }
  };

  // The API requires a rejection reason (it is kept in the moderation trail), so
  // the reason is collected before the request instead of failing with a 400.
  const confirmReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      showToast({
        type: 'warn',
        title: t('Warning'),
        message: t('A rejection reason is required') || 'A rejection reason is required',
      });
      return;
    }
    setRejecting(true);
    try {
      await catalogService.rejectReview(rejectTarget.id, rejectReason.trim());
      showToast({
        type: 'info',
        title: t('Success'),
        message: t('Review rejected') || 'Review rejected',
      });
      setRejectTarget(null);
      setRejectReason('');
      refetch();
    } catch (err) {
      showToast({
        type: 'error',
        title: t('Error'),
        message: err instanceof Error ? err.message : t('Something went wrong - Please try again'),
      });
    } finally {
      setRejecting(false);
    }
  };

  const columns: Column<Review>[] = [
    { key: 'storeName', header: t('Product'), accessor: (row) => row.storeName },
    {
      key: 'reviewerName',
      header: t('Reviewer'),
      accessor: (row) => row.reviewerName ?? '—',
    },
    {
      key: 'rating',
      header: 'Rating',
      accessor: (row) => `${row.rating} ★`,
    },
    { key: 'description', header: t('Comment'), accessor: (row) => row.description ?? '—' },
    {
      key: 'createdAt',
      header: 'Submitted',
      accessor: (row) => (row.createdAt ? formatDate(row.createdAt) : '—'),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => approve(row.id)}>
            {t('Approve')}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setRejectTarget(row);
              setRejectReason('');
            }}
          >
            {t('Reject')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('Pending Reviews')}
        description={t('Customer reviews awaiting moderation')}
      />

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <DataTable<Review>
          columns={columns}
          rows={data ?? []}
          rowKey={(row) => row.id}
          loading={loading}
          emptyTitle={t('No data available')}
        />
      )}

      <Modal
        open={Boolean(rejectTarget)}
        onClose={() => {
          setRejectTarget(null);
          setRejectReason('');
        }}
        title={t('Reject review')}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('Rejecting the review for')} <strong>{rejectTarget?.storeName}</strong>.
            {t('The reason is stored with the review.')}
          </p>
          <TextField
            label={t('Reason')}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={t('Why is this review being rejected?')}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRejectTarget(null);
                setRejectReason('');
              }}
            >
              {t('Cancel')}
            </Button>
            <Button variant="danger" onClick={confirmReject} disabled={rejecting}>
              {rejecting ? t('Submitting') : t('Reject')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}