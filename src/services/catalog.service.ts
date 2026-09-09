/** Catalog service facade (categories, sectors, reviews, disputes). */
import { isMockMode } from '@/utils/env';
import type { Category, Dispute, Review, Sector } from '@/types';
import {
  mockApproveReview,
  mockListCategories,
  mockListDisputes,
  mockListPendingReviews,
  mockListSectors,
  mockRejectReview,
  mockUpdateDisputeStatus,
} from './mock/catalog';
import {
  realApproveReview,
  realListCategories,
  realListDisputes,
  realListPendingReviews,
  realListSectors,
  realRejectReview,
  realUpdateDisputeStatus,
} from './real/catalog';

export const catalogService = {
  listCategories(): Promise<Category[]> {
    return isMockMode() ? mockListCategories() : realListCategories();
  },
  listSectors(): Promise<Sector[]> {
    return isMockMode() ? mockListSectors() : realListSectors();
  },
  listPendingReviews(): Promise<Review[]> {
    return isMockMode() ? mockListPendingReviews() : realListPendingReviews();
  },
  approveReview(id: string): Promise<Review> {
    return isMockMode() ? mockApproveReview(id) : realApproveReview(id);
  },
  rejectReview(id: string): Promise<Review> {
    return isMockMode() ? mockRejectReview(id) : realRejectReview(id);
  },
  listDisputes(): Promise<Dispute[]> {
    return isMockMode() ? mockListDisputes() : realListDisputes();
  },
  updateDisputeStatus(id: string, status: Dispute['status']): Promise<Dispute> {
    return isMockMode()
      ? mockUpdateDisputeStatus(id, status)
      : realUpdateDisputeStatus(id, status);
  },
};