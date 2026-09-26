// Enhanced types for Locations & Expansion module
//
// `Location` / `Zone` / `Route` are re-exported from the service layer rather
// than redeclared here: the service owns the real API response shape, and a
// second hand-written copy silently drifts (it already caused three separate
// type mismatches around `coordinates`, `status` and `ZoneCoverage`).
import type {
  Location,
  Zone,
  DeliveryRoute as Route,
} from '@/services/locations.service';

export type { Location, Zone, Route };

export interface LocationServiceability {
  serviceable: boolean;
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  codAvailable: boolean;
  estimatedDeliveryTime?: string;
  deliveryFee?: number;
  freeDeliveryThreshold?: number;
  minimumOrder?: number;
  operatingHours?: {
    open: string;
    close: string;
    days: string[];
  };
}

export interface HubInfo {
  isHub: boolean;
  hubName?: string;
  hubCode?: string;
  hubAddress?: string;
  contactInfo?: {
    phone?: string;
    email?: string;
  };
  operatingStatus: 'active' | 'inactive' | 'maintenance';
  capacity?: number;
}

export type ExpansionStatus = 'planned' | 'preparing' | 'testing' | 'active' | 'suspended' | 'closed';

export interface ExpansionProgress {
  locationCreated: boolean;
  serviceabilityConfigured: boolean;
  zonesConfigured: boolean;
  hubConfigured: boolean;
  routesConfigured: boolean;
  providersConfigured: boolean;
  serviceabilityTested: boolean;
  approved: boolean;
  activated: boolean;
}

export interface LocationStats {
  totalLocations: number;
  activeLocations: number;
  serviceableLocations: number;
  hubs: number;
  pendingExpansion: number;
}

export interface LocationDetail {
  location: Location;
  ancestors: Location[];
  children: Location[];
  zones: Zone[];
  hubs: Hub[];
  routes: Route[];
  stats: LocationActivityStats;
}

export interface LocationActivityStats {
  zones: number;
  shops: number;
  sellers: number;
  orders: number;
  riders: number;
  hubs: number;
}

export interface ZoneCoverage {
  radiusKm?: number;
  boundaries?: unknown;
  center?: {
    type: string;
    coordinates: number[];
  };
  includedAreas?: string[];
  excludedAreas?: string[];
}

export interface DeliveryRules {
  serviceable: boolean;
  deliveryFee: number;
  freeDeliveryThreshold?: number;
  estimatedDeliveryTime: string;
  minimumOrder?: number;
  codAvailable: boolean;
  pickupAvailable: boolean;
}

export interface OperationalRules {
  allowedProviders?: string[];
  allowedRiders?: string[];
  hubId?: string;
  priority?: number;
  operatingHours?: {
    open: string;
    close: string;
    days: string[];
  };
}

export interface ZoneStats {
  totalZones: number;
  activeZones: number;
  serviceableZones: number;
  unassignedZones: number;
  zonesWithActiveRoutes: number;
}

export interface ZoneDetail {
  zone: Zone;
  location: Location;
  routes: Route[];
  providers: Provider[];
  riders: Rider[];
  activity: ActivityLog[];
}

export interface RouteStats {
  totalRoutes: number;
  activeRoutes: number;
  routesInOperation: number;
  delayedRoutes: number;
  routesRequiringReview: number;
}

export interface RouteDetail {
  route: Route;
  origin: Location;
  destination: Location;
  stops: Location[];
  provider?: Provider;
  activeDeliveries: number;
  zones: Zone[];
  activity: ActivityLog[];
}

export interface Hub {
  _id: string;
  name: string;
  code: string;
  locationId: string;
  address: string;
  contactInfo: {
    phone?: string;
    email?: string;
  };
  operatingStatus: 'active' | 'inactive' | 'maintenance';
  capacity?: number;
  currentLoad?: number;
  zoneIds: string[];
  routeIds: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Provider {
  _id: string;
  name: string;
  code: string;
  status: 'active' | 'inactive' | 'suspended';
  zoneIds: string[];
  routeIds: string[];
  hubIds: string[];
  contactInfo?: {
    phone?: string;
    email?: string;
  };
}

export interface Rider {
  _id: string;
  name: string;
  status: 'available' | 'busy' | 'offline';
  zoneIds: string[];
  routeIds: string[];
  hubId?: string;
}

export interface ActivityLog {
  id: string;
  actor: string;
  action: string;
  resource: string;
  previousValue?: any;
  newValue?: any;
  timestamp: string;
  ipAddress?: string;
}

export interface ViewMode {
  list: 'list';
  map: 'map';
}