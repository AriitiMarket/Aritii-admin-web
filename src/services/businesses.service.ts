/** Businesses/Seller Applications service facade. */
import type { PaginatedResult } from '@/types';
import { commerceAdmin } from '@/api/admin';

export interface SellerApplication {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  businessName: string;
  businessCategory?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
    address?: string;
  };
  shopName?: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  submittedAt?: string;
  createdAt?: string;
  review?: {
    reviewedBy?: string;
    reviewedAt?: string;
    rejectionReason?: string;
  };
  shopId?: string;
}

export const businessesService = {
  async listApplications(filter: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<PaginatedResult<SellerApplication>> {
    return commerceAdmin.listSellerApplications(
      filter.page || 1,
      filter.limit || 10,
      filter.status || '',
      filter.search || ''
    );
  },

  async getApplication(id: string): Promise<SellerApplication> {
    return commerceAdmin.getSellerApplication(id);
  },

  async approveApplication(id: string): Promise<any> {
    return commerceAdmin.approveSellerApplication(id);
  },

  async rejectApplication(
    id: string,
    reason: string
  ): Promise<any> {
    return commerceAdmin.rejectSellerApplication(id, reason);
  },

  async suspendBusiness(id: string): Promise<any> {
    return commerceAdmin.suspendSellerApplication(id, true);
  },

  async reactivateBusiness(id: string): Promise<any> {
    return commerceAdmin.suspendSellerApplication(id, false);
  },
};
