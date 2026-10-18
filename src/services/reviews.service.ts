import { httpClient } from './client/httpClient';

export interface Review {
  _id: string;
  productId: string;
  productName: string;
  rating: number;
  comment: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  author: { id: string; name: string };
  createdAt: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
}

export const reviewsService = {
  // Get all pending reviews
  async getPendingReviews(page = 1, limit = 20): Promise<ReviewsResponse> {
    const { data } = await httpClient.get(`/review/admin/pending?page=${page}&limit=${limit}`);
    return data;
  },

  // Get all reviews for a product (admin view)
  async getProductAllReviews(productId: string, page = 1, limit = 20): Promise<ReviewsResponse> {
    const { data } = await httpClient.get(
      `/review/admin/product/${productId}?page=${page}&limit=${limit}`
    );
    return data;
  },

  // Approve a review
  async approveReview(productId: string, reviewId: string): Promise<Review> {
    const { data } = await httpClient.post(
      `/review/admin/${productId}/${reviewId}/approve`,
      {}
    );
    return data.review;
  },

  // Reject a review
  async rejectReview(productId: string, reviewId: string, reason: string): Promise<Review> {
    const { data } = await httpClient.post(
      `/review/admin/${productId}/${reviewId}/reject`,
      { reason }
    );
    return data.review;
  },
};
