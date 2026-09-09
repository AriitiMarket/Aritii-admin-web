/** Mock-mode users implementation. */
import { http } from '@/services/client/httpClient';
import type { PaginatedResult, User, UsersFilter } from '@/types';
import type { MockPaginated, MockUser } from './types';

export interface MockUsersResponse {
  users: MockUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const mapUserType = (value: string): User['userType'] => {
  return value === 'RIDER' || value === 'STORE' || value === 'SELLER'
    ? value
    : 'CUSTOMER';
};

const mapStatus = (raw: MockUser): User['status'] => {
  if (raw.status === 'BLOCKED' || raw.status === 'PENDING') return raw.status;
  if (raw.isActive === false) return 'PENDING';
  return 'ACTIVE';
};

export const toUser = (raw: MockUser): User => ({
  id: raw._id,
  name: raw.name,
  email: raw.email,
  phone: raw.phone,
  userType: mapUserType(raw.userType),
  status: mapStatus(raw),
  isActive: raw.isActive ?? true,
  registrationMethod: raw.registrationMethod,
  lastLoginAt: raw.lastLogin,
  createdAt: raw.createdAt,
  sectors: [],
});

export async function mockListUsers(
  filter: UsersFilter
): Promise<PaginatedResult<User>> {
  const response = await http.get<MockUsersResponse>('/admin/users', {
    params: {
      page: filter.page,
      limit: filter.limit,
      search: filter.search,
    },
  });
  const { users, total, page, limit, totalPages } = response;
  return {
    items: users.map(toUser),
    total,
    page,
    limit,
    totalPages: totalPages || Math.ceil(total / limit),
  };
}

export async function mockGetUser(id: string): Promise<User> {
  const response = await http.get<{ user: MockUser }>(`/admin/user/${id}`);
  return toUser(response.user);
}

export async function mockUpdateUser(
  id: string,
  patch: Record<string, unknown>
): Promise<User> {
  const response = await http.put<{ user: MockUser }>(`/admin/user/${id}`, patch);
  return toUser(response.user);
}

export async function mockDeleteUser(id: string): Promise<void> {
  await http.delete(`/admin/user/${id}`);
}

export const mockUsersPagination = (): Omit<MockPaginated<User>, 'items' | 'total'> => ({
  page: 1,
  limit: 10,
  totalPages: 1,
});