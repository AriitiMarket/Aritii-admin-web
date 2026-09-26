/**
 * Delivery Network Service
 * 
 * Provides validation and lookup functions for the geographic network:
 * Location → Zone → Route → Provider/Rider → Assignment
 */

import { locationsService, zonesService, routesService } from './locations.service';
import type { Location, Zone, DeliveryRoute } from './locations.service';

export interface NetworkPath {
  pickupLocation: Location | null;
  pickupZone: Zone | null;
  route: DeliveryRoute | null;
  deliveryZone: Zone | null;
  destinationLocation: Location | null;
  valid: boolean;
  errors: string[];
}

export interface NetworkValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  path: NetworkPath;
}

/**
 * Validate a delivery path through the network
 */
export async function validateDeliveryPath(params: {
  pickupLocationId?: string;
  destinationLocationId?: string;
  zoneId?: string;
  routeId?: string;
}): Promise<NetworkValidation> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const path: NetworkPath = {
    pickupLocation: null,
    pickupZone: null,
    route: null,
    deliveryZone: null,
    destinationLocation: null,
    valid: false,
    errors,
  };

  try {
    // Load destination location
    if (params.destinationLocationId) {
      path.destinationLocation = await locationsService.get(params.destinationLocationId);
      if (!path.destinationLocation.isActive) {
        errors.push('Destination location is inactive');
      }
      if (!path.destinationLocation.serviceability?.serviceable) {
        errors.push('Destination location is not serviceable');
      }
    }

    // Load pickup location
    if (params.pickupLocationId) {
      path.pickupLocation = await locationsService.get(params.pickupLocationId);
      if (!path.pickupLocation.isActive) {
        errors.push('Pickup location is inactive');
      }
    }

    // Load delivery zone
    if (params.zoneId) {
      path.deliveryZone = await zonesService.get(params.zoneId);
      if (path.deliveryZone.status !== 'active') {
        errors.push('Delivery zone is not active');
      }
      if (!path.deliveryZone.deliveryRules?.serviceable) {
        errors.push('Delivery zone is not serviceable');
      }
    } else if (params.destinationLocationId) {
      // Auto-find zone for destination
      const zones = await zonesService.findByLocation(params.destinationLocationId);
      const activeZone = zones.find(z => z.status === 'active' && z.deliveryRules?.serviceable);
      if (activeZone) {
        path.deliveryZone = activeZone;
      } else {
        warnings.push('No active serviceable zone found for destination');
      }
    }

    // Load route
    if (params.routeId) {
      path.route = await routesService.get(params.routeId);
      if (path.route.status !== 'active') {
        errors.push('Route is not active');
      }
    } else if (params.pickupLocationId && params.destinationLocationId) {
      // Auto-find route between locations
      const routes = await routesService.list({
        originId: params.pickupLocationId,
        destinationId: params.destinationLocationId,
      });
      const activeRoute = routes.routes.find(r => r.status === 'active');
      if (activeRoute) {
        path.route = activeRoute;
      } else {
        warnings.push('No active route found between pickup and destination');
      }
    }

    // Check route connectivity
    if (path.route && path.pickupLocation && path.destinationLocation) {
      if (path.route.originLocationId !== path.pickupLocation._id) {
        errors.push('Route origin does not match pickup location');
      }
      if (path.route.destinationLocationId !== path.destinationLocation._id) {
        errors.push('Route destination does not match destination location');
      }
    }

    path.valid = errors.length === 0;
  } catch (err) {
    errors.push(`Network validation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  return { valid: errors.length === 0, errors, warnings, path };
}

/**
 * Get available zones for a location
 */
export async function getZonesForLocation(locationId: string): Promise<Zone[]> {
  const zones = await zonesService.findByLocation(locationId);
  return zones.filter(z => z.status === 'active' && z.deliveryRules?.serviceable);
}

/**
 * Get available routes between two locations
 */
export async function getRoutesBetweenLocations(
  originId: string,
  destinationId: string
): Promise<DeliveryRoute[]> {
  const routes = await routesService.list({
    originId,
    destinationId,
  });
  return routes.routes.filter(r => r.status === 'active');
}

/**
 * Calculate delivery fee based on zone rules
 */
export function calculateDeliveryFee(zone: Zone, orderValue?: number): number {
  if (!zone.deliveryRules) return 0;
  
  const { deliveryFee, freeDeliveryThreshold } = zone.deliveryRules;
  
  // Free delivery if order meets threshold
  if (freeDeliveryThreshold && orderValue && orderValue >= freeDeliveryThreshold) {
    return 0;
  }
  
  return deliveryFee || 0;
}

/**
 * Get estimated delivery time for a zone
 */
export function getEstimatedDeliveryTime(zone: Zone): string {
  return zone.deliveryRules?.estimatedDeliveryTime || '30-45 min';
}

/**
 * Check if COD is available for a zone
 */
export function isCodAvailable(zone: Zone): boolean {
  return zone.deliveryRules?.codAvailable ?? false;
}

/**
 * Check if pickup is available for a zone
 */
export function isPickupAvailable(zone: Zone): boolean {
  return zone.deliveryRules?.pickupAvailable ?? false;
}

export const deliveryNetworkService = {
  validateDeliveryPath,
  getZonesForLocation,
  getRoutesBetweenLocations,
  calculateDeliveryFee,
  getEstimatedDeliveryTime,
  isCodAvailable,
  isPickupAvailable,
};