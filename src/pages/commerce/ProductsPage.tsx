import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocalization } from '@/i18n/I18nProvider';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Pagination } from '@/components/common/Pagination';
import { SelectField } from '@/components/forms/SelectField';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { commerceService } from '@/services/commerce.service';
import type { CommerceProduct } from '@/services/commerce.service';
import { resolveImageUrl } from '@/utils/image';

export function ProductsPage() {
  const { t } = useLocalization();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [category, setCategory] = useState('');
  // Deep-linkable: /commerce/products?shopId=<id> opens this shop's catalogue
  // (used by the store detail page — product management stays in this module).
  const [shopId, setShopId] = useState(() => searchParams.get('shopId') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  // Product filter must only offer product categories — without `type` the
  // backend returns business/shop/event categories too.
  const { data: categories } = useAsync(
    async () => commerceService.listCategories('product'),
    []
  );

  const { data, loading, error, refetch } = useAsync(
    async () => {
      return commerceService.listProducts({
        page,
        limit: 20,
        search: debouncedSearch,
        status,
        stockFilter,
        category: category || undefined,
        shopId: shopId || undefined,
        priceMin: priceMin ? Number(priceMin) : undefined,
        priceMax: priceMax ? Number(priceMax) : undefined,
        dateFrom: dateFrom || undefined,
        includeInactive: true,
      });
    },
    [page, debouncedSearch, status, stockFilter, category, shopId, priceMin, priceMax, dateFrom]
  );

  const columns: Column<CommerceProduct>[] = [
    {
      key: 'image',
      header: t('Image'),
      render: (row) => {
        // Images are strings in commerce; tolerate {url} shapes from older docs.
        // Values may be external URLs or real storage keys (eshop/…, /uploads/…).
        const raw = Array.isArray(row.images) ? row.images[0] : row.images;
        const src =
          typeof raw === 'string'
            ? resolveImageUrl(raw)
            : raw?.url
              ? resolveImageUrl(raw)
              : null;
        return src ? (
          <img
            src={src}
            alt={row.name}
            className="h-10 w-10 rounded object-cover border border-gray-200 dark:border-gray-700"
            loading="lazy"
          />
        ) : (
          <div className="h-10 w-10 rounded bg-gray-100 dark:bg-dark-700 flex items-center justify-center text-xs text-gray-400">
            —
          </div>
        );
      },
    },
    {
      key: 'name',
      header: t('Product'),
      render: (row) => (
        <div>
          <div className="font-medium text-gray-800 dark:text-gray-100">{row.name}</div>
          {row.description && (
            <div className="text-xs text-gray-500 truncate max-w-[200px]">{row.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'shopName',
      header: t('Shop'),
      render: (row) => (
        <div>
          <div className="text-sm text-gray-700 dark:text-gray-300">{row.shopName || row.shop?.name || '—'}</div>
          {row.sellerName && (
            <div className="text-xs text-gray-500">{row.sellerName}</div>
          )}
        </div>
      ),
    },
    { key: 'category', header: t('Category'), accessor: (row) => row.category || '-' },
    {
      key: 'price',
      header: t('Price'),
      render: (row) => {
        const hasDiscount = row.originalPrice && row.discountPrice && row.originalPrice > row.discountPrice;
        const discount = hasDiscount ? Math.round((1 - (row.discountPrice || 0) / (row.originalPrice || 1)) * 100) : 0;
        return (
          <div className="text-sm">
            <span className="font-medium text-gray-800 dark:text-gray-100">
              {(row.discountPrice || 0).toLocaleString()} ETB
            </span>
            {discount > 0 && (
              <span className="text-green-600 ml-1 text-xs">-{discount}%</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'stock',
      header: t('Stock'),
      render: (row) => {
        const available = Math.max(0, Number(row.stock ?? 0) - Number(row.reserved ?? 0));
        return (
          <div className="text-sm">
            <span className={available < 1 ? 'text-red-600 font-semibold' : available <= 5 ? 'text-amber-600 font-semibold' : 'text-gray-700 dark:text-gray-300'}>
              {available}
            </span>
            <span className="text-gray-400 ml-1 text-xs">available</span>
            {row.reserved != null && row.reserved > 0 && (
              <span className="text-blue-600 ml-1 text-xs">({row.stock ?? 0} total, {row.reserved} reserved)</span>
            )}
            {available < 1 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-red-50 text-red-700 font-semibold">
                {t('OUT OF STOCK')}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: t('Status'),
      render: (row) => {
        // Two independent dimensions: seller lifecycle + admin kill-switch.
        // ARCHIVED is its own state — mapping everything non-DRAFT to
        // PUBLISHED used to badge retired rows as live.
        const lifecycle = row.status || 'PUBLISHED';
        const lifecycleClass =
          lifecycle === 'PUBLISHED'
            ? 'bg-green-50 text-green-700'
            : lifecycle === 'ARCHIVED'
              ? 'bg-amber-50 text-amber-700'
              : 'bg-gray-100 text-gray-600';
        return (
          <div className="flex flex-wrap gap-1">
            <StatusBadge label={lifecycle} className={lifecycleClass} />
            {row.isActive === false && (
              <StatusBadge label={t('INACTIVE')} className="bg-red-50 text-red-700" />
            )}
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      header: t('Created'),
      accessor: (row) => {
        if (!row.createdAt) return '—';
        try {
          return new Date(row.createdAt).toLocaleDateString();
        } catch {
          return '—';
        }
      },
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (row) => (
        <div className="flex gap-1">
          {row.isActive === false ? (
            <Button size="sm" variant="outline" onClick={() => handleToggleActive(row, true)}>
              {t('Activate')}
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => handleToggleActive(row, false)}>
              {t('Deactivate')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleToggleActive = async (row: CommerceProduct, isActive: boolean) => {
    const ok = await commerceService.updateProductStatus(row.id, isActive);
    if (ok) {
      showToast({ type: 'success', message: isActive ? t('Product activated') : t('Product deactivated') });
      refetch();
    } else {
      showToast({ type: 'error', message: t('Could not update product status') });
    }
  };

  const hasActiveFilters = status !== 'all' || stockFilter !== 'all' || category !== '' || shopId !== '' || priceMin !== '' || priceMax !== '' || dateFrom !== '';

  return (
    <div>
      <PageHeader
        title={t('Products')}
        description={t('View and manage marketplace products')}
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowFilters(!showFilters)} variant="outline" size="sm">
              {showFilters ? '✕' : '⊕'} {t('Filters')}
            </Button>
          </div>
        }
      />

      {/* Filters */}
      {showFilters && (
        <Card className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <SelectField
              value={status}
              options={[
                { value: 'all', label: t('All Statuses') },
                { value: 'ACTIVE', label: t('Active') },
                { value: 'INACTIVE', label: t('Inactive') },
                { value: 'PUBLISHED', label: t('Published') },
                { value: 'DRAFT', label: t('Draft') },
                { value: 'ARCHIVED', label: t('Archived') },
              ]}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              label={t('Status')}
            />
            <SelectField
              value={stockFilter}
              options={[
                { value: 'all', label: t('All Stock Levels') },
                { value: 'IN_STOCK', label: t('In Stock') },
                { value: 'LOW_STOCK', label: t('Low Stock (≤5)') },
                { value: 'OUT_OF_STOCK', label: t('Out of Stock') },
              ]}
              onChange={(e) => { setStockFilter(e.target.value); setPage(1); }}
              label={t('Stock')}
            />
            <SelectField
              value={category}
              options={[
                { value: '', label: t('All Categories') },
                ...(categories || []).map((c) => ({ value: c.title, label: c.title })),
              ]}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              label={t('Category')}
            />
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('Shop ID')}</label>
              <input
                type="text"
                value={shopId}
                onChange={(e) => { setShopId(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-dark-800 dark:text-white text-sm"
                placeholder={t('Filter by shop id')}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('Min Price')}</label>
              <input
                type="number"
                value={priceMin}
                onChange={(e) => { setPriceMin(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-dark-800 dark:text-white text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('Max Price')}</label>
              <input
                type="number"
                value={priceMax}
                onChange={(e) => { setPriceMax(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-dark-800 dark:text-white text-sm"
                placeholder="∞"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('From Date')}</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-dark-800 dark:text-white text-sm"
              />
            </div>
            {hasActiveFilters && (
              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setStatus('all');
                    setStockFilter('all');
                    setCategory('');
                    setShopId('');
                    setPriceMin('');
                    setPriceMax('');
                    setDateFrom('');
                    setPage(1);
                  }}
                  variant="outline"
                  size="sm"
                >
                  {t('Clear Filters')}
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Search */}
      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t('Search products by name, shop, or category')}
          aria-label={t('Search products')}
        />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <DataTable<CommerceProduct>
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(row) => row.id}
            loading={loading}
            emptyTitle={t('No products found')}
            emptyDescription={hasActiveFilters ? t('Try adjusting your filters') : t('No products have been listed yet')}
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
