import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Pagination } from '@/components/common/Pagination';
import { SelectField } from '@/components/forms/SelectField';
import { Card } from '@/components/common/Card';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Button } from '@/components/common/Button';
import { formatDate } from '@/utils/format';
import { disputesAdmin } from '@/api/admin';
import type { Dispute } from '@/types/catalog';

const DISPUTE_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'under_investigation', label: 'Under Investigation' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'closed', label: 'Closed' },
];

const DISPUTE_PRIORITIES = [
  { value: '', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const DISPUTE_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'order', label: 'Order' },
  { value: 'payment', label: 'Payment' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'product', label: 'Product' },
  { value: 'other', label: 'Other' },
];

export function DisputesManagementPage() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [type, setType] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data, loading, error, refetch } = useAsync(
    async () => {
      try {
        const result = await disputesAdmin.listDisputes(page, 10, status, priority, type);
        return {
          items: result.items,
          total: result.total,
          totalPages: Math.ceil(result.total / 10),
        };
      } catch (err) {
        console.error('Failed to fetch disputes:', err);
        throw err;
      }
    },
    [page, status, priority, type]
  );

  const getStatusColor = (s: string) => {
    const colors: Record<string, string> = {
      open: 'bg-red-100 text-red-800',
      in_progress: 'bg-blue-100 text-blue-800',
      under_investigation: 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
      rejected: 'bg-gray-100 text-gray-800',
      closed: 'bg-gray-300 text-gray-900',
    };
    return colors[s] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (p: string) => {
    const colors: Record<string, string> = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[p] || 'bg-gray-100 text-gray-800';
  };

  const columns: Column<any>[] = [
    {
      key: 'subject',
      header: t('Subject'),
      render: (row) => (
        <span className="font-medium text-gray-800 dark:text-gray-100">
          {row.subject || '—'}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.type || '—'}
        </span>
      ),
    },
    {
      key: 'buyerName',
      header: 'Buyer',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.buyerName || '—'}
        </span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (row) => (
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${getPriorityColor(row.priority || '')}`}>
          {row.priority || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('Status'),
      render: (row) => (
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(row.status || '')}`}>
          {row.status || '—'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('Disputes')}
        description={t('Customer and partner dispute management')}
        actions={
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('Search disputes')}
            aria-label={t('Search')}
          />
        }
      />

      {/* Filter Bar */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <SelectField
          value={status}
          onChange={setStatus}
          options={DISPUTE_STATUSES}
          label="Status"
        />
        <SelectField
          value={priority}
          onChange={setPriority}
          options={DISPUTE_PRIORITIES}
          label="Priority"
        />
        <SelectField
          value={type}
          onChange={setType}
          options={DISPUTE_TYPES}
          label="Type"
        />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <DataTable<any>
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(row) => row.id}
            loading={loading}
            emptyTitle={t('No disputes')}
            onRowClick={(row) => navigate(`/disputes/${row.id}`)}
          />
          <Pagination
            className="mt-4"
            page={page}
            totalPages={data?.totalPages ?? 0}
            total={data?.total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}