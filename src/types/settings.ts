/** Platform settings surfaces — matches backend defaults. */
export interface PlatformSettings {
  platformName: string;
  platformDescription: string;
  supportEmail: string;
  supportPhone: string;
  marketplaceActive: boolean;
  registrationOpen: boolean;
  sellerRegistrationOpen: boolean;
  riderRegistrationOpen: boolean;
  commissionRate: number;
  deliveryFee: number;
  minOrderAmount: number;
  maxOrderAmount: number;
  supportedCurrencies: string[];
  defaultCurrency: string;
  taxRate: number;
  sellerPayoutSchedule: string;
  autoApproveShops: boolean;
  autoApproveRiders: boolean;
  maxProductsPerSeller: number;
  maxImagesPerProduct: number;
  orderTimeoutMinutes: number;
  cancellationWindowMinutes: number;
  refundWindowDays: number;
  defaultDeliveryZone: string;
  maxDeliveryDistanceKm: number;
  expressDeliveryMultiplier: number;
  features: {
    wishlistEnabled: boolean;
    reviewsEnabled: boolean;
    chatEnabled: boolean;
    promotionsEnabled: boolean;
    couponsEnabled: boolean;
    subscriptionsEnabled: boolean;
    multiVendorEnabled: boolean;
  };
}

export interface NotificationsSettings {
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  orderCreated: boolean;
  orderDelivered: boolean;
  orderCancelled: boolean;
  riderAssigned: boolean;
  disputeRaised: boolean;
  reviewSubmitted: boolean;
  sellerApproved: boolean;
  sellerRejected: boolean;
  newSellerApplication: boolean;
  lowStockAlert: boolean;
  dailyDigestEnabled: boolean;
  weeklyReportEnabled: boolean;
}

export interface SystemSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  forceUpdateEnabled: boolean;
  apiRateLimitEnabled: boolean;
  maxRequestsPerMinute: number;
  requestTimeoutMs: number;
  maxRetryAttempts: number;
  loggingLevel: string;
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  passwordMinLength: number;
  requireEmailVerification: boolean;
  requirePhoneVerification: boolean;
}
