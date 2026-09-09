/** Mock-mode customers implementation — derived from the mock user store. */
import { http } from '@/services/client/httpClient';
import type {
  Customer,
  CustomerDetail,
  PaginatedResult,
  UsersFilter,
} from '@/types';
import type { MockUser } from './types';
import { toUser } from './users';

interface MockUsersResponse {
  users: MockUser[];
}

const toCustomer = (raw: MockUser): Customer => {
  const user = toUser(raw);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    status: user.status,
    ordersCount: 0,
    totalSpent: 0,
    sector: user.sectors[0] ?? '',
  };
};

export async function mockListCustomers(
  filter: UsersFilter
): Promise<PaginatedResult<Customer>> {
  const response = await http.get<MockUsersResponse>('/admin/users', {
    params: { page: 1, limit: 100, search: filter.search },
  });
  const customers = response.users
    .filter((raw) => raw.userType === 'CUSTOMER')
    .map(toCustomer);
  const term = (filter.search ?? '').toLowerCase();
  const filtered = term
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term)
      )
    : customers;
  const start = (filter.page - 1) * filter.limit;
  const items = filtered.slice(start, start + filter.limit);
  return {
    items,
    total: filtered.length,
    page: filter.page,
    limit: filter.limit,
    totalPages: Math.ceil(filtered.length / filter.limit),
  };
}

export async function mockGetCustomer(id: string): Promise<CustomerDetail> {
  const response = await http.get<{ user: MockUser }>(`/admin/user/${id}`);
  const customer = toCustomer(response.user);
  return {
    ...customer,
    addresses: (response.user.addresses ?? []).map((address) => ({
      label: address.label,
      deliveryAddress: address.deliveryAddress,
      details: address.details,
    })),
  };
}