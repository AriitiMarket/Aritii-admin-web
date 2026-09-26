/** Riders service facade. */
import type { PaginatedResult, Rider, RiderDetail, UsersFilter } from '@/types';
import { deliveryAdmin } from '@/api/admin';

export const ridersService = {
  async list(filter: UsersFilter & { status?: string }): Promise<PaginatedResult<Rider>> {
    const result = await deliveryAdmin.listRidersWithFilters(
      filter.page,
      filter.limit,
      filter.search,
      filter.status
    );
    return {
      items: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
    };
  },
  async get(id: string): Promise<RiderDetail> {
    return deliveryAdmin.getRider(id);
  },
  async create(data: Record<string, unknown>): Promise<Rider> {
    return deliveryAdmin.createRider(data) as Promise<Rider>;
  },
  async update(id: string, data: Record<string, unknown>): Promise<Rider> {
    return deliveryAdmin.updateRider(id, data) as Promise<Rider>;
  },
  async updateStatus(id: string, status: string): Promise<Rider> {
    return deliveryAdmin.updateRiderStatus(id, status);
  },
};
