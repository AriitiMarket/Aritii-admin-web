/** Location - Hierarchical geographic structure for delivery coverage */
export interface Location {
  id: string;
  name: string;
  type: 'country' | 'region' | 'city' | 'town' | 'area' | 'sector' | 'community' | 'village' | 'rural' | 'other';
  parentId?: string;
  code?: string;
  description?: string;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocationDetail extends Location {
  parent?: Location;
  children?: Location[];
  deliveryZones?: DeliveryZone[];
}

export interface LocationHierarchyNode extends Location {
  children?: LocationHierarchyNode[];
  level?: number; // depth in hierarchy
  expandable?: boolean;
}

export interface DeliveryZone {
  id: string;
  locationId: string;
  name: string;
  deliveryFee: number;
  estimatedDeliveryTime: number; // minutes
  polygon?: string; // GeoJSON polygon (optional)
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocationStats {
  locationId: string;
  locationName: string;
  shopCount: number;
  sellerCount: number;
  activeProductCount: number;
  deliveryZoneCount: number;
  averageShopRating?: number;
  totalOrders30Days: number;
  totalGMV30Days: number;
  averageOrderValue?: number;
  coveragePercentage?: number;
  lastUpdated?: string;
}

export interface LocationListFilter {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  parentId?: string;
  isActive?: boolean;
}

export interface LocationListResponse {
  items: Location[];
  total: number;
  totalPages: number;
}
