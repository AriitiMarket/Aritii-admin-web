import { catalogService } from '@/services/catalog.service';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Button } from '@/components/common/Button';
import { formatDate } from '@/utils/format';
import type { Dispute } from '@/types/catalog';

export function DisputesPage() {
  const { t } = useLocalization();
  const { showToast } = useToast();
  const { data, loading, error, refetch } = useAsync(
    () => catalogService.listDisputes(),
    []
  );

  const updateStatus = async (id: string, status: Dispute['status']) => {
    try {
      await catalogService.updateDisputeStatus(id, status);
      showToast({
        type: 'success',
        title: t('Success'),
        message: t('Status Changed Successfully'),
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

  const columns: Column<Dispute>[] = [
    { key: 'subject', header: t('Subject'), accessor: (row) => row.subject },
    {
      key: 'reportedBy',
      header: 'Reporter',
      accessor: (row) => row.reportedBy?.name ?? '—',
    },
    { key: 'orderId', header: 'Order', accessor: (row) => row.orderId ?? '—' },
    {
      key: 'priority',
      header: 'Priority',
      render: (row) => <StatusBadge label={row.priority} />,
    },
    {
      key: 'status',
      header: t('Status'),
      render: (row) => <StatusBadge label={row.status} />,
    },
    {
      key: 'createdAt',
      header: 'Opened',
      accessor: (row) => formatDate(row.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={row.status === 'RESOLVED' || row.status === 'CLOSED'}
            onClick={() => updateStatus(row.id, 'RESOLVED')}
          >
            {t('Resolve')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={row.status === 'OPEN'}
            onClick={() => updateStatus(row.id, 'OPEN')}
          >
            {t('Reopen')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('Disputes')}
        description={t('Customer and partner dispute management')}
      />

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <DataTable<Dispute>
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