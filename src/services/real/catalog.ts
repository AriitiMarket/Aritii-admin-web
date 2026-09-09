/**
 * Real catalog service (categories, sectors, reviews, disputes) — Ariiti API Gateway contract.
 * @boundary: these endpoints are the documented integration contracts and
 * are pending gateway/backend implementation.
 */
import { assertGatewayConfigured, http } from '@/services/client/httpClient';
import type { Category, Dispute, Review, Sector } from '@/types';

interface RealListResponse<T> {
  data: { items: T[] };
}

export async function realListCategories(): Promise<Category[]> {
  assertGatewayConfigured();
  const response = await http.get<RealListResponse<Category>>('/categories');
  return response.data.items;
}

export async function realListSectors(): Promise<Sector[]> {
  assertGatewayConfigured();
  const response = await http.get<RealListResponse<Sector>>('/sectors');
  return response.data.items;
}

export async function realListPendingReviews(): Promise<Review[]> {
  assertGatewayConfigured();
  const response = await http.get<RealListResponse<Review>>('/reviews/pending');
  return response.data.items;
}

export async function realApproveReview(id: string): Promise<Review> {
  assertGatewayConfigured();
  const response = await http.post<{ data: { review: Review } }>(
    `/reviews/${id}/approve`
  );
  return response.data.review;
}

export async function realRejectReview(id: string): Promise<Review> {
  assertGatewayConfigured();
  const response = await http.post<{ data: { review: Review } }>(
    `/reviews/${id}/reject`
  );
  return response.data.review;
}

export async function realListDisputes(): Promise<Dispute[]> {
  assertGatewayConfigured();
  const response = await http.get<RealListResponse<Dispute>>('/disputes');
  return response.data.items;
}

export async function realUpdateDisputeStatus(
  id: string,
  status: Dispute['status']
): Promise<Dispute> {
  assertGatewayConfigured();
  const response = await http.patch<{ data: { dispute: Dispute } }>(
    `/disputes/${id}`,
    { status }
  );
  return response.data.dispute;
}