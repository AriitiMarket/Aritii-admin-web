/**
 * Real users service — Ariiti API Gateway contract.
 * @boundary: these endpoints are the documented integration contracts and
 * are pending gateway/backend implementation.
 */
import { assertGatewayConfigured, http } from '@/services/client/httpClient';
import type {
  PaginatedResult,
  User,
  UsersFilter,
} from '@/types';

interface RealPagedUsers {
  data: { users: User[]; total: number; page: number; limit: number; totalPages: number };
}

export async function realListUsers(
  filter: UsersFilter
): Promise<PaginatedResult<User>> {
  assertGatewayConfigured();
  const response = await http.get<RealPagedUsers>('/admin/users', {
    params: {
      page: filter.page,
      limit: filter.limit,
      search: filter.search,
      status: filter.status,
    },
  });
  return {
    items: response.data.users,
    total: response.data.total,
    page: response.data.page,
    limit: response.data.limit,
    totalPages: response.data.totalPages,
  };
}

export async function realGetUser(id: string): Promise<User> {
  assertGatewayConfigured();
  const response = await http.get<{ data: { user: User } }>(`/admin/users/${id}`);
  return response.data.user;
}

export async function realUpdateUser(
  id: string,
  patch: Record<string, unknown>
): Promise<User> {
  assertGatewayConfigured();
  const response = await http.put<{ data: { user: User } }>(
    `/admin/users/${id}`,
    patch
  );
  return response.data.user;
}

export async function realDeleteUser(id: string): Promise<void> {
  assertGatewayConfigured();
  await http.delete(`/admin/users/${id}`);
}