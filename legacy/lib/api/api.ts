// API Service for Admin Dashboard
// This module consolidates all REST API endpoints

import restClient from './restClient'
import type {
  LoginRequest,
  RegisterRequest,
  EmailExistsRequest,
  PhoneExistsRequest,
  SendOtpEmailRequest,
  SendOtpPhoneRequest,
  VerifyOtpRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdateUserRequest,
  PaginationParams,
  UserListParams,
  VendorListParams,
  RiderListParams,
  OrderListParams,
  CouponListParams,
  BannerListParams,
  CuisineListParams,
  NotificationListParams,
  WithdrawRequestParams,
  ActiveOrderParams,
  OrderPaginatedParams,
  TransactionHistoryParams,
  CreateRestaurantParams,
  DuplicateRestaurantParams,
  UpdateRestaurantDeliveryParams,
  RestaurantProfileParams,
  UpdateTimingsParams,
  EarningsParams,
  UsersPaginatedParams,
  CurrencyConfigParams,
  DeliveryRateConfigParams,
  AmplitudeConfigParams,
  StripeConfigParams,
  CloudinaryConfigParams,
  FirebaseConfigParams,
  GoogleApiKeyConfigParams,
  GoogleClientIdConfigParams,
  EmailConfigParams,
  PaypalConfigParams,
  SentryConfigParams,
  TwilioConfigParams,
  VerificationConfigParams,
  VersionsParams,
  CreateVendorParams,
  EditVendorParams,
  CreateStaffParams,
  EditStaffParams,
  GetVendorsParams,
  GetStoreRiderParams,
  CreateCouponParams,
  UpdateCouponParams,
  CreateBannerParams,
  UpdateBannerParams,
  CreateCuisineParams,
  UpdateCuisineParams,
  CreateShopTypeParams,
  UpdateShopTypeParams,
  SendNotificationParams,
  CreateTippingParams,
  UpdateTippingParams,
  UpdateWithdrawRequestParams,
  TicketUsersParams,
  UserSupportTicketsParams,
  TicketMessagesParams,
  CreateTicketMessageParams,
  UpdateTicketStatusParams,
  CreateZoneParams,
  UpdateZoneParams,
  GetAllRestaurantsParams,
  GetAllStaffsPaginatedParams,
} from './api.types'

// Auth API
export const authAPI = {
  login: async (email: string, password: string, type: string = 'email') => {
    return restClient.post('/auth/login', { email, password, type } as LoginRequest)
  },
  
  register: async (userData: RegisterRequest) => {
    return restClient.post('/auth/register', userData)
  },
  
  emailExists: async (email: string) => {
    return restClient.post('/auth/email-exists', { email } as EmailExistsRequest)
  },
  
  phoneExists: async (phone: string) => {
    return restClient.post('/auth/phone-exists', { phone } as PhoneExistsRequest)
  },
  
  sendOtpToEmail: async (email: string) => {
    return restClient.post('/auth/send-otp-email', { email } as SendOtpEmailRequest)
  },
  
  sendOtpToPhone: async (phone: string) => {
    return restClient.post('/auth/send-otp-phone', { phone } as SendOtpPhoneRequest)
  },
  
  verifyOtp: async (otp: string, email?: string, phone?: string) => {
    return restClient.post('/auth/verify-otp', { otp, email, phone } as VerifyOtpRequest)
  },
  
  forgotPassword: async (email: string) => {
    return restClient.post('/auth/forgot-password', { email } as ForgotPasswordRequest)
  },
  
  resetPassword: async (password: string, email: string, token: string) => {
    return restClient.post('/auth/reset-password', { password, email, token } as ResetPasswordRequest)
  },
  
  updateUser: async (userData: UpdateUserRequest) => {
    return restClient.put('/auth/user', userData)
  }
}

// Admin API
export const adminAPI = {
  getAdminProfile: async () => {
    return restClient.get('/admin/profile')
  },
  
  updateAdminProfile: async (adminData: Record<string, unknown>) => {
    return restClient.put('/admin/profile', adminData)
  },
  
  getAllUsers: async (page: number, limit: number) => {
    return restClient.get('/admin/users', { page, limit } as UserListParams)
  },
  
  getUserById: async (userId: string) => {
    return restClient.get(`/admin/user/${userId}`)
  },
  
  updateUser: async (userId: string, userData: Record<string, unknown>) => {
    return restClient.put(`/admin/user/${userId}`, userData)
  },
  
  deleteUser: async (userId: string) => {
    return restClient.delete(`/admin/user/${userId}`)
  },
  
  getAllVendors: async (page: number, limit: number) => {
    return restClient.get('/admin/vendors', { page, limit } as VendorListParams)
  },
  
  getVendorById: async (vendorId: string) => {
    return restClient.get(`/admin/vendor/${vendorId}`)
  },
  
  updateVendor: async (vendorId: string, vendorData: Record<string, unknown>) => {
    return restClient.put(`/admin/vendor/${vendorId}`, vendorData)
  },
  
  deleteVendor: async (vendorId: string) => {
    return restClient.delete(`/admin/vendor/${vendorId}`)
  },
  
  getAllRiders: async (page: number, limit: number) => {
    return restClient.get('/admin/riders', { page, limit } as RiderListParams)
  },

  getRiderById: async (riderId: string) => {
    return restClient.get(`/admin/rider/${riderId}`)
  },

  createRider: async (riderData: Record<string, unknown>) => {
    return restClient.post('/admin/rider', riderData)
  },

  updateRider: async (riderId: string, riderData: Record<string, unknown>) => {
    return restClient.put(`/admin/rider/${riderId}`, riderData)
  },

  deleteRider: async (riderId: string) => {
    return restClient.delete(`/admin/rider/${riderId}`)
  },
  
  getAllOrders: async (page: number, limit: number, status?: string) => {
    return restClient.get('/admin/orders', { page, limit, status } as OrderListParams)
  },
  
  getOrderById: async (orderId: string) => {
    return restClient.get(`/admin/order/${orderId}`)
  },
  
  getAdminStats: async () => {
    return restClient.get('/admin/stats')
  },

  getAllZones: async () => {
    return restClient.get('/admin/zones')
  },

  getZoneById: async (zoneId: string) => {
    return restClient.get(`/admin/zone/${zoneId}`)
  },

  createZone: async (zoneData: CreateZoneParams) => {
    return restClient.post('/admin/zone', zoneData)
  },

  updateZone: async (zoneId: string, zoneData: UpdateZoneParams) => {
    return restClient.put(`/admin/zone/${zoneId}`, zoneData)
  },

  deleteZone: async (zoneId: string) => {
    return restClient.delete(`/admin/zone/${zoneId}`)
  },

  getAllCoupons: async (page: number, limit: number) => {
    return restClient.get('/admin/coupons', { page, limit } as CouponListParams)
  },

  getCouponById: async (couponId: string) => {
    return restClient.get(`/admin/coupon/${couponId}`)
  },

  createCoupon: async (couponData: CreateCouponParams) => {
    return restClient.post('/admin/coupon', couponData)
  },

  updateCoupon: async (couponId: string, couponData: UpdateCouponParams) => {
    return restClient.put(`/admin/coupon/${couponId}`, couponData)
  },

  deleteCoupon: async (couponId: string) => {
    return restClient.delete(`/admin/coupon/${couponId}`)
  },

  getAllBanners: async (page: number, limit: number) => {
    return restClient.get('/admin/banners', { page, limit } as BannerListParams)
  },

  getBannerById: async (bannerId: string) => {
    return restClient.get(`/admin/banner/${bannerId}`)
  },

  createBanner: async (bannerData: CreateBannerParams) => {
    return restClient.post('/admin/banner', bannerData)
  },

  updateBanner: async (bannerId: string, bannerData: UpdateBannerParams) => {
    return restClient.put(`/admin/banner/${bannerId}`, bannerData)
  },

  deleteBanner: async (bannerId: string) => {
    return restClient.delete(`/admin/banner/${bannerId}`)
  },

  getAllCuisines: async (page: number, limit: number, search?: string, shopType?: string) => {
    return restClient.get('/admin/cuisines', { page, limit, search, shopType } as CuisineListParams)
  },

  getCuisineById: async (cuisineId: string) => {
    return restClient.get(`/admin/cuisine/${cuisineId}`)
  },

  createCuisine: async (cuisineData: CreateCuisineParams) => {
    return restClient.post('/admin/cuisine', cuisineData)
  },

  updateCuisine: async (cuisineId: string, cuisineData: UpdateCuisineParams) => {
    return restClient.put(`/admin/cuisine/${cuisineId}`, cuisineData)
  },

  deleteCuisine: async (cuisineId: string) => {
    return restClient.delete(`/admin/cuisine/${cuisineId}`)
  },

  getAllShopTypes: async () => {
    return restClient.get('/admin/shop-types')
  },

  getShopTypeById: async (shopTypeId: string) => {
    return restClient.get(`/admin/shop-type/${shopTypeId}`)
  },

  createShopType: async (shopTypeData: CreateShopTypeParams) => {
    return restClient.post('/admin/shop-type', shopTypeData)
  },

  updateShopType: async (shopTypeId: string, shopTypeData: UpdateShopTypeParams) => {
    return restClient.put(`/admin/shop-type/${shopTypeId}`, shopTypeData)
  },

  deleteShopType: async (shopTypeId: string) => {
    return restClient.delete(`/admin/shop-type/${shopTypeId}`)
  },

  getAllNotifications: async (page: number, limit: number, search?: string) => {
    return restClient.get('/admin/notifications', { page, limit, search } as NotificationListParams)
  },

  sendNotification: async (notificationData: SendNotificationParams) => {
    return restClient.post('/admin/notification', notificationData)
  },

  getTipping: async () => {
    return restClient.get('/admin/tipping')
  },

  createTipping: async (tippingData: CreateTippingParams) => {
    return restClient.post('/admin/tipping', tippingData)
  },

  updateTipping: async (tippingId: string, tippingData: UpdateTippingParams) => {
    return restClient.put(`/admin/tipping/${tippingId}`, tippingData)
  },

  getAllWithdrawRequests: async (pageSize: number, pageNo: number, userType?: string, search?: string) => {
    return restClient.get('/admin/withdraw-requests', { pageSize, pageNo, userType, search } as WithdrawRequestParams)
  },

  updateWithdrawRequest: async (withdrawRequestId: string, status: string) => {
    return restClient.put(`/admin/withdraw-request/${withdrawRequestId}`, { status } as UpdateWithdrawRequestParams)
  },

  getActiveOrders: async (page: number, rowsPerPage: number, search?: string, actions?: string[], restaurantId?: string) => {
    return restClient.get('/admin/active-orders', { page, rowsPerPage, search, actions, restaurantId } as ActiveOrderParams)
  },

  getDashboardUsers: async () => {
    return restClient.get('/admin/dashboard/users')
  },

  getDashboardUsersByYear: async (year: number) => {
    return restClient.get('/admin/dashboard/users-by-year', { year })
  },

  getAllOrdersPaginated: async (page: number, rows: number, dateKeyword?: string, starting_date?: string, ending_date?: string, orderStatus?: string[], search?: string) => {
    return restClient.get('/admin/orders-paginated', { page, rows, dateKeyword, starting_date, ending_date, orderStatus, search } as OrderPaginatedParams)
  },

  getTransactionHistory: async (pageSize: number, pageNo: number, startingDate?: string, endingDate?: string, userType?: string, search?: string) => {
    return restClient.get('/admin/transaction-history', { pageSize, pageNo, startingDate, endingDate, userType, search } as TransactionHistoryParams)
  },

  createRestaurant: async (owner: string, restaurantData: Record<string, unknown>) => {
    return restClient.post('/admin/restaurant', { owner, restaurant: restaurantData } as CreateRestaurantParams)
  },

  getAllRestaurants: async () => {
    return restClient.get('/admin/restaurants') as GetAllRestaurantsParams
  },

  getAllStaffsPaginated: async (page: number, limit: number, search?: string) => {
    return restClient.get('/admin/staffs-paginated', { page, limit, search } as GetAllStaffsPaginatedParams)
  },

  deleteStaff: async (staffId: string) => {
    return restClient.delete(`/admin/staff/${staffId}`)
  },

  getTicketUsers: async (page: number, limit: number) => {
    return restClient.get('/admin/support/ticket-users', { page, limit } as TicketUsersParams)
  },

  getUserSupportTickets: async (userId: string, page: number, limit: number) => {
    return restClient.get('/admin/support/user-tickets', { userId, page, limit } as UserSupportTicketsParams)
  },

  getTicketMessages: async (ticketId: string, page: number, limit: number) => {
    return restClient.get('/admin/support/ticket-messages', { ticketId, page, limit } as TicketMessagesParams)
  },

  createTicketMessage: async (content: string, ticketId: string) => {
    return restClient.post('/admin/support/ticket-message', { content, ticketId } as CreateTicketMessageParams)
  },

  updateTicketStatus: async (ticketId: string, status: string) => {
    return restClient.put('/admin/support/ticket-status', { ticketId, status } as UpdateTicketStatusParams)
  },

  getDashboardOrdersByType: async () => {
    return restClient.get('/admin/dashboard/orders-by-type')
  },

  getDashboardSalesByType: async () => {
    return restClient.get('/admin/dashboard/sales-by-type')
  },

  createVendor: async (vendorData: CreateVendorParams) => {
    return restClient.post('/admin/vendor', vendorData)
  },

  editVendor: async (vendorData: EditVendorParams) => {
    return restClient.put('/admin/vendor', vendorData)
  },

  duplicateRestaurant: async (id: string, owner: string) => {
    return restClient.post('/admin/restaurant/duplicate', { id, owner } as DuplicateRestaurantParams)
  },

  getVendors: async () => {
    return restClient.get('/admin/vendors') as GetVendorsParams
  },

  getStoreRider: async () => {
    return restClient.get('/admin/store-rider') as GetStoreRiderParams
  },

  updateRestaurantDelivery: async (restaurantId: string, minDeliveryFee: number, deliveryDistance: number, deliveryFee: number) => {
    return restClient.put('/admin/restaurant/delivery', { id: restaurantId, minDeliveryFee, deliveryDistance, deliveryFee } as UpdateRestaurantDeliveryParams)
  },

  getRestaurantProfile: async (restaurantId: string) => {
    return restClient.get('/admin/restaurant/profile', { id: restaurantId } as RestaurantProfileParams)
  },

  updateTimings: async (restaurantId: string, openingTimes: Record<string, unknown>) => {
    return restClient.put('/admin/restaurant/timings', { id: restaurantId, openingTimes } as UpdateTimingsParams)
  },

  createStaff: async (staffData: CreateStaffParams) => {
    return restClient.post('/admin/staff', staffData)
  },

  editStaff: async (staffData: EditStaffParams) => {
    return restClient.put('/admin/staff', staffData)
  },

  getEarnings: async (pageSize: number, pageNo: number, startingDate?: string, endingDate?: string, search?: string, userType?: string, userId?: string, orderType?: string, paymentMethod?: string) => {
    return restClient.get('/admin/earnings', { pageSize, pageNo, startingDate, endingDate, search, userType, userId, orderType, paymentMethod } as EarningsParams)
  },

  getUsersPaginated: async (page: number, limit: number, search?: string, registrationMethod?: string, status?: string) => {
    return restClient.get('/admin/users-paginated', { page, limit, search, registrationMethod, status } as UsersPaginatedParams)
  },

  saveCurrencyConfiguration: async (currency: string, currencySymbol: string) => {
    return restClient.post('/admin/configuration/currency', { currency, currencySymbol } as CurrencyConfigParams)
  },

  saveDeliveryRateConfiguration: async (deliveryRate: number, costType: string) => {
    return restClient.post('/admin/configuration/delivery-rate', { deliveryRate, costType } as DeliveryRateConfigParams)
  },

  saveAmplitudeConfiguration: async (webAmplitudeApiKey: string, appAmplitudeApiKey: string) => {
    return restClient.post('/admin/configuration/amplitude', { webAmplitudeApiKey, appAmplitudeApiKey } as AmplitudeConfigParams)
  },

  saveStripeConfiguration: async (publishableKey: string, secretKey?: string) => {
    return restClient.post('/admin/configuration/stripe', { publishableKey, ...(secretKey ? { secretKey } : {}) } as StripeConfigParams)
  },

  getVersions: async () => {
    return restClient.get('/admin/configuration/versions')
  },

  setVersions: async (customerAppVersion: unknown, riderAppVersion: unknown, restaurantAppVersion: unknown) => {
    return restClient.post('/admin/configuration/versions', { customerAppVersion, riderAppVersion, restaurantAppVersion } as VersionsParams)
  },

  saveCloudinaryConfiguration: async (cloudinaryUploadUrl: string, cloudinaryApiKey: string) => {
    return restClient.post('/admin/configuration/cloudinary', { cloudinaryUploadUrl, cloudinaryApiKey } as CloudinaryConfigParams)
  },

  saveFirebaseConfiguration: async (firebaseKey: string, authDomain: string, projectId: string, storageBucket: string, msgSenderId: string, appId: string, measurementId: string, vapidKey: string) => {
    return restClient.post('/admin/configuration/firebase', { firebaseKey, authDomain, projectId, storageBucket, msgSenderId, appId, measurementId, vapidKey } as FirebaseConfigParams)
  },

  saveGoogleApiKeyConfiguration: async (googleMapsApiKey: string) => {
    return restClient.post('/admin/configuration/google-api', { googleMapsApiKey } as GoogleApiKeyConfigParams)
  },

  saveGoogleClientIdConfiguration: async (webClientID: string, androidClientID: string, iOSClientID: string, expoClientID: string) => {
    return restClient.post('/admin/configuration/google-client', { webClientID, androidClientID, iOSClientID, expoClientID } as GoogleClientIdConfigParams)
  },

  saveEmailConfiguration: async (email: string, emailName: string, enableEmail: boolean, password?: string) => {
    return restClient.post('/admin/configuration/email', { email, emailName, enableEmail, ...(password ? { password } : {}) } as EmailConfigParams)
  },

  savePaypalConfiguration: async (clientId: string, sandbox: boolean, clientSecret?: string) => {
    return restClient.post('/admin/configuration/paypal', { clientId, sandbox, ...(clientSecret ? { clientSecret } : {}) } as PaypalConfigParams)
  },

  saveSentryConfiguration: async (dashboardSentryUrl: string, webSentryUrl: string, apiSentryUrl: string, customerAppSentryUrl: string, restaurantAppSentryUrl: string, riderAppSentryUrl: string) => {
    return restClient.post('/admin/configuration/sentry', { dashboardSentryUrl, webSentryUrl, apiSentryUrl, customerAppSentryUrl, restaurantAppSentryUrl, riderAppSentryUrl } as SentryConfigParams)
  },

  saveTwilioConfiguration: async (twilioAccountSid: string, twilioPhoneNumber: string, twilioEnabled: boolean, twilioWhatsAppNumber: string, twilioAuthToken?: string) => {
    return restClient.post('/admin/configuration/twilio', { twilioAccountSid, twilioPhoneNumber, twilioEnabled, twilioWhatsAppNumber, ...(twilioAuthToken ? { twilioAuthToken } : {}) } as TwilioConfigParams)
  },

  saveVerificationConfiguration: async (skipEmailVerification: boolean, skipMobileVerification: boolean, skipWhatsAppOTP: boolean) => {
    return restClient.post('/admin/configuration/verification', { skipEmailVerification, skipMobileVerification, skipWhatsAppOTP } as VerificationConfigParams)
  }
}

// Order API
export const orderAPI = {
  getActiveOrders: async (page: number, limit: number) => {
    return restClient.get('/order/active', { page, limit } as PaginationParams)
  },
  
  getPastOrders: async (page: number, limit: number) => {
    return restClient.get('/order/past', { page, limit } as PaginationParams)
  },
  
  getOrderById: async (orderId: string) => {
    return restClient.get(`/order/${orderId}`)
  }
}

// Config API
export const configAPI = {
  getConfiguration: async () => {
    return restClient.get('/config')
  },
  
  getCuisines: async () => {
    return restClient.get('/config/cuisines')
  },
  
  updateConfiguration: async (configData: Record<string, unknown>) => {
    return restClient.put('/config', configData)
  }
}

// Export all APIs
export default {
  auth: authAPI,
  admin: adminAPI,
  order: orderAPI,
  config: configAPI
}