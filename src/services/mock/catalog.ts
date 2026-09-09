/**
 * Mock-mode catalog implementation.
 *
 * The bundled REST mock server does not expose category/sector/review/
 * dispute endpoints yet, so this implementation resolves against the
 * EXPLICIT demo generator in ./generators. It is only reachable when
 * VITE_USE_MOCKS=true and is never part of a live data path.
 */
import type { Category, Dispute, Review, Sector } from '@/types';
import { demoData } from './generators';

export async function mockListCategories(): Promise<Category[]> {
  return [...demoData.categories];
}

export async function mockListSectors(): Promise<Sector[]> {
  return [...demoData.sectors];
}

export async function mockListPendingReviews(): Promise<Review[]> {
  return demoData.reviews.filter((review) => review.status === 'PENDING');
}

function mutateReview(id: string, status: Review['status']): Review | null {
  const index = demoData.reviews.findIndex((review) => review.id === id);
  if (index === -1) return null;
  demoData.reviews[index] = {
    ...demoData.reviews[index],
    status,
    isPublished: status === 'APPROVED',
  };
  return demoData.reviews[index];
}

export async function mockApproveReview(id: string): Promise<Review> {
  const updated = mutateReview(id, 'APPROVED');
  if (!updated) throw new Error(`Review ${id} not found`);
  return updated;
}

export async function mockRejectReview(id: string): Promise<Review> {
  const updated = mutateReview(id, 'REJECTED');
  if (!updated) throw new Error(`Review ${id} not found`);
  return updated;
}

export async function mockListDisputes(): Promise<Dispute[]> {
  return [...demoData.disputes];
}

export async function mockUpdateDisputeStatus(
  id: string,
  status: Dispute['status']
): Promise<Dispute> {
  const index = demoData.disputes.findIndex((dispute) => dispute.id === id);
  if (index === -1) throw new Error(`Dispute ${id} not found`);
  demoData.disputes[index] = { ...demoData.disputes[index], status };
  return demoData.disputes[index];
}