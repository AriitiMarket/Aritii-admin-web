/**
 * Sellers list panel — the "Sellers" tab.
 *
 * The body of the old standalone `/sellers` page (sellersService, search,
 * pagination, seller-detail navigation), rendered as a tab instead of a page of
 * its own.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sellersService } from '@/services/sellers.service';
import { storesService } from '@/services/stores.service';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocalization } from '@/i18n/I18nProvider';
import { SearchInput } from '@/components/common/SearchInput';
import { ErrorState } from '@/components/common/ErrorState';
import { Avatar } from '@/components/common/Avatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Pagination } from '@/components/common/Pagination';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { formatDate, formatNumber } from '@/utils/format';
import type { Seller } from '@/types';

export function SellersListPanel() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data, loading, error, refetch } = useAsync(
    () => sellersService.list({ page, limit: 10, search: debouncedSearch }),
    [page, debouncedSearch]
  );

  // Identity cannot know store counts or business names; commerce owns both.
  // ONE batched call for exactly this page's sellers — not one per row.
  const ownerIds = (data?.items ?? [])
    .map((seller) => seller.id)
    .filter(Boolean)
    .join(',');
  const { data: ownedShops } = useAsync(
    () =>
      ownerIds
        ? storesService.list({ ownerIds, page: 1, limit: 200 })
        : Promise.resolve({ items: [], total: 0, page: 1, limit: 0, totalPages: 0 }),
    [ownerIds]
  );
  const shopStatsByOwner = useMemo(() => {
    const map = new Map<string, { count: number; businessName?: string }>();
    for (const shop of ownedShops?.items ?? []) {
      const key = String(shop.ownerId || '');
      if (!key) continue;
      const entry = map.get(key) || { count: 0, businessName: undefined };
      entry.count += 1;
      if (!entry.businessName && shop.businessName) entry.businessName = shop.businessName;
      map.set(key, entry);
    }
    return map;
  }, [ownedShops]);

  const columns: Column<Seller>[] = [
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
    { key: 'email', header: t('Email'), accessor: (row) => row.email },
    {
      key: 'phone',
      header: t('Phone'),
      accessor: (row) => row.phoneNumber || row.phone || '—',
    },
    {
      key: 'stores',
      header: t('Stores'),
      accessor: (row) => {
        const stats = shopStatsByOwner.get(row.id);
        // Fall back to whatever the identity record carries when commerce has
        // not answered yet (or the response was filtered down).
        return formatNumber(stats ? stats.count : row.storesCount ?? 0);
      },
    },
    {
      key: 'business',
      header: t('Business'),
      accessor: (row) => shopStatsByOwner.get(row.id)?.businessName || '—',
    },
    {
      // Two lifecycle facts the account row carries: seller_status (the seller
      // funnel) and the account status. Showing only one reads as "the seller
      // was approved" even when the account is inactive.
      key: 'status',
      header: t('Seller Status'),
      render: (row) => <StatusBadge label={row.sellerStatus || row.status} />,
    },
    {
      key: 'createdAt',
      header: 'Joined',
      accessor: (row) => formatDate(row.createdAt),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <SearchInput
          value={search}
          onChange={(next) => {
            setSearch(next);
            setPage(1);
          }}
          placeholder={t('Search')}
          aria-label={t('Search')}
        />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <DataTable<Seller>
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(row) => row.id}
            loading={loading}
            emptyTitle={t('No data available')}
            onRowClick={(row) => navigate(`/sellers/${row.id}`)}
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
