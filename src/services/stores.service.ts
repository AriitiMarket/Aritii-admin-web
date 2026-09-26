/** Stores service facade — normalizes API sources into a paged list. */
import type { PaginatedResult, Store, StoreDetail } from '@/types';
import { commerceAdmin, adminApi } from '@/api/admin';

export interface StoreListFilter {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  sector?: string;
  sectorId?: string;
  locationId?: string;
  /** SellerApplication id (the business). */
  businessId?: string;
  ownerId?: string;
  ownerEmail?: string;
  dateFrom?: string;
  dateTo?: string;
}

function mapShopToStore(shop: any): Store {
  return {
    ...shop,
    id: shop._id || shop.id,
    ownerId: shop.ownerId,
    ownerName: shop.ownerName || shop.owner?.name,
    ownerEmail: shop.ownerEmail || shop.owner?.email || shop.email,
    locationSnapshot: shop.locationSnapshot || undefined,
    sectorId: shop.sectorId || (typeof shop.sector === 'string' ? shop.sector : shop.sector?.id),
  };
}

export const storesService = {
  async list(filter: StoreListFilter): Promise<PaginatedResult<Store>> {
    const params: Record<string, unknown> = {
      page: filter.page,
      limit: filter.limit,
    };
    if (filter.search) params.search = filter.search;
    if (filter.status && filter.status !== 'all') params.status = filter.status;
    if (filter.sectorId && filter.sectorId !== 'all') params.sectorId = filter.sectorId;
    if (filter.businessId) params.businessId = filter.businessId;
    if (filter.ownerId) params.ownerId = filter.ownerId;
    // The backend resolves the email to an owner id (Identity lookup) and
    // answers "no match" for an unknown address — it is no longer ignored.
    if (filter.ownerEmail) params.ownerEmail = filter.ownerEmail;

    const result = await adminApi.getShopsPaged(params);
    return {
      items: (result.items || []).map(mapShopToStore),
      total: result.total || 0,
      page: result.page || filter.page,
      limit: result.limit || filter.limit,
      totalPages: result.totalPages || 1,
    };
  },

  pending(): Promise<Store[]> {
    return commerceAdmin.listPendingShops();
  },

  async get(id: string): Promise<StoreDetail> {
    const shop = await commerceAdmin.getShop(id);
    return {
      ...shop,
      id: shop._id || shop.id,
      ownerId: shop.ownerId,
      ownerName: shop.ownerName || shop.owner?.name,
      ownerEmail: shop.ownerEmail || shop.owner?.email || shop.email,
      locationSnapshot: shop.locationSnapshot || undefined,
    } as StoreDetail;
  },

  approve(id: string) {
    return commerceAdmin.approveShop(id);
  },

  reject(id: string, reason?: string) {
    return commerceAdmin.rejectShop(id, reason);
  },

  /**
   * Admin "allow in public" toggle (in-place switch on the Stores table).
   * Server cascades the flag to the shop's embedded product/event snapshots.
   */
  setShowOnPublic(id: string, showOnPublic: boolean) {
    return adminApi.setShopShowOnPublic(id, showOnPublic);
  },

  /** Temporarily take a shop off the platform (status → SUSPENDED). */
  suspend(id: string, reason?: string) {
    return commerceAdmin.suspendShop(id, reason);
  },

  /** Bring a suspended/rejected shop back (status → APPROVED). */
  activate(id: string) {
    return commerceAdmin.activateShop(id);
  },

  async exportToCSV(stores: Store[]): Promise<string> {
    const headers = [
      'ID',
      'Name',
      'Owner',
      'Email',
      'Phone',
      'Address',
      'Region',
      'City',
      'Sector',
      'Status',
      'Rating',
      'Total Orders',
      'Created At',
    ];

    const rows = stores.map((store) => [
      store.id,
      store.name,
      store.ownerName || store.ownerEmail || '',
      store.ownerEmail || store.email || '',
      store.phoneNumber || store.phone || '',
      store.address || store.locationSnapshot?.fullAddress || '',
      store.locationSnapshot?.regionName || '',
      store.locationSnapshot?.cityName || '',
      store.locationSnapshot?.sectorName || (typeof store.sector === 'string' ? store.sector : store.sector?.name || ''),
      store.status,
      store.ratings ?? store.rating ?? '',
      store.orderCount ?? store.totalOrders ?? '',
      store.createdAt || '',
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
