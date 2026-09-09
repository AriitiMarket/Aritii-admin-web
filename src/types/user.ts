/** Registered marketplace user (any account: customer, rider, seller staff, ...). */
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  userType: 'CUSTOMER' | 'RIDER' | 'STORE' | 'SELLER';
  status: 'ACTIVE' | 'BLOCKED' | 'PENDING';
  isActive: boolean;
  registrationMethod?: string;
  lastLoginAt?: string;
  createdAt?: string;
  sectors: string[];
}

export interface UsersFilter {
  page: number;
  limit: number;
  search?: string;
  status?: User['status'];
}