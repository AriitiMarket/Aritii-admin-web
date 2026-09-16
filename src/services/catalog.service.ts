/** Catalog service facade (categories, sectors, reviews, disputes). */
import type { Category, Dispute, Review, Sector } from '@/types';
import { commerceAdmin } from '@/api/admin';
import { http } from '@/services/client/httpClient';

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
    return commerceAdmin.approveReview(id);
  },
  async rejectReview(id: string): Promise<Review> {
    return commerceAdmin.rejectReview(id);
  },
  async listDisputes(): Promise<Dispute[]> {
    const res = await http.get<{ success: boolean; disputes?: Dispute[] }>('/disputes');
    return (res.disputes || []).map(d => ({ ...d, id: d.id || (d as any)._id }));
  },
  async updateDisputeStatus(id: string, status: Dispute['status']): Promise<Dispute> {
    const res = await http.patch<{ success: boolean; dispute: Dispute }>(
      `/disputes/${id}/status`,
      { status }
    );
    return { ...res.dispute, id: res.dispute.id || (res.dispute as any)._id };
  },
};
