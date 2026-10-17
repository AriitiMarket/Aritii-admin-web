/** Store (Shop in Commerce Service). Field names match the Shop model / API. */
export interface Store {
  id: string;
  name: string;
  email?: string;
  image?: string;
  /** Shop contact phone — model field is `phoneNumber` (string). */
  phoneNumber?: string;
  /** @deprecated Prefer `phoneNumber`; kept for older payloads. */
  phone?: string;
  address?: string;
  description?: string;
  zipCode?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING_APPROVAL' | 'APPROVED' | 'SUSPENDED';
  isActive: boolean;
  /**
   * Shop category (Category type `business`) — the storefront browses /shops
   * by this value. Distinct from the application's `businessInformation.
   * businessCategory`: a business may run several shops, each its own category.
   */
  category?: string;
  /**
   * Admin "allow in public" — false hides the shop (and cascades to its
   * products) from every public/guest view. Toggled in-place on the Stores
   * table; missing counts as allowed (legacy docs).
   */
  showOnPublic?: boolean;
  orderId?: string | number;
  orderPrefix?: string;
  commissionRate?: number;
  tax?: number;
  sector: string | { id?: string; name?: string; deliveryFee?: number; estimatedDeliveryTime?: number };
  sectorId?: string;
  cuisines?: string[];
  /** Computed shop rating (0–5). API field is `ratings`, not `rating`. */
  ratings?: number;
  /** @deprecated Prefer `ratings`. */
  rating?: number;
  ratingCount?: number;
  /** Real order count for this shop (detail; list may omit). */
  orderCount?: number;
  /** @deprecated Prefer `orderCount`. */
  totalOrders?: number;
  /** Commerce Service shop balances. */
  availableBalance?: number;
  createdAt?: string;
  updatedAt?: string;
  // Location and expansion fields
  locationId?: string;
  applicationId?: string | null;
  /** Real product count for this shop (list and detail responses). */
  productCount?: number;
  // Owner/seller relationship
  ownerId?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhoneNumber?: string | null;
  // Business the shop belongs to (a shop is always one business's outlet).
  businessId?: string | null;
  businessName?: string | null;
  businessStatus?: string | null;
  // Location hierarchy from shop.locationSnapshot
  locationSnapshot?: {
    regionId?: string;
    regionName?: string;
    cityId?: string;
    cityName?: string;
    areaId?: string;
    areaName?: string;
    sectorId?: string;
    sectorName?: string;
    fullAddress?: string;
    landmark?: string;
    building?: string;
    contactPhone?: string;
    /** Matches Shop.locationSnapshot.coordinates. */
    coordinates?: { latitude?: number | null; longitude?: number | null };
  };
  /** Delivery coverage — which delivery zones this shop serves. */
  deliveryCoverage?: {
    zoneIds?: string[];
    zoneNames?: { id?: string; name?: string }[];
    status?: 'UNCONFIGURED' | 'ACTIVE' | 'PAUSED';
    source?: string;
    verifiedAt?: string;
  };
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
    role?: string;
    status?: string;
    isActive?: boolean;
  };
  /** Real counts computed by the Commerce Service for this shop. */
  productCount?: number;
  orderCount?: number;
  /** Computed catalog rating (from `withCatalogStats`). */
  ratings?: number;
  ratingCount?: number;
  /** The business (seller application) this shop belongs to, when linked. */
  applicationId?: string | null;
  businessStatus?: string | null;
  businessInformation?: {
    businessName?: string;
    businessCategory?: string;
    description?: string;
    phone?: string;
    email?: string;
  } | null;
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
