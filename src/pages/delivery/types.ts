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
  /** Mongoose timestamp — drives the "Last update" column on Overview. */
  updatedAt?: string;
}

export interface Delivery {
  /** Human-readable reference (DEL-1001) — what the UI shows. */
  deliveryRef?: string | null;
  /** Document id; the raw document form is `_id`. */
  id: string;
  _id?: string;
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
    contactName?: string;
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
  /** Mongoose timestamp — drives the "last update" column and the detail panel. */
  updatedAt?: string;
  /** Planned delivery time. */
  estimatedDeliveryAt?: string | null;
  /** Catalog service / route / port this delivery runs under. */
  serviceId?: string | null;
  routeId?: string | null;
  portId?: string | null;
  /**
   * The delivery's OWN geography (Zone -> Port). This is the operational record
   * an assignment never rewrites — a force-assigned provider from another area
   * is the exception, not the delivery's location (MVP §12).
   */
  destination?: {
    locationId?: string | null;
    zoneId?: string | null;
    portId?: string | null;
    regionName?: string;
    cityName?: string;
  };
  /** Present when the delivery was handed over after being assigned before. */
  assignmentId?: string | null;
  /** Failure handling — reason, agreed next action, attempt count. */
  failureReason?: string;
  cancellationReason?: string;
  returnReason?: string;
  nextAction?: string;
  retryCount?: number;
  proofOfDelivery?: {
    confirmedAt?: string | null;
    recipientName?: string | null;
    recipientReference?: string | null;
  };
  /** COD or PREPAID — the payment the rider collects at the door. */
  paymentMethod?: string;
  /** Amount the rider must collect when `paymentMethod` is COD. */
  paymentAmount?: number;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * The Delivery Service's status vocabulary.
 *
 * Every member is a status some flow can actually produce. The former list also
 * carried `validated`, `ready_for_pickup`, `out_for_delivery`,
 * `return_requested` and `returned`, none of which had a writer — so they could
 * be rendered but never reached.
 */
export type DeliveryStatus =
  | 'pending'
  | 'assigned'
  | 'reassigned'
  | 'pickup'
  | 'in_transit'
  | 'delivered'
  | 'failed'
  | 'cancelled';
export type RiderStatus = 'available' | 'busy' | 'offline' | 'pending' | 'suspended' | 'rejected';