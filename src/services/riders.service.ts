/** Riders service facade. */
import type { PaginatedResult, Rider, RiderDetail, UsersFilter } from '@/types';
import { deliveryAdmin } from '@/api/admin';

export const ridersService = {
  async list(filter: UsersFilter & { status?: string; isOnline?: boolean }): Promise<PaginatedResult<Rider>> {
    const result = await deliveryAdmin.listRidersWithFilters(
      filter.page,
      filter.limit,
      filter.search,
      filter.status,
      filter.isOnline
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
  /**
   * Update a delivery provider's profile.
   *
   * Only the fields the Delivery Service accepts are sent: its roster endpoint
   * rejects anything else with `UNSUPPORTED_FIELD`, and the operational fields
   * (`status`, `activeDeliveries`, `currentWorkloadIds`, `identityUserId`) are
   * owned by the service's own transition rules and capacity counters. Status
   * changes go through `updateStatus` below.
   */
  async update(id: string, data: Record<string, unknown>): Promise<Rider> {
    const EDITABLE_FIELDS = [
      'name', 'phone', 'email', 'providerType', 'actorType', 'vehicleType', 'plateNumber',
      'serviceId', 'sectorId', 'hubId', 'zoneId', 'zoneIds', 'maxCapacityKg',
      'maxActiveAssignments', 'rating', 'metadata',
    ];
    const payload: Record<string, unknown> = {};
    for (const field of EDITABLE_FIELDS) {
      if (data[field] !== undefined) payload[field] = data[field];
    }
    return deliveryAdmin.updateRider(id, payload) as Promise<Rider>;
  },
  async updateStatus(id: string, status: string): Promise<Rider> {
    return deliveryAdmin.updateRiderStatus(id, status);
  },
};
