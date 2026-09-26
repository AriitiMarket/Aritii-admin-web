/** Catalog service facade (categories, sectors, reviews, disputes). */
import type { Category, Dispute, Review, Sector } from '@/types';
import { commerceAdmin } from '@/api/admin';
import { http } from '@/services/client/httpClient';

/**
 * Raw dispute payload: Mongo returns `_id`, the UI model uses `id`. Kept as a
 * named type (not `any`) so the id normalisation below is explicit and checked.
 */
interface RawDispute extends Partial<Dispute> {
  _id?: string;
}

export const catalogService = {
  async listCategories(): Promise<Category[]> {
    return commerceAdmin.listCategories();
  },
  async listSectors(): Promise<Sector[]> {
    return commerceAdmin.listSectors();
  },
  async listPendingReviews(): Promise<Review[]> {
    return commerceAdmin.listPendingReviews();
  },
  async approveReview(id: string): Promise<Review> {
    const review = await commerceAdmin.approveReview(id);
    // A successful moderation always echoes the record back; a null here means
    // the response shape changed, so fail loudly rather than fake success.
    if (!review) throw new Error('The API did not return the moderated review');
    return review;
  },
  async rejectReview(id: string, reason: string): Promise<Review> {
    const review = await commerceAdmin.rejectReview(id, reason);
    if (!review) throw new Error('The API did not return the moderated review');
    return review;
  },
  async listDisputes(): Promise<Dispute[]> {
    const res = await http.get<{ success: boolean; disputes?: RawDispute[] }>('/disputes');
    return (res.disputes || []).map((d) => ({
      ...(d as unknown as Dispute),
      id: d.id || d._id || '',
    }));
  },
  async updateDisputeStatus(id: string, status: Dispute['status']): Promise<Dispute> {
    const res = await http.patch<{ success: boolean; dispute: RawDispute }>(
      `/disputes/${id}/status`,
      { status }
    );
    return {
      ...(res.dispute as unknown as Dispute),
      id: res.dispute.id || res.dispute._id || '',
    };
  },
};
