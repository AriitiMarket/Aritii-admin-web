/** Catalog domain types: categories, reviews. */
import type { Sector } from '@/types/sector';

export type { Sector };

export type CategoryType = 'product' | 'business' | 'shop' | 'event';
export type CategoryStatus = 'active' | 'inactive';

export interface Category {
  id: string;
  _id?: string;
  title: string;
  slug?: string;
  description?: string;
  type: CategoryType;
  status: CategoryStatus;
  sortOrder?: number;
  /** Document count for this category, added by the backend aggregation. */
  productCount?: number;
  createdAt?: string;
}

export interface Review {
  id: string;
  storeId: string;
  storeName: string;
  orderId?: string;
  rating: number;
  description?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  isPublished: boolean;
  /** Product the review belongs to (product reviews live on the product). */
  productId?: string;
  /** Display name of the reviewer. */
  reviewerName?: string;
}

/** Feedback / dispute records. */
export interface Dispute {
  id: string;
  subject: string;
  description?: string;
  orderId?: string;
  reportedBy: { id?: string; name?: string };
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
}
