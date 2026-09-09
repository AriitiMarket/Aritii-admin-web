/** Customer accounts. */
import type { User } from '@/types/user';

export type CustomerStatus = 'ACTIVE' | 'BLOCKED' | 'PENDING';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: CustomerStatus;
  ordersCount: number;
  totalSpent: number;
  sector: string;
  createdAt?: string;
}

export interface CustomerDetail extends Customer {
  addresses: Array<{
    id?: string;
    label?: string;
    deliveryAddress?: string;
    details?: string;
  }>;
  notes?: string;
}

export const toCustomer = (user: User): Customer | null => {
  if (user.userType !== 'CUSTOMER') return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    status: user.status as CustomerStatus,
    ordersCount: 0,
    totalSpent: 0,
    sector: user.sectors[0] ?? '',
  };
};