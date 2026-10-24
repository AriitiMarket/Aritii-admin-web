/** Commerce service facade — centralized API calls for commerce module. */
import { http } from '@/services/client/httpClient';
import type { Category } from '@/types/catalog';

// ── Products ──

export interface CommerceProduct {
  id: string;
  name: string;
  description?: string;
  category?: string;
  originalPrice?: number;
  discountPrice?: number;
  stock?: number;
  reserved?: number;
  shopId?: string;
  shopName?: string;
  sellerId?: string;
  sellerName?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isActive?: boolean;
  publishedAt?: string;
  updatedAt?: string;
  currency?: string;
  images?: (string | { url?: string })[];
  ratings?: number;
  sold_out?: number;
  createdAt?: string;
  shop?: { name?: string; ownerId?: string; email?: string };
  // Ownership — resolved server-side so rows read as Shop / Business / Seller
  // rather than routed through raw ids.
  businessId?: string | null;
  businessName?: string | null;
  sellerEmail?: string | null;
}

export interface PaginatedProducts {
  items: CommerceProduct[];
  total: number;
  totalPages: number;
}

// ── Categories ──

export interface CategoryCreateInput {
  title: string;
  description?: string;
  type: 'product' | 'business' | 'shop' | 'event';
  sortOrder?: number;
}

// ── Orders ──

export interface AdminOrderRow {
  id: string;
  /** Buyer of the order — the buy-side actor on the commerce order. */
  buyerId?: string | null;
  customerRef?: string | null;
  sellerId?: string | null;
  totalPrice?: number;
  items?: number;
  status?: string;
  paymentStatus?: string;
  stage?: string;
  stageLabel?: string;
  stageReason?: string;
  deliveryStatus?: string | null;
  shippingAddress?: unknown;
  destination?: {
    regionId?: string;
    cityId?: string;
    areaId?: string;
    sectorId?: string;
    fullAddress?: string;
    landmark?: string;
    building?: string;
    phone?: string;
    additionalInstructions?: string;
    coordinates?: { lat?: number; lng?: number };
  };
  sellerShipments?: Array<{
    sellerId?: string;
    businessId?: string;
    shopId?: string;
    shopName?: string | null;
    businessName?: string | null;
    items?: Array<{ productId?: string; name?: string; qty?: number; price?: number }>;
    subtotal?: number;
    origin?: {
      regionId?: string;
      cityId?: string;
      areaId?: string;
      sectorId?: string;
      fullAddress?: string;
      landmark?: string;
      building?: string;
      phone?: string;
      coordinates?: { lat?: number; lng?: number };
    };
  }>;
  createdAt?: string;
  updatedAt?: string;
  // Ownership — resolved server-side, displayed in the console rather than ids.
  user?: { name?: string | null; email?: string | null } | null;
  buyerName?: string | null;
  buyerEmail?: string | null;
  sellerName?: string | null;
  sellerEmail?: string | null;
  shopId?: string | null;
  shopName?: string | null;
  businessId?: string | null;
  businessName?: string | null;
}

export interface PaginatedOrders {
  items: AdminOrderRow[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
  stageCounts?: Record<string, number>;
}

// ── Payments ──

export interface PaymentRecord {
  id: string;
  _id?: string;
  orderId: string;
  userId?: string;
  sellerId?: string;
  buyerName?: string;
  sellerName?: string;
  paymentMethod?: string;
  amount: number;
  currency?: string;
  status: 'PENDING' | 'SETTLING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  transactionId?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  completedAt?: string;
}

export interface PaymentMethodRecord {
  id: string;
  /** Method key, e.g. TELEBIRR — submitted by the admin create/edit form. */
  key?: string;
  providerKey: string;
  providerName?: string;
  name: string;
  type: string;
  availability: string;
  currencies: string[];
  limits?: { min?: number; max?: number };
  fees?: { fixed?: number; percentage?: number };
  status: 'ACTIVE' | 'INACTIVE';
  configured: boolean;
  description?: string;
  availableFor?: string[];
  supportedTransactionTypes?: string[];
  currency?: string;
  minAmount?: number;
  maxAmount?: number;
  fixedFee?: number;
  percentageFee?: number;
  processingFee?: number;
  verificationRequired?: boolean;
  settlementSettings?: Record<string, unknown>;
  createdAt?: string;
  sortOrder?: number;
}

export interface SellerPaymentAccount {
  id: string;
  sellerId: string;
  sellerName?: string;
  methodId: string;
  methodName: string;
  provider?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
  isDefault: boolean;
  accountLabel?: string;
  accountHint?: string;
  createdAt?: string;
}

export interface ReconciliationRow {
  paymentId: string;
  orderId: string;
  sellerId?: string;
  paymentMethod?: string;
  expectedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  refunds: number;
  reconciliationStatus: 'MATCHED' | 'PENDING' | 'DIFFERENCE' | 'RESOLVED';
}

export interface PaginatedPayments {
  items: PaymentRecord[];
  total: number;
  totalPages: number;
}

// ── Seller Allocations ──
export interface SellerAllocationRecord {
  id: string;
  _id?: string;
  orderId: string;
  orderGroupId?: string | null;
  sellerId: string;
  shopId?: string | null;
  grossSubtotal: number;
  shippingFee: number;
  taxAmount: number;
  discountAmount: number;
  platformCommission: number;
  netPayable: number;
  refundAmount: number;
  adjustmentAmount: number;
  settledAmount: number;
  pendingAmount: number;
  currency: string;
  status: 'PENDING' | 'PARTIALLY_SETTLED' | 'SETTLED' | 'REFUNDED';
  computationSource?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedSellerAllocations {
  items: SellerAllocationRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Coupons / Promotions ──

export interface CouponRecord {
  id: string;
  _id?: string;
  name: string;
  value: number;
  minAmount?: number;
  maxAmount?: number;
  shopId?: string;
  shopName?: string;
  selectedProduct?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  usageCount?: number;
  maxUsage?: number;
  createdAt?: string;
}

// ── Commerce Overview Stats ──

export interface CommerceOverviewStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  inTransitOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  totalPayments: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
  refundedPayments: number;
  totalProducts: number;
  activeProducts: number;
  totalCategories: number;
  totalShops: number;
  activeShops: number;
}

// ── API Methods ──

export const commerceService = {
  // ── Overview Stats ──
  async getOverviewStats(): Promise<CommerceOverviewStats> {
    const [ordersRes, paymentsRes, productsRes, shopsRes, categoriesRes, activeProductsRes] = await Promise.allSettled([
      http.get<{ success: boolean; orders?: AdminOrderRow[]; total?: number; stageCounts?: Record<string, number> }>(
        '/admin/orders',
        { params: { limit: 1 } }
      ),
      http.get<{ success: boolean; payments?: PaymentRecord[]; total?: number }>(
        '/payment/get-all-payments',
        { params: { limit: 1 } }
      ),
      http.get<{ success: boolean; products?: any[]; total?: number }>(
        '/product/get-all-products',
        { params: { limit: 1, includeInactive: 'true' } }
      ),
      http.get<{ success: boolean; shops?: any[]; total?: number }>(
        '/shop/admin/shops',
        { params: { limit: 1 } }
      ),
      http.get<{ success: boolean; categories?: Category[] }>(
        '/category'
      ),
      // Active = passes the admin kill-switch (server-side status filter).
      http.get<{ success: boolean; products?: any[]; total?: number }>(
        '/product/get-all-products',
        { params: { limit: 1, includeInactive: 'true', status: 'ACTIVE' } }
      ),
    ]);

    const orders = ordersRes.status === 'fulfilled' ? ordersRes.value : { total: 0, stageCounts: {} as Record<string, number> };
    const payments = paymentsRes.status === 'fulfilled' ? paymentsRes.value : { total: 0, payments: [] as PaymentRecord[] };
    const products = productsRes.status === 'fulfilled' ? productsRes.value : { total: 0 };
    const activeProducts = activeProductsRes.status === 'fulfilled' ? activeProductsRes.value : { total: 0 };
    const shops = shopsRes.status === 'fulfilled' ? shopsRes.value : { total: 0 };
    const categories = categoriesRes.status === 'fulfilled' ? categoriesRes.value : { categories: [] };

    const stageCounts: Record<string, number> = orders.stageCounts || {};

    // Get payment status breakdown
    let pendingPayments = 0;
    let completedPayments = 0;
    let failedPayments = 0;
    let refundedPayments = 0;
    let totalRevenue = 0;

    const paymentList = payments.payments || [];
    if (paymentList.length > 0) {
      for (const p of paymentList) {
        if (p.status === 'COMPLETED') {
          completedPayments++;
          totalRevenue += p.amount || 0;
        } else if (p.status === 'PENDING') pendingPayments++;
        else if (p.status === 'FAILED') failedPayments++;
        else if (p.status === 'REFUNDED') refundedPayments++;
      }
    }

    return {
      totalOrders: orders.total || 0,
      pendingOrders: stageCounts['new'] || stageCounts['Processing'] || 0,
      processingOrders: stageCounts['Processing'] || 0,
      confirmedOrders: stageCounts['Confirmed'] || 0,
      shippedOrders: stageCounts['Shipped'] || 0,
      inTransitOrders: stageCounts['In Transit'] || 0,
      deliveredOrders: stageCounts['Delivered'] || stageCounts['delivered'] || 0,
      cancelledOrders: stageCounts['Cancelled'] || 0,
      totalRevenue,
      totalPayments: payments.total || 0,
      completedPayments,
      pendingPayments,
      failedPayments,
      refundedPayments,
      totalProducts: products.total || 0,
      activeProducts: activeProducts.total || 0,
      totalCategories: categories.categories?.length || 0,
      totalShops: shops.total || 0,
      activeShops: shops.total || 0,
    };
  },

  async getRecentOrders(limit = 5): Promise<AdminOrderRow[]> {
    const res = await http.get<{ success: boolean; orders?: AdminOrderRow[] }>(
      '/admin/orders',
      { params: { limit, page: 1 } }
    );
    return res.orders || [];
  },

  async getRecentPayments(limit = 5): Promise<PaymentRecord[]> {
    const res = await http.get<{ success: boolean; payments?: PaymentRecord[] }>(
      '/payment/get-all-payments',
      { params: { limit, page: 1 } }
    );
    return res.payments || [];
  },

  // ── Products ──
  async listProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    stockFilter?: string;
    shopId?: string;
    category?: string;
    businessId?: string;
    ownerId?: string;
    priceMin?: number;
    priceMax?: number;
    dateFrom?: string;
    includeInactive?: boolean;
  }): Promise<PaginatedProducts> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.stockFilter && params.stockFilter !== 'all') query.set('stockFilter', params.stockFilter);
    if (params.shopId) query.set('shopId', params.shopId);
    if (params.businessId) query.set('businessId', params.businessId);
    if (params.ownerId) query.set('ownerId', params.ownerId);
    if (params.category) query.set('category', params.category);
    if (params.priceMin) query.set('priceMin', String(params.priceMin));
    if (params.priceMax) query.set('priceMax', String(params.priceMax));
    if (params.dateFrom) query.set('dateFrom', params.dateFrom);
    if (params.includeInactive) query.set('includeInactive', 'true');

    const res = await http.get<{ items?: any[]; products?: any[]; total?: number; totalPages?: number }>(
      `/product/get-all-products?${query}`
    );
    const items = (res.items || res.products || []).map((p: any) => ({
      ...p,
      id: p._id || p.id,
    }));
    return {
      items,
      total: res.total || 0,
      totalPages: res.totalPages || 1,
    };
  },

  async getProduct(id: string): Promise<CommerceProduct | null> {
    try {
      const res = await http.get<{ success: boolean; product: any }>(`/product/get-product/${id}`);
      return res.product ? { ...res.product, id: res.product._id || res.product.id } : null;
    } catch {
      return null;
    }
  },

  /**
   * Admin activate/deactivate — the admin's ONLY product control.
   *
   * Uses the dedicated bulk endpoint: the generic PUT /update-product path
   * whitelists editable fields and silently DROPPED `isActive`, so this call
   * used to be a no-op that reported success.
   */
  async updateProductStatus(id: string, isActive: boolean): Promise<boolean> {
    try {
      await http.post<{ success: boolean }>('/product/bulk', {
        productIds: [id],
        action: isActive ? 'activate' : 'deactivate',
      });
      return true;
    } catch {
      return false;
    }
  },

  // ── Categories ──
  async listCategories(type?: string): Promise<Category[]> {
    const query = type ? `?type=${type}` : '';
    const res = await http.get<{ success: boolean; categories: any[] }>(`/category${query}`);
    return (res.categories || []).map((c: any) => ({
      ...c,
      id: c._id || c.id,
    }));
  },

  async createCategory(data: CategoryCreateInput): Promise<Category | null> {
    try {
      const res = await http.post<{ success: boolean; category: any }>('/category', data as unknown as Record<string, unknown>);
      return res.category ? { ...res.category, id: res.category._id || res.category.id } : null;
    } catch {
      return null;
    }
  },

  async updateCategory(id: string, data: Partial<CategoryCreateInput>): Promise<Category | null> {
    try {
      const res = await http.put<{ success: boolean; category: any }>(`/category/${id}`, data as unknown as Record<string, unknown>);
      return res.category ? { ...res.category, id: res.category._id || res.category.id } : null;
    } catch {
      return null;
    }
  },

  async toggleCategoryStatus(id: string): Promise<Category | null> {
    try {
      const res = await http.patch<{ success: boolean; category: any }>(`/category/${id}/status`);
      return res.category ? { ...res.category, id: res.category._id || res.category.id } : null;
    } catch {
      return null;
    }
  },

  async deleteCategory(id: string): Promise<boolean> {
    try {
      await http.delete(`/category/${id}`);
      return true;
    } catch {
      return false;
    }
  },

  // ── Orders ──
  async listOrders(params: {
    page?: number;
    limit?: number;
    status?: string;
    stage?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    sellerId?: string;
    shopId?: string;
    businessId?: string;
  }): Promise<PaginatedOrders> {
    const query: Record<string, string | number> = {
      page: params.page || 1,
      limit: params.limit || 20,
    };
    if (params.status) query.status = params.status;
    if (params.stage) query.stage = params.stage;
    if (params.paymentStatus) query.paymentStatus = params.paymentStatus;
    if (params.startDate) query.from = params.startDate;
    if (params.endDate) query.to = params.endDate;
    // The search box was a controlled input that never reached the API — an
    // admin typing an order id or buyer email got the unfiltered list.
    if (params.search) query.search = params.search;
    if (params.sellerId) query.sellerId = params.sellerId;
    if (params.shopId) query.shopId = params.shopId;
    if (params.businessId) query.businessId = params.businessId;

    const res = await http.get<{
      success: boolean;
      orders?: AdminOrderRow[];
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
      stageCounts?: Record<string, number>;
    }>('/admin/orders', { params: query });

    return {
      items: (res.orders || []).map(o => ({ ...o, id: (o as any)._id || o.id })),
      total: res.total || 0,
      page: res.page || params.page || 1,
      limit: res.limit || params.limit || 20,
      totalPages: res.totalPages || 1,
      stageCounts: res.stageCounts,
    };
  },

  async getOrder(orderId: string): Promise<AdminOrderRow | null> {
    try {
      const res = await http.get<{ success: boolean; lifecycle: any }>(
        `/admin/orders/${orderId}/pickup-delivery`
      );
      return res.lifecycle?.order || null;
    } catch {
      return null;
    }
  },

  async getOrderLifecycle(orderId: string): Promise<any> {
    try {
      const res = await http.get<{ success: boolean; lifecycle: any }>(
        `/admin/orders/${orderId}/pickup-delivery`
      );
      return res.lifecycle || {};
    } catch {
      return {};
    }
  },

  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    try {
      await http.put(`/order/admin/${orderId}/status`, { status });
      return true;
    } catch {
      return false;
    }
  },

  // ── Payments ──
  async listPayments(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    paymentMethod?: string;
  }): Promise<PaginatedPayments> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.paymentMethod) query.set('paymentMethod', params.paymentMethod);

    const res = await http.get<{ payments?: any[]; total?: number; totalPages?: number }>(
      `/payment/get-all-payments?${query}`
    );
    return {
      items: (res.payments || []).map((p: any) => ({
        ...p,
        id: p._id || p.id,
      })),
      total: res.total || 0,
      totalPages: res.totalPages || 1,
    };
  },

  async getPayment(id: string): Promise<PaymentRecord | null> {
    try {
      const res = await http.get<{ success: boolean; payment: any }>(`/payment/get-payment/${id}`);
      return res.payment ? { ...res.payment, id: res.payment._id || res.payment.id } : null;
    } catch {
      return null;
    }
  },

  async listPaymentMethods(): Promise<PaymentMethodRecord[]> {
    const res = await http.get<{ methods?: PaymentMethodRecord[] }>('/payment/admin/methods');
    return res.methods || [];
  },
  async listActivePaymentMethods(): Promise<PaymentMethodRecord[]> {
    const res = await http.get<{ methods?: PaymentMethodRecord[] }>('/payment/get-active-methods');
    return res.methods || [];
  },
  async savePaymentMethod(input: Partial<PaymentMethodRecord> & { id?: string; configured?: boolean }): Promise<PaymentMethodRecord | null> {
    const { id, ...body } = input;
    const res = id
      ? await http.put<{ method: PaymentMethodRecord }>(`/payment/admin/methods/${id}`, body)
      : await http.post<{ method: PaymentMethodRecord }>('/payment/admin/methods', body);
    return res.method || null;
  },
  async testConnection(methodId: string): Promise<{ success: boolean; message: string; provider?: string; environment?: string }> {
    const res = await http.post<{ result: { success: boolean; message: string; provider?: string; environment?: string } }>(`/payment/admin/methods/${methodId}/test`);
    return res.result || { success: false, message: 'Test connection failed' };
  },
  async listSellerPaymentAccounts(): Promise<SellerPaymentAccount[]> {
    const res = await http.get<{ accounts?: SellerPaymentAccount[] }>('/payment/admin/seller-accounts');
    return res.accounts || [];
  },
  async getReconciliation(): Promise<ReconciliationRow[]> {
    const res = await http.get<{ rows?: ReconciliationRow[] }>('/payment/admin/reconciliation');
    return res.rows || [];
  },

  // ── Seller Allocations ──
  async listSellerAllocations(sellerId: string, params?: { status?: string; orderId?: string; page?: number; limit?: number }): Promise<PaginatedSellerAllocations> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.orderId) query.set('orderId', params.orderId);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const res = await http.get<{ allocations?: SellerAllocationRecord[]; total?: number; page?: number; limit?: number; totalPages?: number }>(
      `/payment/seller-allocations/${sellerId}?${query}`
    );
    return {
      items: (res.allocations || []).map((a) => ({ ...a, id: String(a._id || a.id) })),
      total: res.total || 0,
      page: res.page || 1,
      limit: res.limit || 50,
      totalPages: res.totalPages || 1,
    };
  },
  async listAdminAllocations(params?: { sellerId?: string; orderId?: string; orderGroupId?: string; status?: string; search?: string; from?: string; to?: string; page?: number; limit?: number }): Promise<PaginatedSellerAllocations> {
    const query = new URLSearchParams();
    if (params?.sellerId) query.set('sellerId', params.sellerId);
    if (params?.orderId) query.set('orderId', params.orderId);
    if (params?.orderGroupId) query.set('orderGroupId', params.orderGroupId);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const res = await http.get<{ allocations?: SellerAllocationRecord[]; total?: number; page?: number; limit?: number; totalPages?: number }>(
      `/payment/admin/allocations?${query}`
    );
    return {
      items: (res.allocations || []).map((a) => ({ ...a, id: String(a._id || a.id) })),
      total: res.total || 0,
      page: res.page || 1,
      limit: res.limit || 50,
      totalPages: res.totalPages || 1,
    };
  },
  async settleAllocation(allocationId: string, data: { amount: number; reference?: string; provider?: string; reason?: string }): Promise<{ allocation: SellerAllocationRecord }> {
    const res = await http.post<{ allocation: SellerAllocationRecord }>(`/payment/admin/settlements/${allocationId}`, data);
    return { allocation: { ...res.allocation, id: res.allocation._id || res.allocation.id } };
  },
  async refundAllocation(allocationId: string, data: { amount: number; reason?: string }): Promise<{ allocation: SellerAllocationRecord }> {
    const res = await http.post<{ allocation: SellerAllocationRecord }>(`/payment/admin/allocations/${allocationId}/refund`, data);
    return { allocation: { ...res.allocation, id: res.allocation._id || res.allocation.id } };
  },

  // ── Coupons / Promotions ──
  async listCoupons(params: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ items: CouponRecord[]; total: number }> {
    try {
      const res = await http.get<{ promotions?: any[]; count?: number; total?: number }>(
        '/promotion/get-all-promotions'
      );
      const rawList = res.promotions || [];
      const filtered = params.search
        ? rawList.filter((p: any) =>
            String(p.name || p.title || p.code || '')
              .toLowerCase()
              .includes(params.search!.toLowerCase())
          )
        : rawList;

      const items: CouponRecord[] = filtered.map((c: any) => ({
        id: c._id || c.id || String(Math.random()),
        name: c.name || c.title || c.code || 'Promotion',
        value: Number(c.discountValue || c.value || c.discount || 0),
        minAmount: c.minOrderAmount || c.minAmount,
        maxAmount: c.maxDiscountAmount || c.maxAmount,
        shopId: c.shopId || c.shop,
        shopName: c.shopName,
        selectedProduct: c.selectedProduct,
        status: c.status || (c.isActive ? 'ACTIVE' : 'INACTIVE'),
        startDate: c.startDate || c.validFrom,
        endDate: c.endDate || c.validUntil,
        usageCount: c.usageCount || c.usedCount || 0,
        maxUsage: c.maxUsage || c.usageLimit,
        createdAt: c.createdAt,
      }));

      return {
        items,
        total: res.total ?? items.length,
      };
    } catch {
      return { items: [], total: 0 };
    }
  },
};
