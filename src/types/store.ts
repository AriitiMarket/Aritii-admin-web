/** Store (Shop in Commerce Service). */
export interface Store {
  id: string;
  name: string;
  email?: string;
  image?: string;
  phone?: string;
  address?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING_APPROVAL' | 'APPROVED' | 'SUSPENDED';
  isActive: boolean;
  orderId?: string | number;
  orderPrefix?: string;
  commissionRate?: number;
  tax?: number;
  sector: string | { id?: string; name?: string; deliveryFee?: number; estimatedDeliveryTime?: number };
  sectorId?: string;
  cuisines?: string[];
  rating?: number;
  totalOrders?: number;
  createdAt?: string;
  updatedAt?: string;
  // NEW: Location and expansion fields
  locationId?: string;
  applicationId?: string;
  approvalMetadata?: {
    approvedBy?: string;
    approvedAt?: string;
    rejectionReason?: string;
    suspensionReason?: string;
  };
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
    id?: string;
    name?: string;
    type?: string;
    coordinates?: number[];
    label?: string;
  };
}