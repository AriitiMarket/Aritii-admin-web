/** Stores service facade — normalizes API sources into a paged list. */
import type { PaginatedResult, Store, StoreDetail } from '@/types';
import { commerceAdmin } from '@/api/admin';

export interface StoreListFilter {
  page: number;
  limit: number;
  search?: string;
  status?: 'PENDING' | 'ACTIVE' | 'INACTIVE';
  locationId?: string;
  sectorId?: string;
  ownerEmail?: string;
  dateFrom?: string;
  dateTo?: string;
}

function paginateStores(stores: Store[], page: number, limit: number): PaginatedResult<Store> {
  const start = (page - 1) * limit;
  const items = stores.slice(start, start + limit);
  return {
    items,
    total: stores.length,
    page,
    limit,
    totalPages: Math.ceil(stores.length / limit),
  };
}

export const storesService = {
  async list(filter: StoreListFilter): Promise<PaginatedResult<Store>> {
    const stores = await commerceAdmin.listShops(filter.page, filter.limit, filter.search);
    const term = (filter.search ?? '').toLowerCase();
    const filtered = stores.filter((store) => {
      if (term && !store.name.toLowerCase().includes(term)) return false;
      if (filter.status && store.status !== filter.status) return false;
      if (filter.locationId && store.locationId !== filter.locationId) return false;
      if (filter.sectorId && store.sectorId !== filter.sectorId) return false;
      if (filter.ownerEmail && store.email?.toLowerCase() !== filter.ownerEmail.toLowerCase()) return false;
      if (filter.dateFrom && store.createdAt && new Date(store.createdAt) < new Date(filter.dateFrom)) return false;
      if (filter.dateTo && store.createdAt && new Date(store.createdAt) > new Date(filter.dateTo)) return false;
      return true;
    });
    return paginateStores(filtered, filter.page, filter.limit);
  },
  pending(): Promise<Store[]> {
    return commerceAdmin.listPendingShops();
  },
  get(id: string): Promise<StoreDetail> {
    return commerceAdmin.getShop(id);
  },
  approve(id: string) {
    return commerceAdmin.approveShop(id);
  },
  reject(id: string, reason?: string) {
    return commerceAdmin.rejectShop(id, reason);
  },
  async bulkUpdateStatus(ids: string[], status: Store['status']): Promise<void> {
    for (const id of ids) {
      if (status === 'ACTIVE') {
        await commerceAdmin.approveShop(id);
      } else if (status === 'INACTIVE') {
        await commerceAdmin.rejectShop(id, 'Bulk deactivated');
      }
    }
  },
  async exportToCSV(stores: Store[]): Promise<string> {
    const headers = [
      'ID',
      'Name',
      'Email',
      'Phone',
      'Address',
      'Location',
      'Sector',
      'Status',
      'Rating',
      'Total Orders',
      'Commission Rate',
      'Tax Rate',
      'Created At',
      'Updated At',
    ];

    const rows = stores.map((store) => [
      store.id,
      store.name,
      store.email || '',
      store.phone || '',
      store.address || '',
      store.locationId || '',
      typeof store.sector === 'string' ? store.sector : (store.sector?.name || ''),
      store.status,
      store.rating || '',
      store.totalOrders || '',
      store.commissionRate || '',
      store.tax || '',
      store.createdAt || '',
      store.updatedAt || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const str = String(cell || '');
            return str.includes(',') ? `"${str.replace(/"/g, '""')}"` : str;
          })
          .join(',')
      ),
    ].join('\n');

    return csvContent;
  },
};
