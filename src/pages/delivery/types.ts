// Shared types for Delivery & Logistics module

export interface DeliveryStats {
  activeDeliveries?: number;
  pendingDeliveries?: number;
  assignedDeliveries?: number;
  pickupDeliveries?: number;
  inTransitDeliveries?: number;
  completedDeliveries?: number;
  failedDeliveries?: number;
  cancelledDeliveries?: number;
  unassignedDeliveries?: number;
  deliveredToday?: number;
  pendingAssignments?: number;
  availablePartners?: number;
  busyPartners?: number;
  totalPartners?: number;
  pendingPartners?: number;
  suspendedPartners?: number;
  activeZones?: number;
  totalZones?: number;
  activeServices?: number;
  totalServices?: number;
  activeRoutes?: number;
  totalRoutes?: number;
  activeShipments?: number;
  waitingForDispatchShipments?: number;
  inTransitShipments?: number;
  arrivedShipments?: number;
  receivingShipments?: number;
}

export interface RecentDelivery {
  _id: string;
  orderId: string;
  status: string;
  partnerName?: string;
  /** Display name after the partner -> provider rename. */
  providerName?: string;
  pickupAddress?: {
    regionName?: string;
    areaName?: string;
    cityName?: string;
    sectorName?: string;
    shopName?: string;
  };
  destinationAddress?: {
    regionName?: string;
    areaName?: string;
    cityName?: string;
    sectorName?: string;
    addressDetail?: string;
    contactName?: string;
  };
  createdAt: string;
}

export interface Delivery {
  id: string;
  orderId: string;
  status: string;
  providerId?: string;
  partnerName?: string;
  /** Display name after the partner -> provider rename. */
  providerName?: string;
  sellerId?: string;
  sellerName?: string;
  shopName?: string;
  pickupAddress?: {
    regionName?: string;
    areaName?: string;
    cityName?: string;
    sectorName?: string;
    addressDetail?: string;
    contactPhone?: string;
    shopName?: string;
  };
  destinationAddress?: {
    regionName?: string;
    areaName?: string;
    cityName?: string;
    sectorName?: string;
    addressDetail?: string;
    contactName?: string;
    contactPhone?: string;
    instructions?: string;
    fullAddress?: string;
  };
  deliveryAddress?: {
    regionName?: string;
    areaName?: string;
    cityName?: string;
    sectorName?: string;
    addressDetail?: string;
    contactName?: string;
    contactPhone?: string;
    instructions?: string;
    fullAddress?: string;
  };
  createdAt: string;
  pickedUpAt?: string;
  deliveredAt?: string;
}

export interface RiderDelivery {
  _id: string;
  orderId: string;
  status: string;
  deliveryAddress?: {
    regionName?: string;
    cityName?: string;
    sectorName?: string;
    addressDetail?: string;
  };
  createdAt: string;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type DeliveryStatus = 'pending' | 'assigned' | 'pickup' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'cancelled' | 'reassigned';
export type RiderStatus = 'available' | 'busy' | 'offline' | 'pending' | 'suspended';