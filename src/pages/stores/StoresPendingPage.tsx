import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storesService } from '@/services/stores.service';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/hooks/useToast';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { Pagination } from '@/components/common/Pagination';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Avatar } from '@/components/common/Avatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Link } from 'react-router-dom';
import type { Store } from '@/types';

export function StoresPendingPage() {
  const { t } = useLocalization();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, loading, error, refetch } = useAsync(
    () => storesService.pending(),
    []
  );

  const start = (page - 1) * 10;
  const items = (data ?? []).slice(start, start + 10);

  // Approve / reject act on the shop itself (POST /shop/admin/shops/:id/...).
  // These actions previously existed only as unused service methods, so a
  // pending shop could never be decided from this page.
  const approve = async (row: Store) => {
    setBusyId(row.id);
    try {
      await storesService.approve(row.id);
      showToast({ type: 'success', message: t('Shop approved') });
      refetch();
    } catch (err: any) {
      showToast({ type: 'error', message: err?.response?.data?.message || t('Could not approve this shop') });
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (row: Store) => {
    const reason = window.prompt(t('Reason for rejecting this shop (optional)'), '');
    if (reason === null) return; // cancelled
    setBusyId(row.id);
    try {
      await storesService.reject(row.id, reason);
      showToast({ type: 'success', message: t('Shop rejected') });
      refetch();
    } catch (err: any) {
      showToast({ type: 'error', message: err?.response?.data?.message || t('Could not reject this shop') });
    } finally {
      setBusyId(null);
    }
  };

  const columns: Column<Store>[] = [
    {
      key: 'name',
      header: t('Name'),
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} size="sm" />
          <span className="font-medium text-gray-800 dark:text-gray-100">
            {row.name}
          </span>
        </div>
      ),
    },
    { key: 'address', header: t('Address'), accessor: (row) => row.address },
    {
      key: 'status',
      header: t('Status'),
      render: (row) => <StatusBadge label={row.status} />,
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (row) => (
        <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
          <Button
            variant="primary"
            disabled={busyId === row.id}
            onClick={() => approve(row)}
          >
            {t('Approve')}
          </Button>
          <Button
            variant="outline"
            disabled={busyId === row.id}
            onClick={() => reject(row)}
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
        title={t('Pending Stores')}
        description={t('Store onboarding requests awaiting approval')}
        actions={
          <Link to="/stores">
            <Button variant="outline">{t('All stores')}</Button>
          </Link>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <DataTable<Store>
            columns={columns}
            rows={items}
            rowKey={(row) => row.id}
            loading={loading}
            emptyTitle={t('No data available')}
            onRowClick={(row) => navigate(`/stores/${row.id}`)}
          />
          <Pagination
            className="mt-4"
            page={page}
            totalPages={Math.ceil((data ?? []).length / 10)}
            total={data?.length}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}