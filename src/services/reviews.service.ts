import { http } from './client/httpClient';

export interface Review {
  _id: string;
  productId: string;
  productName: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  author: { id: string; name: string };
  createdAt: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
}

interface ReviewDto extends Partial<Review> {
  reviewId?: string;
  user?: { _id?: string; id?: string; name?: string; email?: string } | string | null;
}

function normalizeReview(review: ReviewDto): Review {
  const user = review.user;
  const author = review.author || (typeof user === 'string'
    ? { id: '', name: user }
    : { id: String(user?._id || user?.id || ''), name: user?.name || 'Aritii customer' });
  return {
    _id: String(review._id || review.reviewId || ''),
    productId: String(review.productId || ''),
    productName: review.productName || '',
    rating: Number(review.rating) || 0,
    comment: review.comment || '',
    status: String(review.status || 'pending').toLowerCase() as Review['status'],
    author,
    createdAt: review.createdAt || '',
  };
}

export const reviewsService = {
  // Get all pending reviews
  async getPendingReviews(page = 1, limit = 20): Promise<ReviewsResponse> {
    const data = await http.get<ReviewsResponse & { success: boolean }>(
      '/review/admin/pending', { params: { page, limit } }
    );
    return { ...data, reviews: (data.reviews || []).map(normalizeReview) };
  },

  // Get all reviews for a product (admin view)
  async getProductAllReviews(productId: string, page = 1, limit = 20): Promise<ReviewsResponse> {
    const data = await http.get<ReviewsResponse & { success: boolean }>(
      `/review/admin/product/${productId}`, { params: { page, limit } }
    );
    return { ...data, reviews: (data.reviews || []).map(normalizeReview) };
  },

  // Approve a review
  async approveReview(productId: string, reviewId: string): Promise<Review> {
    const data = await http.post<{ review: ReviewDto }>(
      `/review/admin/${productId}/${reviewId}/approve`,
      {}
    );
    return normalizeReview(data.review);
  },

  // Reject a review
  async rejectReview(productId: string, reviewId: string, reason: string): Promise<Review> {
    const data = await http.post<{ review: ReviewDto }>(
      `/review/admin/${productId}/${reviewId}/reject`,
      { reason }
    );
    return normalizeReview(data.review);
  },
};
