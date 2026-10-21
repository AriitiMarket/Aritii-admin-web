import { http } from '@/services/client/httpClient';

/**
 * Promotion service — platform promotion campaigns.
 *
 * Backing endpoints (commerce-service, mounted at /promotion):
 *   GET    /promotion/get-all-promotions        list promotions
 *   POST   /promotion/create-promotion          create a promotion
 *   PUT    /promotion/update-promotion/:id      update a promotion
 *   DELETE /promotion/delete-promotion/:id      delete a promotion
 *
 * The controllers answer with the resource at the top level of the envelope
 * (`{ success, promotions }` / `{ success, promotion }`).
 */

/** The discount applied by a promotion. */
export interface PromotionDiscount {
  type: string;
  value: number;
}

/** A promotion as rendered by the admin console. */
export interface Promotion {
  _id: string;
  code: string;
  name: string;
  description: string;
  discount: PromotionDiscount;
  minPurchase: number;
  maxUses: number | null;
  usagePerUser: number;
  validFrom: string;
  validUntil: string;
  applicableCategories: string[];
  terms: string;
  totalUsed: number;
}

/** The promotion payload the console submits. */
export type PromotionPayload = {
  name: string;
  code: string;
  description: string;
  discount: PromotionDiscount;
  minPurchase: number;
  maxUses: number | null;
  usagePerUser: number;
  validFrom: string;
  validUntil: string;
  applicableCategories: string[];
  terms: string;
};

const promotionService = {
  /** Every promotion visible to the console. */
  async getAll(): Promise<{ promotions: Promotion[] }> {
    const data = await http.get<{ promotions?: Promotion[] }>(
      '/promotion/get-all-promotions'
    );
    return { promotions: data?.promotions || [] };
  },

  /** Create a promotion. */
  async create(payload: PromotionPayload): Promise<Promotion> {
    const data = await http.post<{ promotion?: Promotion }>(
      '/promotion/create-promotion',
      payload
    );
    return data?.promotion || (payload as Promotion);
  },

  /** Update a promotion. */
  async update(
    promotionId: string,
    payload: PromotionPayload
  ): Promise<Promotion> {
    const data = await http.put<{ promotion?: Promotion }>(
      `/promotion/update-promotion/${promotionId}`,
      payload
    );
    return data?.promotion || (payload as Promotion);
  },

  /** Delete a promotion. */
  async remove(promotionId: string): Promise<void> {
    await http.delete(`/promotion/delete-promotion/${promotionId}`);
  },
};

export default promotionService;
