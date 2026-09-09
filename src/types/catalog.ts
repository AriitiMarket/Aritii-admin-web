/** Catalog domain types: categories, reviews. */
import type { Sector } from '@/types/sector';

export type { Sector };

export interface Category {
  id: string;
  title: string;
  image?: string;
  sector: string;
  isActive: boolean;
  createdAt?: string;
  subCategories?: number;
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