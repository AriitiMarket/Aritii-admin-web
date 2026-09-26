/** Businesses/Seller Applications service facade. */
import type { PaginatedResult } from '@/types';
import { commerceAdmin } from '@/api/admin';

export interface SellerApplication {
  id: string;
  ownerId: string;
  ownerName?: string | null;
  ownerEmail?: string | null;
  owner?: { id: string; name?: string | null; email?: string | null } | null;
  sellerType?: 'INDIVIDUAL' | 'BUSINESS' | 'SHOP' | 'ORGANIZATION';
  // Business information
  businessInformation?: {
    businessName?: string;
    businessCategory?: string;
    description?: string;
    phone?: string;
    email?: string;
  };
  businessName?: string;
  businessCategory?: string;
  // Location with hierarchy
  location?: {
    country?: string;
    region?: string;
    city?: string;
    address?: string;
    regionId?: string;
    regionName?: string;
    cityId?: string;
    cityName?: string;
    areaId?: string;
    areaName?: string;
    sectorId?: string;
    sectorName?: string;
    deliveryZoneId?: string;
    deliveryZoneName?: string;
    landmark?: string;
    specificPlace?: string;
    latitude?: number;
    longitude?: number;
  };
  // Shop information
  shopInformation?: {
    shopName?: string;
    description?: string;
    category?: string;
    logo?: { public_id?: string; url?: string };
    coverImage?: { public_id?: string; url?: string };
    publicPhone?: string;
    publicEmail?: string;
  };
  shopName?: string;
  shopId?: string;
  status:
    | 'DRAFT'
    | 'PENDING_REVIEW'
    | 'MORE_INFORMATION_REQUIRED'
    | 'APPROVED'
    | 'REJECTED'
    | 'SUSPENDED';
  submittedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  verificationScore?: number;
  riskFlags?: string[];
  timeline?: Array<{
    status: string;
    changedBy?: string;
    changedAt?: string;
    reason?: string;
  }>;
  review?: {
    reviewedBy?: string;
    reviewedByName?: string | null;
    reviewedByEmail?: string | null;
    reviewedAt?: string;
    rejectionReason?: string;
  };
  // Linked shop after approval (hydrated server-side)
  shop?: {
    id?: string;
    name?: string;
    status?: string;
    productCount?: number;
    locationSnapshot?: {
      regionName?: string;
      cityName?: string;
      sectorName?: string;
      fullAddress?: string;
    };
  } | null;
  // Number of shops owned by this business
  shopCount?: number;
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

  async approveApplication(id: string): Promise<SellerApplication | null> {
    return commerceAdmin.approveSellerApplication(id);
  },

  async rejectApplication(id: string, reason: string): Promise<SellerApplication | null> {
    return commerceAdmin.rejectSellerApplication(id, reason);
  },

  async requestInformation(id: string, reason: string): Promise<SellerApplication | null> {
    return commerceAdmin.requestSellerInformation(id, reason);
  },

  async suspendBusiness(id: string): Promise<SellerApplication | null> {
    return commerceAdmin.suspendSellerApplication(id, true);
  },

  async reactivateBusiness(id: string): Promise<SellerApplication | null> {
    return commerceAdmin.suspendSellerApplication(id, false);
  },
};
