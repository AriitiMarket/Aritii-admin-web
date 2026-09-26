/** Customer accounts. */
import type { User } from '@/types/user';

export type CustomerStatus = 'ACTIVE' | 'BLOCKED' | 'PENDING';

/** Maps the identity-service account status onto the admin customer status. */
const CUSTOMER_STATUS_MAP: Record<string, CustomerStatus> = {
  active: 'ACTIVE',
  inactive: 'BLOCKED',
  suspended: 'BLOCKED',
  banned: 'BLOCKED',
  pending: 'PENDING',
};

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
  if (user.role !== 'CUSTOMER') return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phoneNumber,
    status: CUSTOMER_STATUS_MAP[user.status] ?? 'PENDING',
    ordersCount: 0,
    totalSpent: 0,
    sector: '',
  };
};