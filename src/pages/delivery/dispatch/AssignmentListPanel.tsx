import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { SearchInput } from '@/components/common/SearchInput';
import { SelectField } from '@/components/forms/SelectField';
import { Pagination } from '@/components/common/Pagination';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { dispatchService, type AssignmentBatch } from '@/services/dispatch.service';
import { formatDate } from '@/utils/format';
import {
  ASSIGNMENT_STATUS_LABELS,
  ASSIGNMENT_STATUS_VARIANTS,
  ASSIGNMENT_STATUS_OPTIONS,
  summariseProgress,
} from './statusLabels';

/** Every assignment created through the multi-order dispatch flow. */
export function AssignmentListPanel() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data, loading, error, refetch } = useAsync(
    () => dispatchService.list({ page, limit: 15, status, search: debouncedSearch }),
    [page, status, debouncedSearch]
  );

  const assignments = data?.assignments ?? [];

  return (
    <>
      <Card className="mb-4 flex flex-wrap items-end gap-3 p-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search assignment reference…"
          aria-label="Search assignments"
        />
        <SelectField
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={ASSIGNMENT_STATUS_OPTIONS}
          placeholder="All Statuses"
          className="w-48"
          aria-label="Filter by assignment status"
        />
      </Card>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-dark-600">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-dark-600 dark:bg-dark-950">
                  {['Assignment', 'Rider', 'Orders', 'Progress', 'Status', 'Assigned', ''].map((h, i) => (
                    <th key={i} scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                      Loading assignments…
                    </td>
                  </tr>
                )}
                {!loading && assignments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                      No assignments found.
                    </td>
                  </tr>
                )}
                {!loading &&
                  assignments.map((a: AssignmentBatch) => {
                    const progress = summariseProgress(a.deliveries.map((d) => d.status));
                    return (
                      <tr key={a._id} className="border-b border-gray-100 dark:border-dark-600/50">
                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{a.reference}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{a.providerName || a.partnerName || '—'}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{a.deliveries.length}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{progress.label}</td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            label={ASSIGNMENT_STATUS_LABELS[a.status] ?? a.status}
                            variant={ASSIGNMENT_STATUS_VARIANTS[a.status] ?? 'neutral'}
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{formatDate(a.assignedAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/delivery/assignments/${a._id}`)}>
                            View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <Pagination
            className="mt-4"
            page={page}
            totalPages={data?.totalPages ?? 1}
            total={data?.total}
            onPageChange={setPage}
          />
        </>
      )}
    </>
  );
}
