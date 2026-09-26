import { useState, useEffect } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { formatDate } from '@/utils/format';
import { commerceService } from '@/services/commerce.service';
import type { Category, CategoryType } from '@/types/catalog';

const CATEGORY_TYPES: { value: CategoryType; label: string }[] = [
  { value: 'product', label: 'Product Categories' },
  { value: 'business', label: 'Business Categories' },
  { value: 'shop', label: 'Shop Categories' },
  { value: 'event', label: 'Event Categories' },
];

interface CategoryFormData {
  title: string;
  description: string;
  type: CategoryType;
  sortOrder: number;
}

export function CategoriesPage() {
  const { t } = useLocalization();
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState<CategoryType>('product');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({ title: '', description: '', type: 'product', sortOrder: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const { data: categories, loading, error, refetch } = useAsync(
    async () => commerceService.listCategories(),
    []
  );

  const filteredCategories = (categories || []).filter((c) => {
    if (c.type !== activeType) return false;
    if (!debouncedSearch) return true;
    const term = debouncedSearch.toLowerCase();
    return c.title?.toLowerCase().includes(term) || c.description?.toLowerCase().includes(term);
  });

  useEffect(() => {
    setFormData((prev) => ({ ...prev, type: activeType }));
  }, [activeType]);

  const handleCreate = async () => {
    if (!formData.title.trim()) return;
    setSubmitting(true);
    try {
      await commerceService.createCategory({
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        sortOrder: formData.sortOrder,
      });
      setShowCreateModal(false);
      setFormData({ title: '', description: '', type: activeType, sortOrder: 0 });
      refetch();
    } catch (err) {
      console.error('Failed to create category:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editingCategory || !formData.title.trim()) return;
    setSubmitting(true);
    try {
      await commerceService.updateCategory(editingCategory.id, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        sortOrder: formData.sortOrder,
      });
      setEditingCategory(null);
      setFormData({ title: '', description: '', type: activeType, sortOrder: 0 });
      refetch();
    } catch (err) {
      console.error('Failed to update category:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (category: Category) => {
    try {
      await commerceService.toggleCategoryStatus(category.id);
      refetch();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDelete = async (category: Category) => {
    setSubmitting(true);
    try {
      await commerceService.deleteCategory(category.id);
      setDeleteConfirm(null);
      refetch();
    } catch (err) {
      console.error('Failed to delete category:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      title: category.title,
      description: category.description || '',
      type: category.type,
      sortOrder: category.sortOrder || 0,
    });
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setEditingCategory(null);
    setFormData({ title: '', description: '', type: activeType, sortOrder: 0 });
  };

  const columns: Column<Category>[] = [
    {
      key: 'title',
      header: t('Title'),
      render: (row) => (
        <div>
          <div className="font-medium text-gray-800 dark:text-gray-100">{row.title}</div>
          {row.description && (
            <div className="text-xs text-gray-500 truncate max-w-[200px]">{row.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: t('Status'),
      render: (row) => (
        <button
          onClick={() => handleToggleStatus(row)}
          className="cursor-pointer hover:opacity-80 transition-opacity"
          title={t('Click to toggle status')}
        >
          <StatusBadge
            label={row.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
            className={row.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}
          />
        </button>
      ),
    },
    {
      key: 'sortOrder',
      header: t('Order'),
      accessor: (row) => String(row.sortOrder ?? 0),
    },
    {
      key: 'createdAt',
      header: t('Created'),
      accessor: (row) => formatDate(row.createdAt),
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEditModal(row)}
            className="text-sm text-primary-dark hover:underline dark:text-primary-color"
          >
            {t('Edit')}
          </button>
          <button
            onClick={() => setDeleteConfirm(row)}
            className="text-sm text-red-600 hover:underline"
          >
            {t('Delete')}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('Categories')}
        description={t('Manage product and business categories across the platform')}
        actions={
          <Button onClick={() => setShowCreateModal(true)} variant="primary" size="sm">
            {t('Add Category')}
          </Button>
        }
      />

      {/* Type Tabs */}
      <div className="mb-4 flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {CATEGORY_TYPES.map((ct) => (
          <button
            key={ct.value}
            onClick={() => setActiveType(ct.value)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeType === ct.value
                ? 'border-primary-dark text-primary-dark dark:border-primary-color dark:text-primary-color'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {ct.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t('Search categories')}
          aria-label={t('Search categories')}
        />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <DataTable<Category>
          columns={columns}
          rows={filteredCategories}
          rowKey={(row) => row.id}
          loading={loading}
          emptyTitle={t('No categories found')}
          emptyDescription={t('Create your first category to get started')}
        />
      )}

      {/* Create Modal */}
      <Modal open={showCreateModal} onClose={closeModals} title={t('Create Category')}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('Type')} *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as CategoryType })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-dark-800 dark:text-white"
            >
              {CATEGORY_TYPES.map((ct) => (
                <option key={ct.value} value={ct.value}>{ct.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('Title')} *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-dark-800 dark:text-white"
              placeholder={t('Category name')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('Description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-dark-800 dark:text-white"
              rows={3}
              placeholder={t('Optional description')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('Sort Order')}
            </label>
            <input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-dark-800 dark:text-white"
              min={0}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={closeModals} variant="outline" size="sm">
              {t('Cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              variant="primary"
              size="sm"
              loading={submitting}
              disabled={!formData.title.trim()}
            >
              {t('Create')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editingCategory} onClose={closeModals} title={t('Edit Category')}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('Type')} *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as CategoryType })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-dark-800 dark:text-white"
            >
              {CATEGORY_TYPES.map((ct) => (
                <option key={ct.value} value={ct.value}>{ct.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('Title')} *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-dark-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('Description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-dark-800 dark:text-white"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('Sort Order')}
            </label>
            <input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-dark-800 dark:text-white"
              min={0}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={closeModals} variant="outline" size="sm">
              {t('Cancel')}
            </Button>
            <Button
              onClick={handleEdit}
              variant="primary"
              size="sm"
              loading={submitting}
              disabled={!formData.title.trim()}
            >
              {t('Save')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title={t('Delete Category')} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('Are you sure you want to delete')} <strong>{deleteConfirm?.title}</strong>? {t('This action cannot be undone.')}
          </p>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setDeleteConfirm(null)} variant="outline" size="sm">
              {t('Cancel')}
            </Button>
            <Button
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              variant="danger"
              size="sm"
              loading={submitting}
            >
              {t('Delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
