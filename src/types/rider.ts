/** Rider (delivery actor) types — aligned with Delivery Service Partner model. */
export type RiderStatus = 'pending' | 'available' | 'busy' | 'offline' | 'suspended' | 'rejected';
export type ActorType = 'rider' | 'driver' | 'courier' | 'pickup_agent';

export interface Rider {
  id: string;
  name: string;
  username?: string;
  email?: string;
  phone?: string;
  status: RiderStatus;
  isActive: boolean;
  actorType?: ActorType;
  vehicleType?: string;
  plateNumber?: string;
  portId?: string | null;
  portName?: string;
  totalDeliveries?: number;
  activeDeliveries?: number;
  completedDeliveries?: number;
  /** Max concurrent active assignments this rider may hold (dispatch capacity). */
  maxActiveAssignments?: number;
  rating?: number;
  zone?: { id?: string; name?: string; _id?: string };
  zoneId?: string;
  zoneIds?: string[];
  locationSnapshot?: {
    regionName?: string;
    cityName?: string;
    fullAddress?: string;
  };
  createdAt?: string;
}

export interface RiderDetail extends Rider {
  earnings?: number;
  address?: string;
  identityUserId?: string;
  zone?: { id?: string; name?: string; _id?: string };
  availability?: {
    isOnline?: boolean;
    lastSeenAt?: string;
  };
  statusHistory?: Array<{
    status: RiderStatus;
    changedAt: string;
    note?: string;
  }>;
}
