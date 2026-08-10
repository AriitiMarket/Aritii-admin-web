// API Service for Admin Dashboard
// This module consolidates all REST API endpoints

import restClient from './restClient'

// Auth API
export const authAPI = {
  login: async (email: string, password: string, type: string = 'email') => {
    return restClient.post('/auth/login', { email, password, type })
  },
  
  register: async (userData: any) => {
    return restClient.post('/auth/register', userData)
  },
  
  emailExists: async (email: string) => {
    return restClient.post('/auth/email-exists', { email })
  },
  
  phoneExists: async (phone: string) => {
    return restClient.post('/auth/phone-exists', { phone })
  },
  
  sendOtpToEmail: async (email: string) => {
    return restClient.post('/auth/send-otp-email', { email })
  },
  
  sendOtpToPhone: async (phone: string) => {
    return restClient.post('/auth/send-otp-phone', { phone })
  },
  
  verifyOtp: async (otp: string, email?: string, phone?: string) => {
    return restClient.post('/auth/verify-otp', { otp, email, phone })
  },
  
  forgotPassword: async (email: string) => {
    return restClient.post('/auth/forgot-password', { email })
  },
  
  resetPassword: async (password: string, email: string, token: string) => {
    return restClient.post('/auth/reset-password', { password, email, token })
  },
  
  updateUser: async (userData: any) => {
    return restClient.put('/auth/user', userData)
  }
}

// Admin API
export const adminAPI = {
  getAdminProfile: async () => {
    return restClient.get('/admin/profile')
  },
  
  updateAdminProfile: async (adminData: any) => {
    return restClient.put('/admin/profile', adminData)
  },
  
  getAllUsers: async (page: number, limit: number) => {
    return restClient.get('/admin/users', { page, limit })
  },
  
  getUserById: async (userId: string) => {
    return restClient.get(`/admin/user/${userId}`)
  },
  
  updateUser: async (userId: string, userData: any) => {
    return restClient.put(`/admin/user/${userId}`, userData)
  },
  
  deleteUser: async (userId: string) => {
    return restClient.delete(`/admin/user/${userId}`)
  },
  
  getAllVendors: async (page: number, limit: number) => {
    return restClient.get('/admin/vendors', { page, limit })
  },
  
  getVendorById: async (vendorId: string) => {
    return restClient.get(`/admin/vendor/${vendorId}`)
  },
  
  updateVendor: async (vendorId: string, vendorData: any) => {
    return restClient.put(`/admin/vendor/${vendorId}`, vendorData)
  },
  
  deleteVendor: async (vendorId: string) => {
    return restClient.delete(`/admin/vendor/${vendorId}`)
  },
  
  getAllRiders: async (page: number, limit: number) => {
    return restClient.get('/admin/riders', { page, limit })
  },

  getRiderById: async (riderId: string) => {
    return restClient.get(`/admin/rider/${riderId}`)
  },

  createRider: async (riderData: any) => {
    return restClient.post('/admin/rider', riderData)
  },

  updateRider: async (riderId: string, riderData: any) => {
    return restClient.put(`/admin/rider/${riderId}`, riderData)
  },

  deleteRider: async (riderId: string) => {
    return restClient.delete(`/admin/rider/${riderId}`)
  },
  
  getAllOrders: async (page: number, limit: number, status?: string) => {
    return restClient.get('/admin/orders', { page, limit, status })
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

  createZone: async (zoneData: any) => {
    return restClient.post('/admin/zone', zoneData)
  },

  updateZone: async (zoneId: string, zoneData: any) => {
    return restClient.put(`/admin/zone/${zoneId}`, zoneData)
  },

  deleteZone: async (zoneId: string) => {
    return restClient.delete(`/admin/zone/${zoneId}`)
  },

  getAllCoupons: async (page: number, limit: number) => {
    return restClient.get('/admin/coupons', { page, limit })
  },

  getCouponById: async (couponId: string) => {
    return restClient.get(`/admin/coupon/${couponId}`)
  },

  createCoupon: async (couponData: any) => {
    return restClient.post('/admin/coupon', couponData)
  },

  updateCoupon: async (couponId: string, couponData: any) => {
    return restClient.put(`/admin/coupon/${couponId}`, couponData)
  },

  deleteCoupon: async (couponId: string) => {
    return restClient.delete(`/admin/coupon/${couponId}`)
  },

  getAllBanners: async (page: number, limit: number) => {
    return restClient.get('/admin/banners', { page, limit })
  },

  getBannerById: async (bannerId: string) => {
    return restClient.get(`/admin/banner/${bannerId}`)
  },

  createBanner: async (bannerData: any) => {
    return restClient.post('/admin/banner', bannerData)
  },

  updateBanner: async (bannerId: string, bannerData: any) => {
    return restClient.put(`/admin/banner/${bannerId}`, bannerData)
  },

  deleteBanner: async (bannerId: string) => {
    return restClient.delete(`/admin/banner/${bannerId}`)
  },

  getAllCuisines: async (page: number, limit: number, search?: string, shopType?: string) => {
    return restClient.get('/admin/cuisines', { page, limit, search, shopType })
  },

  getCuisineById: async (cuisineId: string) => {
    return restClient.get(`/admin/cuisine/${cuisineId}`)
  },

  createCuisine: async (cuisineData: any) => {
    return restClient.post('/admin/cuisine', cuisineData)
  },

  updateCuisine: async (cuisineId: string, cuisineData: any) => {
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

  createShopType: async (shopTypeData: any) => {
    return restClient.post('/admin/shop-type', shopTypeData)
  },

  updateShopType: async (shopTypeId: string, shopTypeData: any) => {
    return restClient.put(`/admin/shop-type/${shopTypeId}`, shopTypeData)
  },

  deleteShopType: async (shopTypeId: string) => {
    return restClient.delete(`/admin/shop-type/${shopTypeId}`)
  },

  getAllNotifications: async (page: number, limit: number, search?: string) => {
    return restClient.get('/admin/notifications', { page, limit, search })
  },

  sendNotification: async (notificationData: any) => {
    return restClient.post('/admin/notification', notificationData)
  },

  getTipping: async () => {
    return restClient.get('/admin/tipping')
  },

  createTipping: async (tippingData: any) => {
    return restClient.post('/admin/tipping', tippingData)
  },

  updateTipping: async (tippingId: string, tippingData: any) => {
    return restClient.put(`/admin/tipping/${tippingId}`, tippingData)
  },

  getAllWithdrawRequests: async (pageSize: number, pageNo: number, userType?: string, search?: string) => {
    return restClient.get('/admin/withdraw-requests', { pageSize, pageNo, userType, search })
  },

  updateWithdrawRequest: async (withdrawRequestId: string, status: string) => {
    return restClient.put(`/admin/withdraw-request/${withdrawRequestId}`, { status })
  },

  getActiveOrders: async (page: number, rowsPerPage: number, search?: string, actions?: string[], restaurantId?: string) => {
    return restClient.get('/admin/active-orders', { page, rowsPerPage, search, actions, restaurantId })
  },

  getDashboardUsers: async () => {
    return restClient.get('/admin/dashboard/users')
  },

  getDashboardUsersByYear: async (year: number) => {
    return restClient.get('/admin/dashboard/users-by-year', { year })
  },

  getAllOrdersPaginated: async (page: number, rows: number, dateKeyword?: string, starting_date?: string, ending_date?: string, orderStatus?: string[], search?: string) => {
    return restClient.get('/admin/orders-paginated', { page, rows, dateKeyword, starting_date, ending_date, orderStatus, search })
  },

  getTransactionHistory: async (pageSize: number, pageNo: number, startingDate?: string, endingDate?: string, userType?: string, search?: string) => {
    return restClient.get('/admin/transaction-history', { pageSize, pageNo, startingDate, endingDate, userType, search })
  },

  createRestaurant: async (owner: string, restaurantData: any) => {
    return restClient.post('/admin/restaurant', { owner, restaurant: restaurantData })
  },

  getAllRestaurants: async () => {
    return restClient.get('/admin/restaurants')
  },

  getAllStaffsPaginated: async (page: number, limit: number, search?: string) => {
    return restClient.get('/admin/staffs-paginated', { page, limit, search })
  },

  deleteStaff: async (staffId: string) => {
    return restClient.delete(`/admin/staff/${staffId}`)
  },

  getTicketUsers: async (page: number, limit: number) => {
    return restClient.get('/admin/support/ticket-users', { page, limit })
  },

  getUserSupportTickets: async (userId: string, page: number, limit: number) => {
    return restClient.get('/admin/support/user-tickets', { userId, page, limit })
  },

  getTicketMessages: async (ticketId: string, page: number, limit: number) => {
    return restClient.get('/admin/support/ticket-messages', { ticketId, page, limit })
  },

  createTicketMessage: async (content: string, ticketId: string) => {
    return restClient.post('/admin/support/ticket-message', { content, ticketId })
  },

  updateTicketStatus: async (ticketId: string, status: string) => {
    return restClient.put('/admin/support/ticket-status', { ticketId, status })
  },

  getDashboardOrdersByType: async () => {
    return restClient.get('/admin/dashboard/orders-by-type')
  },

  getDashboardSalesByType: async () => {
    return restClient.get('/admin/dashboard/sales-by-type')
  },

  createVendor: async (vendorData: any) => {
    return restClient.post('/admin/vendor', vendorData)
  },

  getVendorById: async (id: string) => {
    return restClient.get('/admin/vendor', { id })
  },

  editVendor: async (vendorData: any) => {
    return restClient.put('/admin/vendor', vendorData)
  },

  duplicateRestaurant: async (id: string, owner: string) => {
    return restClient.post('/admin/restaurant/duplicate', { id, owner })
  },

  getVendors: async () => {
    return restClient.get('/admin/vendors')
  },

  getStoreRider: async () => {
    return restClient.get('/admin/store-rider')
  },

  updateRestaurantDelivery: async (restaurantId: string, minDeliveryFee: number, deliveryDistance: number, deliveryFee: number) => {
    return restClient.put('/admin/restaurant/delivery', { id: restaurantId, minDeliveryFee, deliveryDistance, deliveryFee })
  },

  getRestaurantProfile: async (restaurantId: string) => {
    return restClient.get('/admin/restaurant/profile', { id: restaurantId })
  },

  updateTimings: async (restaurantId: string, openingTimes: any) => {
    return restClient.put('/admin/restaurant/timings', { id: restaurantId, openingTimes })
  },

  createStaff: async (staffData: any) => {
    return restClient.post('/admin/staff', staffData)
  },

  editStaff: async (staffData: any) => {
    return restClient.put('/admin/staff', staffData)
  },

  getEarnings: async (pageSize: number, pageNo: number, startingDate?: string, endingDate?: string, search?: string, userType?: string, userId?: string, orderType?: string, paymentMethod?: string) => {
    return restClient.get('/admin/earnings', { pageSize, pageNo, startingDate, endingDate, search, userType, userId, orderType, paymentMethod })
  },

  getUsersPaginated: async (page: number, limit: number, search?: string, registrationMethod?: string, status?: string) => {
    return restClient.get('/admin/users-paginated', { page, limit, search, registrationMethod, status })
  },

  saveCurrencyConfiguration: async (currency: string, currencySymbol: string) => {
    return restClient.post('/admin/configuration/currency', { currency, currencySymbol })
  },

  saveDeliveryRateConfiguration: async (deliveryRate: number, costType: string) => {
    return restClient.post('/admin/configuration/delivery-rate', { deliveryRate, costType })
  },

  saveAmplitudeConfiguration: async (webAmplitudeApiKey: string, appAmplitudeApiKey: string) => {
    return restClient.post('/admin/configuration/amplitude', { webAmplitudeApiKey, appAmplitudeApiKey })
  },

  saveStripeConfiguration: async (publishableKey: string, secretKey?: string) => {
    return restClient.post('/admin/configuration/stripe', { publishableKey, ...(secretKey ? { secretKey } : {}) })
  },

  getVersions: async () => {
    return restClient.get('/admin/configuration/versions')
  },

  setVersions: async (customerAppVersion: any, riderAppVersion: any, restaurantAppVersion: any) => {
    return restClient.post('/admin/configuration/versions', { customerAppVersion, riderAppVersion, restaurantAppVersion })
  },

  saveCloudinaryConfiguration: async (cloudinaryUploadUrl: string, cloudinaryApiKey: string) => {
    return restClient.post('/admin/configuration/cloudinary', { cloudinaryUploadUrl, cloudinaryApiKey })
  },

  saveFirebaseConfiguration: async (firebaseKey: string, authDomain: string, projectId: string, storageBucket: string, msgSenderId: string, appId: string, measurementId: string, vapidKey: string) => {
    return restClient.post('/admin/configuration/firebase', { firebaseKey, authDomain, projectId, storageBucket, msgSenderId, appId, measurementId, vapidKey })
  },

  saveGoogleApiKeyConfiguration: async (googleMapsApiKey: string) => {
    return restClient.post('/admin/configuration/google-api', { googleMapsApiKey })
  },

  saveGoogleClientIdConfiguration: async (webClientID: string, androidClientID: string, iOSClientID: string, expoClientID: string) => {
    return restClient.post('/admin/configuration/google-client', { webClientID, androidClientID, iOSClientID, expoClientID })
  },

  saveEmailConfiguration: async (email: string, emailName: string, enableEmail: boolean, password?: string) => {
    return restClient.post('/admin/configuration/email', { email, emailName, enableEmail, ...(password ? { password } : {}) })
  },

  savePaypalConfiguration: async (clientId: string, sandbox: boolean, clientSecret?: string) => {
    return restClient.post('/admin/configuration/paypal', { clientId, sandbox, ...(clientSecret ? { clientSecret } : {}) })
  },

  saveSentryConfiguration: async (dashboardSentryUrl: string, webSentryUrl: string, apiSentryUrl: string, customerAppSentryUrl: string, restaurantAppSentryUrl: string, riderAppSentryUrl: string) => {
    return restClient.post('/admin/configuration/sentry', { dashboardSentryUrl, webSentryUrl, apiSentryUrl, customerAppSentryUrl, restaurantAppSentryUrl, riderAppSentryUrl })
  },

  saveTwilioConfiguration: async (twilioAccountSid: string, twilioPhoneNumber: string, twilioEnabled: boolean, twilioWhatsAppNumber: string, twilioAuthToken?: string) => {
    return restClient.post('/admin/configuration/twilio', { twilioAccountSid, twilioPhoneNumber, twilioEnabled, twilioWhatsAppNumber, ...(twilioAuthToken ? { twilioAuthToken } : {}) })
  },

  saveVerificationConfiguration: async (skipEmailVerification: boolean, skipMobileVerification: boolean, skipWhatsAppOTP: boolean) => {
    return restClient.post('/admin/configuration/verification', { skipEmailVerification, skipMobileVerification, skipWhatsAppOTP })
  }
}

// Order API
export const orderAPI = {
  getActiveOrders: async (page: number, limit: number) => {
    return restClient.get('/order/active', { page, limit })
  },
  
  getPastOrders: async (page: number, limit: number) => {
    return restClient.get('/order/past', { page, limit })
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
  
  updateConfiguration: async (configData: any) => {
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
