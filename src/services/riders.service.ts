/** Riders service facade — delegates to providersService (single client). */
import type { PaginatedResult, Rider, RiderDetail, UsersFilter } from '@/types';
import { providersService } from './providers.service';

type ProviderLike = Record<string, unknown> & { _id?: string; id?: string };

function asRider(p: ProviderLike): Rider {
  return { ...p, id: (p._id ?? p.id) as string } as unknown as Rider;
}

export const ridersService = {
  async list(filter: UsersFilter & { status?: string; isOnline?: boolean }): Promise<PaginatedResult<Rider>> {
    const result = await providersService.list({
      page: filter.page,
      limit: filter.limit,
      search: filter.search,
      status: filter.status,
      isOnline: filter.isOnline === undefined ? undefined : String(filter.isOnline),
    });
    return {
      items: result.items.map((p) => asRider(p as unknown as ProviderLike)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  },
  async get(id: string): Promise<RiderDetail> {
    const p = await providersService.get(id);
    return asRider(p as unknown as ProviderLike) as unknown as RiderDetail;
  },
  async create(data: Record<string, unknown>): Promise<Rider> {
    return asRider((await providersService.create(data as never)) as unknown as ProviderLike);
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
      'serviceId', 'sectorId', 'portId', 'zoneId', 'zoneIds', 'maxCapacityKg',
      'maxActiveAssignments', 'rating', 'metadata',
    ];
    const payload: Record<string, unknown> = {};
    for (const field of EDITABLE_FIELDS) {
      if (data[field] !== undefined) payload[field] = data[field];
    }
    return asRider((await providersService.update(id, payload as never)) as unknown as ProviderLike);
  },
  async updateStatus(id: string, status: string): Promise<Rider> {
    return asRider((await providersService.setStatus(id, status as never)) as unknown as ProviderLike);
  },
  /**
   * Approve a pending applicant.
   *
   * This MUST be the approve endpoint, not `updateStatus('offline')`: approval
   * also provisions the PROVIDER account role in Identity. Flipping the roster
   * status alone left an "approved" rider who could not enter the provider
   * workspace, because their membership was still PENDING.
   */
  async approve(id: string): Promise<Rider> {
    return asRider((await providersService.approve(id)) as unknown as ProviderLike);
  },
  /** Reject an application with a reason (stores it for the status page). */
  async reject(id: string, reason?: string): Promise<Rider> {
    return asRider((await providersService.reject(id, reason)) as unknown as ProviderLike);
  },
};
