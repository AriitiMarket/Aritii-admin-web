import { catalogService } from '@/services/catalog.service';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Button } from '@/components/common/Button';
import { formatDate } from '@/utils/format';
import type { Review } from '@/types/catalog';

export function PendingReviewsPage() {
  const { t } = useLocalization();
  const { showToast } = useToast();
  const { data, loading, error, refetch } = useAsync(
    () => catalogService.listPendingReviews(),
    []
  );

  const decide = async (id: string, approve: boolean) => {
    try {
      await (approve
        ? catalogService.approveReview(id)
        : catalogService.rejectReview(id));
      showToast({
        type: approve ? 'success' : 'info',
        title: t('Success'),
        message: approve
          ? t('Review approved') || 'Review approved'
          : t('Review rejected') || 'Review rejected',
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

  const columns: Column<Review>[] = [
    { key: 'storeName', header: t('Stores'), accessor: (row) => row.storeName },
    { key: 'orderId', header: 'Order', accessor: (row) => row.orderId ?? '—' },
    {
      key: 'rating',
      header: 'Rating',
      accessor: (row) => `${row.rating} ★`,
    },
    { key: 'description', header: t('Description'), accessor: (row) => row.description ?? '—' },
    {
      key: 'createdAt',
      header: 'Submitted',
      accessor: (row) => formatDate(row.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => decide(row.id, true)}>
            {t('Approve')}
          </Button>
          <Button variant="danger" size="sm" onClick={() => decide(row.id, false)}>
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
    </div>
  );
}