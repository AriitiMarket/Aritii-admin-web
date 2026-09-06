// API Types for Admin Dashboard

export interface LoginRequest {
  email: string;
  password: string;
  type?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  [key: string]: unknown;
}

export interface EmailExistsRequest {
  email: string;
}

export interface PhoneExistsRequest {
  phone: string;
}

export interface SendOtpEmailRequest {
  email: string;
}

export interface SendOtpPhoneRequest {
  phone: string;
}

export interface VerifyOtpRequest {
  otp: string;
  email?: string;
  phone?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  password: string;
  email: string;
  token: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  [key: string]: unknown;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
}

export interface UserListParams extends PaginationParams {}

export interface VendorListParams extends PaginationParams {}

export interface RiderListParams extends PaginationParams {}

export interface OrderListParams extends PaginationParams {
  status?: string;
}

export interface ZoneListParams extends PaginationParams {}

export interface CouponListParams extends PaginationParams {}

export interface BannerListParams extends PaginationParams {}

export interface CuisineListParams extends PaginationParams {
  search?: string;
  shopType?: string;
}

export interface NotificationListParams extends PaginationParams {
  search?: string;
}

export interface WithdrawRequestParams {
  pageSize: number;
  pageNo: number;
  userType?: string;
  search?: string;
}

export interface ActiveOrderParams {
  page: number;
  rowsPerPage: number;
  search?: string;
  actions?: string[];
  restaurantId?: string;
}

export interface OrderPaginatedParams {
  page: number;
  rows: number;
  dateKeyword?: string;
  starting_date?: string;
  ending_date?: string;
  orderStatus?: string[];
  search?: string;
}

export interface TransactionHistoryParams {
  pageSize: number;
  pageNo: number;
  startingDate?: string;
  endingDate?: string;
  userType?: string;
  search?: string;
}

export interface CreateRestaurantParams {
  owner: string;
  restaurantData: Record<string, unknown>;
}

export interface DuplicateRestaurantParams {
  id: string;
  owner: string;
}

export interface UpdateRestaurantDeliveryParams {
  restaurantId: string;
  minDeliveryFee: number;
  deliveryDistance: number;
  deliveryFee: number;
}

export interface RestaurantProfileParams {
  restaurantId: string;
}

export interface UpdateTimingsParams {
  restaurantId: string;
  openingTimes: Record<string, unknown>;
}

export interface EarningsParams {
  pageSize: number;
  pageNo: number;
  startingDate?: string;
  endingDate?: string;
  search?: string;
  userType?: string;
  userId?: string;
  orderType?: string;
  paymentMethod?: string;
}

export interface UsersPaginatedParams {
  page: number;
  limit: number;
  search?: string;
  registrationMethod?: string;
  status?: string;
}

export interface CurrencyConfigParams {
  currency: string;
  currencySymbol: string;
}

export interface DeliveryRateConfigParams {
  deliveryRate: number;
  costType: string;
}

export interface AmplitudeConfigParams {
  webAmplitudeApiKey: string;
  appAmplitudeApiKey: string;
}

export interface StripeConfigParams {
  publishableKey: string;
  secretKey?: string;
}

export interface CloudinaryConfigParams {
  cloudinaryUploadUrl: string;
  cloudinaryApiKey: string;
}

export interface FirebaseConfigParams {
  firebaseKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  msgSenderId: string;
  appId: string;
  measurementId: string;
  vapidKey: string;
}

export interface GoogleApiKeyConfigParams {
  googleMapsApiKey: string;
}

export interface GoogleClientIdConfigParams {
  webClientID: string;
  androidClientID: string;
  iOSClientID: string;
  expoClientID: string;
}

export interface EmailConfigParams {
  email: string;
  emailName: string;
  enableEmail: boolean;
  password?: string;
}

export interface PaypalConfigParams {
  clientId: string;
  sandbox: boolean;
  clientSecret?: string;
}

export interface SentryConfigParams {
  dashboardSentryUrl: string;
  webSentryUrl: string;
  apiSentryUrl: string;
  customerAppSentryUrl: string;
  restaurantAppSentryUrl: string;
  riderAppSentryUrl: string;
}

export interface TwilioConfigParams {
  twilioAccountSid: string;
  twilioPhoneNumber: string;
  twilioEnabled: boolean;
  twilioWhatsAppNumber: string;
  twilioAuthToken?: string;
}

export interface VerificationConfigParams {
  skipEmailVerification: boolean;
  skipMobileVerification: boolean;
  skipWhatsAppOTP: boolean;
}

export interface VersionsParams {
  customerAppVersion: unknown;
  riderAppVersion: unknown;
  restaurantAppVersion: unknown;
}

export interface CreateVendorParams {
  [key: string]: unknown;
}

export interface EditVendorParams {
  [key: string]: unknown;
}

export interface CreateStaffParams {
  [key: string]: unknown;
}

export interface EditStaffParams {
  [key: string]: unknown;
}

export interface GetVendorByIdParams {
  id: string;
}

export interface GetVendorsParams {}

export interface GetStoreRiderParams {}

export interface CreateCouponParams {
  [key: string]: unknown;
}

export interface UpdateCouponParams {
  couponId: string;
  couponData: Record<string, unknown>;
}

export interface CreateBannerParams {
  [key: string]: unknown;
}

export interface UpdateBannerParams {
  bannerId: string;
  bannerData: Record<string, unknown>;
}

export interface CreateCuisineParams {
  [key: string]: unknown;
}

export interface UpdateCuisineParams {
  cuisineId: string;
  cuisineData: Record<string, unknown>;
}

export interface CreateShopTypeParams {
  [key: string]: unknown;
}

export interface UpdateShopTypeParams {
  shopTypeId: string;
  shopTypeData: Record<string, unknown>;
}

export interface SendNotificationParams {
  [key: string]: unknown;
}

export interface CreateTippingParams {
  [key: string]: unknown;
}

export interface UpdateTippingParams {
  tippingId: string;
  tippingData: Record<string, unknown>;
}

export interface UpdateWithdrawRequestParams {
  withdrawRequestId: string;
  status: string;
}

export interface TicketUsersParams extends PaginationParams {}

export interface UserSupportTicketsParams {
  userId: string;
  page: number;
  limit: number;
}

export interface TicketMessagesParams {
  ticketId: string;
  page: number;
  limit: number;
}

export interface CreateTicketMessageParams {
  content: string;
  ticketId: string;
}

export interface UpdateTicketStatusParams {
  ticketId: string;
  status: string;
}

export interface CreateZoneParams {
  [key: string]: unknown;
}

export interface UpdateZoneParams {
  zoneId: string;
  zoneData: Record<string, unknown>;
}

export interface DeleteZoneParams {
  zoneId: string;
}

export interface GetAllRestaurantsParams {}

export interface GetAllStaffsPaginatedParams extends PaginationParams {}

export interface DeleteStaffParams {
  staffId: string;
}

export type ApiResponse<T> = {
  data: T;
  message?: string;
  success: boolean;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};