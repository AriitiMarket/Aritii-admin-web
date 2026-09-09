/**
 * Raw response shapes returned by the bundled mock REST backend
 * (mock-backend/server.js). These shapes intentionally mirror the legacy
 * GraphQL field names so the migration stays drop-in friendly.
 */
import type { OrderStatus, OrderType } from '@/types/order';

export interface MockSession {
  _id?: string;
  shopType?: string;
  userId: string;
  userType: 'ADMIN' | 'STAFF' | 'VENDOR' | 'RESTAURANT';
  userTypeId?: string;
  token: string;
  refreshToken?: string;
  tokenExpiration?: string;
  email: string;
  name?: string;
  image?: string;
  restaurants?: Array<{ _id: string; name?: string }>;
  permissions?: string[];
  isActive?: boolean;
}

export interface MockUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  userType: string;
  status?: string;
  isActive?: boolean;
  registrationMethod?: string;
  lastLogin?: string;
  createdAt?: string;
  addresses?: Array<{ deliveryAddress?: string; details?: string; label?: string }>;
}

export interface MockVendor {
  _id: string;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  image?: string;
  username?: string;
  address?: string;
  isActive?: boolean;
  restaurants: Array<{ _id: string }>;
  totalRestaurants?: number;
  createdAt?: string;
}

export interface MockRestaurant {
  _id: string;
  name: string;
  image?: string;
  logo?: string;
  address?: string;
  phone?: string;
  username?: string;
  isActive?: boolean;
  isAvailable?: boolean;
  stripeDetailsSubmitted?: boolean;
  rating?: number;
  reviewAverage?: number;
  shopType?: string;
  cuisines?: string[];
  commissionRate?: number;
  tax?: number;
  orderId?: string | number;
  orderPrefix?: string;
  createdAt?: string;
  owner?: { _id: string; email?: string; isActive?: boolean };
  deliveryInfo?: {
    minDeliveryFee?: number;
    deliveryFee?: number;
    deliveryDistance?: number;
  };
  location?: { coordinates?: number[]; label?: string };
}

export interface MockRider {
  _id: string;
  name: string;
  username?: string;
  email?: string;
  phone?: string;
  image?: string;
  available?: boolean;
  isActive?: boolean;
  vehicleType?: string;
  zone?: { _id?: string; title?: string };
  createdAt?: string;
}

export interface MockOrderItem {
  _id?: string;
  title?: string;
  quantity?: number;
  variation?: { price?: number };
}

export interface MockOrder {
  _id: string;
  orderId: string;
  orderAmount: number;
  deliveryCharges?: number;
  taxationAmount?: number;
  orderStatus: OrderStatus;
  paymentMethod?: string;
  orderType: OrderType;
  createdAt: string;
  updatedAt?: string;
  deliveryAddress?: {
    deliveryAddress?: string;
    details?: string;
    label?: string;
  };
  items?: MockOrderItem[];
  restaurant?: { _id?: string; name?: string };
  user?: { _id?: string; name?: string; email?: string };
  rider?: { _id?: string; name?: string } | null;
}

export interface MockStats {
  totalOrders: number;
  totalUsers: number;
  totalRestaurants: number;
  totalRiders: number;
  totalVendors: number;
  deliveredOrders: number;
  totalRevenue: number;
}

export interface MockPaginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MockConfigResponse {
  configuration: {
    currency?: string;
    currencySymbol?: string;
    deliveryRate?: number;
    _id?: string;
    googleApiKey?: string;
  };
}