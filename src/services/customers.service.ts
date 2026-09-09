/** Customers service facade. */
import { isMockMode } from '@/utils/env';
import type { Customer, CustomerDetail, PaginatedResult, UsersFilter } from '@/types';
import { mockGetCustomer, mockListCustomers } from './mock/customers';
import { realGetCustomer, realListCustomers } from './real/customers';

export const customersService = {
  list(filter: UsersFilter): Promise<PaginatedResult<Customer>> {
    return isMockMode() ? mockListCustomers(filter) : realListCustomers(filter);
  },
  get(id: string): Promise<CustomerDetail> {
    return isMockMode() ? mockGetCustomer(id) : realGetCustomer(id);
  },
};