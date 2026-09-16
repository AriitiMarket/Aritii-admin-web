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
import { Button } from '@/components/common/Button';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { http } from '@/services/client/httpClient';

interface Product {
  id: string;
  name: string;
  description?: string;
  category?: string;
  originalPrice?: number;
  discountPrice?: number;
  stock?: number;
  reserved?: number;
  shopId?: string;
  shopName?: string;
  sellerId?: string;
  sellerName?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
}

interface ProductsResponse {
  items: Product[];
  total: number;
  totalPages: number;
}

export function ProductsPage() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [bulkAction, setBulkAction] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data, loading, error, refetch } = useAsync(
    async () => {
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: '20',
          search: debouncedSearch,
          ...(status !== 'all' && { status }),
          ...(priceMin && { priceMin }),
          ...(priceMax && { priceMax }),
          ...(dateFrom && { dateFrom }),
        });
        const res = await http.get(`/product/get-all-products?${params}`);
        return res as ProductsResponse;
      } catch (err) {
        throw new Error('Failed to load products');
      }
    },
    [page, debouncedSearch, status, priceMin, priceMax, dateFrom]
  );

  const handleBulkAction = async () => {
    if (selectedProducts.size === 0 || !bulkAction) return;
    try {
      await http.post('/product/bulk', {
        productIds: Array.from(selectedProducts),
        action: bulkAction,
      });
      setSelectedProducts(new Set());
      setBulkAction('');
      refetch();
    } catch (err) {
      console.error('Bulk action failed', err);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(data?.items.map(p => p.id) || []));
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleExport = async () => {
    try {
      const res = await http.get('/product/get-all-products?limit=1000');
      const blob = new Blob([res as any], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  const columns: Column<Product>[] = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={selectedProducts.size === (data?.items?.length ?? 0) && (data?.items?.length ?? 0) > 0}
          onChange={(e) => handleSelectAll(e.target.checked)}
          className="rounded border-gray-300"
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedProducts.has(row.id)}
          onChange={(e) => {
            const newSet = new Set(selectedProducts);
            if (e.target.checked) {
              newSet.add(row.id);
            } else {
              newSet.delete(row.id);
            }
            setSelectedProducts(newSet);
          }}
          className="rounded border-gray-300"
        />
      ),
    },
    {
      key: 'name',
      header: t('Product'),
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-800 dark:text-gray-100">{row.name}</span>
        </div>
      ),
    },
    { key: 'shopName', header: t('Shop'), accessor: (row) => row.shopName || '-' },
    { key: 'category', header: t('Category'), accessor: (row) => row.category || '-' },
    {
      key: 'price',
      header: t('Price'),
      render: (row) => {
        const discount = row.originalPrice && row.discountPrice ? ((1 - row.discountPrice / row.originalPrice) * 100).toFixed(0) : 0;
        return (
          <div className="text-sm">
            <span className="font-medium text-gray-800 dark:text-gray-100">{row.discountPrice?.toLocaleString() || 0}</span>
            {discount > 0 && <span className="text-green-600 ml-1">-{discount}%</span>}
          </div>
        );
      },
    },
    {
      key: 'stock',
      header: t('Stock'),
      render: (row) => (
        <div className="text-sm">
          <span className={row.stock! <= 5 ? 'text-red-600 font-semibold' : 'text-gray-700 dark:text-gray-300'}>
            {row.stock || 0}
          </span>
          {row.reserved! > 0 && <span className="text-blue-600 ml-1">({row.reserved} reserved)</span>}
        </div>
      ),
    },
    {
      key: 'status',
      header: t('Status'),
      render: (row) => <StatusBadge label={row.status || 'ACTIVE'} />,
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (row) => (
        <button
          onClick={() => navigate(`/commerce/products/${row.id}`)}
          className="text-primary-dark hover:underline dark:text-primary-color text-sm"
        >
          {t('View')}
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('Products')}
        description={t('Manage and monitor all marketplace products')}
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={handleExport} variant="outline" size="sm">
              📥 Export CSV
            </Button>
            <Button onClick={() => setShowAdvanced(!showAdvanced)} variant="outline" size="sm">
              🔍 Filters
            </Button>
          </div>
        }
      />

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-dark-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input
              type="number"
              placeholder="Min Price"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-dark-800 dark:text-white text-sm"
            />
            <input
              type="number"
              placeholder="Max Price"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-dark-800 dark:text-white text-sm"
            />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-dark-800 dark:text-white text-sm"
            />
            <Button
              onClick={() => {
                setPriceMin('');
                setPriceMax('');
                setDateFrom('');
                setPage(1);
              }}
              variant="outline"
              size="sm"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedProducts.size > 0 && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {selectedProducts.size} products selected
          </span>
          <div className="flex items-center gap-2">
            <SelectField
              value={bulkAction}
              options={[
                { value: '', label: 'Select action...' },
                { value: 'activate', label: 'Activate' },
                { value: 'deactivate', label: 'Deactivate' },
              ]}
              onChange={(e) => setBulkAction(e.target.value)}
              className="w-40 text-sm"
            />
            <Button onClick={handleBulkAction} variant="primary" size="sm" disabled={!bulkAction}>
              Apply
            </Button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex items-center gap-2 mb-4">
        <SelectField
          value={status}
          options={[
            { value: 'all', label: t('All Products') },
            { value: 'ACTIVE', label: t('Active') },
            { value: 'INACTIVE', label: t('Inactive') },
          ]}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="w-40"
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t('Search products')}
          aria-label={t('Search')}
        />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <DataTable<Product>
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(row) => row.id}
            loading={loading}
            emptyTitle={t('No products found')}
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
