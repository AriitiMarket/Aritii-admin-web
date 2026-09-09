/** Store (renamed from the legacy "restaurant" concept without changing its data meaning). */
export interface Store {
  id: string;
  name: string;
  email?: string;
  image?: string;
  phone?: string;
  address?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  isActive: boolean;
  orderId?: string | number;
  orderPrefix?: string;
  commissionRate?: number;
  tax?: number;
  sector: string;
  cuisines?: string[];
  rating?: number;
  totalOrders?: number;
  createdAt?: string;
}

export interface StoreDetail extends Store {
  owner?: {
    id?: string;
    email?: string;
    name?: string;
    isActive?: boolean;
  };
  deliveryInfo?: {
    minDeliveryFee?: number;
    deliveryFee?: number;
    deliveryDistance?: number;
  };
  location?: {
    coordinates?: number[];
    label?: string;
  };
}