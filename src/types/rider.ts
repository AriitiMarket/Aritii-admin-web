/** Rider (delivery) accounts. */
export interface Rider {
  id: string;
  name: string;
  username?: string;
  email?: string;
  phone?: string;
  status: 'ACTIVE' | 'BLOCKED' | 'PENDING';
  isActive: boolean;
  vehicleType?: string;
  sector: string;
  totalDeliveries?: number;
  createdAt?: string;
}

export interface RiderDetail extends Rider {
  zone?: { id?: string; name?: string };
  earnings?: number;
  address?: string;
}