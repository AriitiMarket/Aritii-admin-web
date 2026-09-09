/**
 * Real customers service — Ariiti API Gateway contract.
 * @boundary: these endpoints are the documented integration contracts and
 * are pending gateway/backend implementation.
 */
import { assertGatewayConfigured, http } from '@/services/client/httpClient';
import type {
  Customer,
  CustomerDetail,
  PaginatedResult,
  UsersFilter,
} from '@/types';

interface RealPagedCustomers {
  data: { customers: Customer[]; total: number; page: number; limit: number };
}

export async function realListCustomers(
  filter: UsersFilter
): Promise<PaginatedResult<Customer>> {
  assertGatewayConfigured();
  const response = await http.get<RealPagedCustomers>('/customers', {
    params: { page: filter.page, limit: filter.limit, search: filter.search },
  });
  const { customers, total, page, limit } = response.data;
  return {
    items: customers,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function realGetCustomer(id: string): Promise<CustomerDetail> {
  assertGatewayConfigured();
  const response = await http.get<{ data: { customer: CustomerDetail } }>(
    `/customers/${id}`
  );
  return response.data.customer;
}