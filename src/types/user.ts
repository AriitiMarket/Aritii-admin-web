/** Registered marketplace user (any account: customer, seller, agent, admin, ...). */
export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: 'CUSTOMER' | 'SELLER' | 'AGENT' | 'ADMIN';
  avatar?: {
    public_id: string | null;
    url: string | null;
  };
  addresses?: any[];
  shopId?: string | null;
  status: 'active' | 'inactive' | 'suspended' | 'banned';
  isVerified?: boolean;
  sellerStatus?: 'INACTIVE' | 'PENDING' | 'ACTIVE' | 'REJECTED';
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  lastActivityAt?: string;
}

export interface UsersFilter {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}