/** Seller (vendor) accounts that operate stores on the marketplace. */
// Identity Service exposes `seller_status` (seller lifecycle) and `status`
// (account status). The admin console reads both via the `toUser` mapping, so
// the type mirrors those canonical backend fields.
export type SellerStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'REJECTED';
export type SellerAccountStatus = 'active' | 'inactive' | 'suspended' | 'banned';

export interface Seller {
  id: string;
  name: string;
  email: string;
  phone?: string;            // legacy alias
  phoneNumber?: string;      // Identity Service `phone_number` (toUser)
  status: SellerAccountStatus | SellerStatus;   // account status (toUser) / seller status
  sellerStatus?: SellerStatus; // Identity Service `seller_status` (toUser)
  isActive: boolean;
  storesCount: number;
  totalRevenue?: number;
  sector: string;
  createdAt?: string;
}

export interface SellerDetail extends Seller {
  stores: string[];
  address?: string;
  commissionRate?: number;
}