import { useState } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Pagination } from '@/components/common/Pagination';
import { SelectField } from '@/components/forms/SelectField';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { formatDate } from '@/utils/format';
import { http } from '@/services/client/httpClient';

interface Transaction {
  id: string;
  transactionId?: string;
  orderId: string;
  amount: number;
  paymentMethod?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  currency?: string;
  createdAt?: string;
}

interface TransactionsResponse {
  items: Transaction[];
  total: number;
  totalPages: number;
}

export function TransactionsPage() {
  const { t } = useLocalization();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const debouncedSearch = useDebounce(search, 300);

  const { data, loading, error, refetch } = useAsync(
    async () => {
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: '20',
          search: debouncedSearch,
          ...(status !== 'all' && { status }),
        });
        const res = await http.get(`/payment/get-all-payments?${params}`);
        return res as TransactionsResponse;
      } catch (err) {
        throw new Error('Failed to load transactions');
      }
    },
    [page, debouncedSearch, status]
  );

  const columns: Column<Transaction>[] = [
    { key: 'id', header: t('Transaction ID'), accessor: (row) => row.id?.substring(0, 8) + '...' || '-' },
    { key: 'orderId', header: t('Order ID'), accessor: (row) => row.orderId?.substring(0, 8) + '...' || '-' },
    {
      key: 'amount',
      header: t('Amount'),
      render: (row) => `${row.amount?.toLocaleString() || 0} ${row.currency || 'ETB'}`,
    },
    {
      key: 'paymentMethod',
      header: t('Payment Method'),
      accessor: (row) => row.paymentMethod || '-',
    },
    {
      key: 'status',
      header: t('Status'),
      render: (row) => (
        <StatusBadge
          label={row.status}
          className={
            row.status === 'FAILED'
              ? 'bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-100'
              : row.status === 'REFUNDED'
                ? 'bg-orange-50 text-orange-700 dark:bg-orange-900 dark:text-orange-100'
                : ''
          }
        />
      ),
    },
    { key: 'createdAt', header: t('Date'), accessor: (row) => formatDate(row.createdAt) },
  ];

  return (
    <div>
      <PageHeader
        title={t('Transactions & Payments')}
        description={t('Monitor all payment transactions and payment status')}
        actions={
          <div className="flex items-center gap-2">
            <SelectField
              value={status}
              options={[
                { value: 'all', label: t('All Transactions') },
                { value: 'COMPLETED', label: t('Completed') },
                { value: 'PENDING', label: t('Pending') },
                { value: 'FAILED', label: t('Failed') },
                { value: 'REFUNDED', label: t('Refunded') },
              ]}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-48"
            />
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('Search by transaction/order ID')}
              aria-label={t('Search')}
            />
          </div>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <DataTable<Transaction>
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(row) => row.id}
            loading={loading}
            emptyTitle={t('No transactions found')}
          />
          {(data?.totalPages ?? 0) > 1 && (
            <Pagination
              className="mt-4"
              page={page}
              totalPages={data?.totalPages ?? 0}
              total={data?.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
