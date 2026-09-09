/** Seller (vendor) accounts that operate stores on the marketplace. */
export interface Seller {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'ACTIVE' | 'BLOCKED' | 'PENDING';
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