/**
 * Ariiti Market Admin — Mock REST API server.
 *
 * Zero-dependency Node.js HTTP server that implements every REST endpoint the
 * admin dashboard calls through `lib/api/api.ts` (see `lib/api/restClient.ts`).
 *
 * Run it with:
 *   node server.cjs           ->  http://localhost:4000/api/v1
 *
 * Every successful response is wrapped in an envelope:
 *   { data: <payload>, message: "Success", status: "success" }
 *
 * NOTE: data is stored in-memory. Restarting the server resets all changes.
 */
/**   Ariiti Market Admin — Mock REST API                                                
   ┃    Base URL : http://localhost:4000/api/v1                                        
   ┃    Health   : http://localhost:4000/api/v1/health                                 
   ┃    Demo login: admin@aritii.com / any-password   */
'use strict';

const http = require('http');
const { createDatabase } = require('./mock-data.cjs');

const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 4000;
const BASE = '/api/v1';

// ---------------------------------------------------------------------------
// In-memory database
// ---------------------------------------------------------------------------
const db = createDatabase();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function ok(res, data, message = 'Success') {
  sendJson(res, 200, { data, message, status: 'success' });
}

function created(res, data, message = 'Created successfully') {
  sendJson(res, 201, { data, message, status: 'success' });
}

function fail(res, status, message, code) {
  sendJson(res, status, {
    data: null,
    message,
    status: 'error',
    error: { code: code || 'ERROR', message },
  });
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e7) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function paginate(list, page, limit) {
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const start = (safePage - 1) * safeLimit;
  return {
    items: list.slice(start, start + safeLimit),
    total: list.length,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(list.length / safeLimit),
  };
}

function byText(value, term) {
  if (!term) return true;
  return String(value || '')
    .toLowerCase()
    .includes(String(term).toLowerCase());
}

function byDate(item, date) {
  if (!date) return true;
  return new Date(item).getTime() >= new Date(date).getTime();
}

function nextId(prefix) {
  return `${prefix}_${Math.floor(Date.now() + Math.random() * 100000)}`;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
const routes = [];

function route(method, pathPattern, handler) {
  const keys = [];
  const escaped = pathPattern.replace(/:([A-Za-z0-9_]+)/g, (_, key) => {
    keys.push(key);
    return '([^/]+)';
  });
  const regex = new RegExp(`^${escaped}/?$`);
  routes.push({ method, regex, keys, handler });
}

function match(method, path) {
  for (const r of routes) {
    if (r.method !== method) continue;
    const m = r.regex.exec(path);
    if (!m) continue;
    const params = {};
    r.keys.forEach((key, i) => {
      params[key] = decodeURIComponent(m[i + 1]);
    });
    return { handler: r.handler, params };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Computed helpers used by multiple handlers
// ---------------------------------------------------------------------------
function currentAdminSession() {
  return {
    shopType: '',
    userId: 'admin_1',
    token: 'mock-admin-token-12345',
    tokenExpiration: new Date(Date.now() + 24 * 3600000).toISOString(),
    refreshToken: 'mock-refresh-token',
    refreshTokenExpiration: new Date(Date.now() + 7 * 24 * 3600000).toISOString(),
    email: 'admin@aritii.com',
    name: 'Ariiti Market Super Admin',
    image: 'https://i.pravatar.cc/150?img=68',
    userType: 'ADMIN',
    userTypeId: 'admin_1',
    restaurants: [],
    permissions: ['*'],
    isActive: true,
  };
}

// ===========================================================================
// AUTH  (lib/api/api.ts -> authAPI)
// ===========================================================================
route('POST', '/auth/login', async (req, res, params, query, body) => {
  const { email = '', password = '', type = 'email' } = body || {};
  if (!email || !password) {
    return fail(res, 400, 'Email and password are required');
  }
  const lower = email.toLowerCase();
  const session = currentAdminSession();
  if (lower.includes('vendor')) {
    Object.assign(session, {
      email,
      name: 'Vendor Demo',
      userType: 'VENDOR',
      userId: 'vendor_1',
      userTypeId: 'vendor_1',
      restaurants: db.restaurants.slice(0, 3).map((r) => ({
        _id: r._id,
        name: r.name,
        image: r.image,
        address: r.address,
      })),
    });
  } else if (lower.includes('store') || lower.includes('restaurant')) {
    const store = db.restaurants[0];
    Object.assign(session, {
      email,
      name: store.name,
      userType: 'RESTAURANT',
      userId: store._id,
      userTypeId: store._id,
      shopType: store.shopType,
      restaurants: [{ _id: store._id, name: store.name, image: store.image, address: store.address }],
    });
  } else if (lower.includes('staff')) {
    Object.assign(session, {
      email,
      name: 'Staff Demo',
      userType: 'STAFF',
      userId: 'staff_1',
      userTypeId: 'staff_1',
      restaurants: [],
    });
  }
  return ok(res, session, 'Logged in successfully');
});

route('POST', '/auth/register', async (req, res, params, query, body) => {
  const user = { _id: nextId('user'), ...(body || {}), createdAt: new Date().toISOString() };
  db.users.unshift(user);
  return created(res, user);
});

route('POST', '/auth/email-exists', async (req, res, params, query, body) => {
  const exists = db.users.some((u) => u.email === (body || {}).email);
  return ok(res, { exists });
});

route('POST', '/auth/phone-exists', async (req, res, params, query, body) => {
  const exists = db.users.some((u) => u.phone === (body || {}).phone);
  return ok(res, { exists });
});

route('POST', '/auth/send-otp-email', async (req, res) => ok(res, { success: true }));
route('POST', '/auth/send-otp-phone', async (req, res) => ok(res, { success: true }));

route('POST', '/auth/verify-otp', async (req, res, params, query, body) => {
  const { otp } = body || {};
  if (!otp) return fail(res, 400, 'OTP is required');
  return ok(res, { verified: true, success: true });
});

route('POST', '/auth/forgot-password', async (req, res, params, query, body) => {
  const { email } = body || {};
  if (!email) return fail(res, 400, 'Email is required');
  return ok(res, { success: true });
});

route('POST', '/auth/reset-password', async (req, res, params, query, body) => {
  const { email, token, password } = body || {};
  if (!email || !token || !password) return fail(res, 400, 'Missing required fields');
  return ok(res, { success: true });
});

route('PUT', '/auth/user', async (req, res, params, query, body) => {
  const index = db.users.findIndex((u) => u._id === (body || {})._id);
  if (index === -1) return fail(res, 404, 'User not found');
  db.users[index] = { ...db.users[index], ...body, _id: db.users[index]._id };
  return ok(res, db.users[index]);
});

// ===========================================================================
// ADMIN PROFILE
// ===========================================================================
route('GET', '/admin/profile', async (req, res) => ok(res, currentAdminSession()));

route('PUT', '/admin/profile', async (req, res, params, query, body) =>
  ok(res, { ...currentAdminSession(), ...(body || {}) })
);

// ===========================================================================
// USERS
// ===========================================================================
route('GET', '/admin/users', async (req, res, params, query) => {
  const { items, total, page, limit, totalPages } = paginate(db.users, query.page, query.limit);
  return ok(res, { users: items, total, page, limit, totalPages });
});

route('GET', '/admin/users-paginated', async (req, res, params, query) => {
  const { search, registrationMethod, status } = query;
  let list = db.users.filter(
    (u) =>
      byText(u.name, search) ||
      byText(u.email, search)
  );
  if (registrationMethod) list = list.filter((u) => u.registrationMethod === registrationMethod);
  if (status) list = list.filter((u) => u.status === status);
  const { items, total, page, limit, totalPages } = paginate(list, query.page, query.limit);
  return ok(res, {
    usersPaginated: { data: items, totalCount: total, currentPage: page, totalPages },
  });
});

route('GET', '/admin/user/:userId', async (req, res, params) => {
  const user = db.users.find((u) => u._id === params.userId);
  if (!user) return fail(res, 404, 'User not found');
  return ok(res, { user });
});

route('PUT', '/admin/user/:userId', async (req, res, params, query, body) => {
  const index = db.users.findIndex((u) => u._id === params.userId);
  if (index === -1) return fail(res, 404, 'User not found');
  db.users[index] = { ...db.users[index], ...(body || {}), _id: params.userId };
  return ok(res, { user: db.users[index] });
});

route('DELETE', '/admin/user/:userId', async (req, res, params) => {
  const before = db.users.length;
  db.users = db.users.filter((u) => u._id !== params.userId);
  if (db.users.length === before) return fail(res, 404, 'User not found');
  return ok(res, { success: true });
});

// ==========================================================================
// =
// VENDORS
// ===========================================================================
route('GET', '/admin/vendors', async (req, res, params, query) => {
  const { items, total, page, limit, totalPages } = paginate(db.vendors, query.page, query.limit);
  const vendors = items.map((v) => ({
    ...v,
    totalRestaurants: v.restaurants.length,
    restaurants: v.restaurants.map((r) => {
      const full = db.restaurants.find((x) => x._id === r._id);
      return full || r;
    }),
  }));
  return ok(res, { vendors, total, page, limit, totalPages });
});

route('GET', '/admin/vendor', async (req, res, params, query) => {
  const vendor = db.vendors.find((v) => v._id === query.id);
  if (!vendor) return fail(res, 404, 'Vendor not found');
  return ok(res, { vendor });
});

route('GET', '/admin/vendor/:vendorId', async (req, res, params) => {
  const vendor = db.vendors.find((v) => v._id === params.vendorId);
  if (!vendor) return fail(res, 404, 'Vendor not found');
  return ok(res, { vendor });
});

route('POST', '/admin/vendor', async (req, res, params, query, body) => {
  const vendor = {
    _id: nextId('vendor'),
    unique_id: `VEN-${String(1100 + db.vendors.length)}`,
    __typename: 'Vendor',
    isActive: true,
    restaurants: [],
    ...(body || {}),
  };
  db.vendors.unshift(vendor);
  return created(res, { vendor });
});

route('PUT', '/admin/vendor', async (req, res, params, query, body) => {
  const id = (body || {})._id;
  const index = db.vendors.findIndex((v) => v._id === id);
  if (index === -1) return fail(res, 404, 'Vendor not found');
  db.vendors[index] = { ...db.vendors[index], ...(body || {}), _id: id };
  return ok(res, { vendor: db.vendors[index] });
});

route('PUT', '/admin/vendor/:vendorId', async (req, res, params, query, body) => {
  const index = db.vendors.findIndex((v) => v._id === params.vendorId);
  if (index === -1) return fail(res, 404, 'Vendor not found');
  db.vendors[index] = { ...db.vendors[index], ...(body || {}), _id: params.vendorId };
  return ok(res, { vendor: db.vendors[index] });
});

route('DELETE', '/admin/vendor/:vendorId', async (req, res, params) => {
  const before = db.vendors.length;
  db.vendors = db.vendors.filter((v) => v._id !== params.vendorId);
  if (db.vendors.length === before) return fail(res, 404, 'Vendor not found');
  return ok(res, { success: true });
});

// ===========================================================================
// RESTAURANTS
// ===========================================================================
route('GET', '/admin/restaurants', async (req, res) =>
  ok(res, { restaurants: db.restaurants })
);

route('POST', '/admin/restaurant', async (req, res, params, query, body) => {
  const { owner, restaurant } = body || {};
  const vendor = db.vendors.find((v) => v._id === owner || v.email === owner);
  const full = {
    _id: nextId('rest'),
    __typename: 'Restaurant',
    unique_restaurant_id: `REST-${String(1200 + db.restaurants.length).padStart(4, '0')}`,
    orderId: 500 + db.restaurants.length,
    orderPrefix: `R${db.restaurants.length + 1}`,
    isActive: true,
    isAvailable: true,
    commissionRate: 0.15,
    tax: 0.08,
    cuisines: [],
    openingTimes: [],
    location: { coordinates: [0, 0] },
    owner: vendor
      ? { _id: vendor._id, email: vendor.email, isActive: true }
      : { _id: owner || 'vendor_1', email: '', isActive: true },
    ...(restaurant || {}),
  };
  db.restaurants.unshift(full);
  if (vendor) {
    vendor.restaurants.push({ _id: full._id });
  }
  return created(res, full);
});

route('POST', '/admin/restaurant/duplicate', async (req, res, params, query, body) => {
  const { id } = body || {};
  const source = db.restaurants.find((r) => r._id === id);
  if (!source) return fail(res, 404, 'Restaurant not found');
  const clone = {
    ...source,
    _id: nextId('rest'),
    unique_restaurant_id: `${source.unique_restaurant_id}-COPY`,
    name: `${source.name} (Copy)`,
  };
  db.restaurants.unshift(clone);
  return created(res, clone);
});

route('GET', '/admin/restaurant/profile', async (req, res, params, query) => {
  const restaurant = db.restaurants.find((r) => r._id === query.id);
  if (!restaurant) return fail(res, 404, 'Restaurant not found');
  return ok(res, { restaurant });
});

route('PUT', '/admin/restaurant/delivery', async (req, res, params, query, body) => {
  const { id, minDeliveryFee, deliveryDistance, deliveryFee } = body || {};
  const restaurant = db.restaurants.find((r) => r._id === id);
  if (!restaurant) return fail(res, 404, 'Restaurant not found');
  restaurant.deliveryInfo = { minDeliveryFee, deliveryFee, deliveryDistance };
  return ok(res, { restaurant });
});

route('PUT', '/admin/restaurant/timings', async (req, res, params, query, body) => {
  const { id, openingTimes } = body || {};
  const restaurant = db.restaurants.find((r) => r._id === id);
  if (!restaurant) return fail(res, 404, 'Restaurant not found');
  restaurant.openingTimes = openingTimes || restaurant.openingTimes;
  return ok(res, { restaurant });
});

route('GET', '/admin/store-rider', async (req, res) =>
  ok(res, { storeRider: db.riders.map((r) => ({ _id: r._id, name: r.name, username: r.username })) })
);

// ===========================================================================
// RIDERS
// ===========================================================================
route('GET', '/admin/riders', async (req, res, params, query) => {
  let list = db.riders;
  if (query.search) list = list.filter((r) => byText(r.name, query.search) || byText(r.username, query.search));
  const { items, total, page, limit, totalPages } = paginate(list, query.page, query.limit);
  return ok(res, { riders: items, total, page, limit, totalPages });
});

route('GET', '/admin/rider/:riderId', async (req, res, params) => {
  const rider = db.riders.find((r) => r._id === params.riderId);
  if (!rider) return fail(res, 404, 'Rider not found');
  return ok(res, { rider });
});

route('POST', '/admin/rider', async (req, res, params, query, body) => {
  const rider = {
    _id: nextId('rider'),
    __typename: 'Rider',
    available: true,
    isActive: true,
    assigned: [],
    ...(body || {}),
  };
  db.riders.unshift(rider);
  return created(res, { rider });
});

route('PUT', '/admin/rider/:riderId', async (req, res, params, query, body) => {
  const index = db.riders.findIndex((r) => r._id === params.riderId);
  if (index === -1) return fail(res, 404, 'Rider not found');
  db.riders[index] = { ...db.riders[index], ...(body || {}), _id: params.riderId };
  return ok(res, { rider: db.riders[index] });
});

route('DELETE', '/admin/rider/:riderId', async (req, res, params) => {
  const before = db.riders.length;
  db.riders = db.riders.filter((r) => r._id !== params.riderId);
  if (db.riders.length === before) return fail(res, 404, 'Rider not found');
  return ok(res, { success: true });
});

// ===========================================================================
// ZONES
// ===========================================================================
route('GET', '/admin/zones', async (req, res) => ok(res, { zones: db.zones }));

route('GET', '/admin/zone/:zoneId', async (req, res, params) => {
  const zone = db.zones.find((z) => z._id === params.zoneId);
  if (!zone) return fail(res, 404, 'Zone not found');
  return ok(res, { zone });
});

route('POST', '/admin/zone', async (req, res, params, query, body) => {
  const zone = {
    _id: nextId('zone'),
    __typename: 'Zone',
    isActive: true,
    ...(body || {}),
  };
  db.zones.unshift(zone);
  return created(res, { zone });
});

route('PUT', '/admin/zone/:zoneId', async (req, res, params, query, body) => {
  const index = db.zones.findIndex((z) => z._id === params.zoneId);
  if (index === -1) return fail(res, 404, 'Zone not found');
  db.zones[index] = { ...db.zones[index], ...(body || {}), _id: params.zoneId };
  return ok(res, { zone: db.zones[index] });
});

route('DELETE', '/admin/zone/:zoneId', async (req, res, params) => {
  const before = db.zones.length;
  db.zones = db.zones.filter((z) => z._id !== params.zoneId);
  if (db.zones.length === before) return fail(res, 404, 'Zone not found');
  return ok(res, { success: true });
});

// ===========================================================================
// COUPONS
// ===========================================================================
route('GET', '/admin/coupons', async (req, res, params, query) => {
  const { items, total, page, limit, totalPages } = paginate(db.coupons, query.page, query.limit);
  return ok(res, { coupons: items, total, page, limit, totalPages });
});

route('GET', '/admin/coupon/:couponId', async (req, res, params) => {
  const coupon = db.coupons.find((c) => c._id === params.couponId);
  if (!coupon) return fail(res, 404, 'Coupon not found');
  return ok(res, { coupon });
});

route('POST', '/admin/coupon', async (req, res, params, query, body) => {
  const coupon = { _id: nextId('coupon'), __typename: 'Coupon', enabled: true, ...(body || {}) };
  db.coupons.unshift(coupon);
  return created(res, { coupon });
});

route('PUT', '/admin/coupon/:couponId', async (req, res, params, query, body) => {
  const index = db.coupons.findIndex((c) => c._id === params.couponId);
  if (index === -1) return fail(res, 404, 'Coupon not found');
  db.coupons[index] = { ...db.coupons[index], ...(body || {}), _id: params.couponId };
  return ok(res, { coupon: db.coupons[index] });
});

route('DELETE', '/admin/coupon/:couponId', async (req, res, params) => {
  const before = db.coupons.length;
  db.coupons = db.coupons.filter((c) => c._id !== params.couponId);
  if (db.coupons.length === before) return fail(res, 404, 'Coupon not found');
  return ok(res, { success: true });
});

// ===========================================================================
// BANNERS
// ===========================================================================
route('GET', '/admin/banners', async (req, res, params, query) => {
  const { items, total, page, limit, totalPages } = paginate(db.banners, query.page, query.limit);
  return ok(res, { banners: items, total, page, limit, totalPages });
});

route('GET', '/admin/banner/:bannerId', async (req, res, params) => {
  const banner = db.banners.find((b) => b._id === params.bannerId);
  if (!banner) return fail(res, 404, 'Banner not found');
  return ok(res, { banner });
});

route('POST', '/admin/banner', async (req, res, params, query, body) => {
  const banner = { _id: nextId('banner'), __typename: 'Banner', action: 'navigate', ...(body || {}) };
  db.banners.unshift(banner);
  return created(res, { banner });
});

route('PUT', '/admin/banner/:bannerId', async (req, res, params, query, body) => {
  const index = db.banners.findIndex((b) => b._id === params.bannerId);
  if (index === -1) return fail(res, 404, 'Banner not found');
  db.banners[index] = { ...db.banners[index], ...(body || {}), _id: params.bannerId };
  return ok(res, { banner: db.banners[index] });
});

route('DELETE', '/admin/banner/:bannerId', async (req, res, params) => {
  const before = db.banners.length;
  db.banners = db.banners.filter((b) => b._id !== params.bannerId);
  if (db.banners.length === before) return fail(res, 404, 'Banner not found');
  return ok(res, { success: true });
});

// ===========================================================================
// CUISINES
// ===========================================================================
route('GET', '/admin/cuisines', async (req, res, params, query) => {
  let list = db.cuisines;
  if (query.search) list = list.filter((c) => byText(c.name, query.search));
  if (query.shopType) list = list.filter((c) => c.shopType === query.shopType);
  const { items, total, page, limit, totalPages } = paginate(list, query.page, query.limit);
  return ok(res, { cuisines: items, total, page, limit, totalPages });
});

route('GET', '/admin/cuisine/:cuisineId', async (req, res, params) => {
  const cuisine = db.cuisines.find((c) => c._id === params.cuisineId);
  if (!cuisine) return fail(res, 404, 'Cuisine not found');
  return ok(res, { cuisine });
});

route('POST', '/admin/cuisine', async (req, res, params, query, body) => {
  const cuisine = { _id: nextId('cuisine'), __typename: 'Cuisine', ...(body || {}) };
  db.cuisines.unshift(cuisine);
  return created(res, { cuisine });
});

route('PUT', '/admin/cuisine/:cuisineId', async (req, res, params, query, body) => {
  const index = db.cuisines.findIndex((c) => c._id === params.cuisineId);
  if (index === -1) return fail(res, 404, 'Cuisine not found');
  db.cuisines[index] = { ...db.cuisines[index], ...(body || {}), _id: params.cuisineId };
  return ok(res, { cuisine: db.cuisines[index] });
});

route('DELETE', '/admin/cuisine/:cuisineId', async (req, res, params) => {
  const before = db.cuisines.length;
  db.cuisines = db.cuisines.filter((c) => c._id !== params.cuisineId);
  if (db.cuisines.length === before) return fail(res, 404, 'Cuisine not found');
  return ok(res, { success: true });
});

// ===========================================================================
// SHOP TYPES
// ===========================================================================
route('GET', '/admin/shop-types', async (req, res) => ok(res, { shopTypes: db.shopTypes }));

route('GET', '/admin/shop-type/:shopTypeId', async (req, res, params) => {
  const shopType = db.shopTypes.find((s) => s._id === params.shopTypeId);
  if (!shopType) return fail(res, 404, 'Shop type not found');
  return ok(res, { shopType });
});

route('POST', '/admin/shop-type', async (req, res, params, query, body) => {
  const shopType = { _id: nextId('stype'), __typename: 'ShopType', isActive: true, ...(body || {}) };
  db.shopTypes.unshift(shopType);
  return created(res, { shopType });
});

route('PUT', '/admin/shop-type/:shopTypeId', async (req, res, params, query, body) => {
  const index = db.shopTypes.findIndex((s) => s._id === params.shopTypeId);
  if (index === -1) return fail(res, 404, 'Shop type not found');
  db.shopTypes[index] = { ...db.shopTypes[index], ...(body || {}), _id: params.shopTypeId };
  return ok(res, { shopType: db.shopTypes[index] });
});

route('DELETE', '/admin/shop-type/:shopTypeId', async (req, res, params) => {
  const before = db.shopTypes.length;
  db.shopTypes = db.shopTypes.filter((s) => s._id !== params.shopTypeId);
  if (db.shopTypes.length === before) return fail(res, 404, 'Shop type not found');
  return ok(res, { success: true });
});

// ===========================================================================
// NOTIFICATIONS
// ===========================================================================
route('GET', '/admin/notifications', async (req, res, params, query) => {
  let list = db.notifications;
  if (query.search) list = list.filter((n) => byText(n.title, query.search));
  const { items, total, page, limit, totalPages } = paginate(list, query.page, query.limit);
  return ok(res, { notifications: items, total, page, limit, totalPages });
});

route('POST', '/admin/notification', async (req, res, params, query, body) => {
  const notification = {
    _id: nextId('notif'),
    __typename: 'Notification',
    createdAt: new Date().toISOString(),
    ...(body || {}),
  };
  db.notifications.unshift(notification);
  return created(res, { notification });
});

// ===========================================================================
// TIPPING
// ===========================================================================
route('GET', '/admin/tipping', async (req, res) => ok(res, { tips: db.tipping }));

route('POST', '/admin/tipping', async (req, res, params, query, body) => {
  db.tipping = { _id: nextId('tips'), __typename: 'Tipping', enabled: true, ...(body || {}) };
  return created(res, { tips: db.tipping });
});

route('PUT', '/admin/tipping/:tippingId', async (req, res, params, query, body) => {
  db.tipping = { ...db.tipping, ...(body || {}), _id: params.tippingId };
  return ok(res, { tips: db.tipping });
});

// ===========================================================================
// WITHDRAW REQUESTS
// ===========================================================================
route('GET', '/admin/withdraw-requests', async (req, res, params, query) => {
  let list = db.withdrawRequests;
  if (query.userType) list = list.filter((w) => w[query.userType === 'RIDER' ? 'rider' : 'store']);
  if (query.search) {
    const term = String(query.search).toLowerCase();
    list = list.filter(
      (w) =>
        byText(w.requestId, term) ||
        (w.rider && byText(w.rider.name, term)) ||
        (w.store && byText(w.store.name, term))
    );
  }
  const { items, total, page, limit, totalPages } = paginate(list, query.pageNo || query.page, query.pageSize || query.limit);
  return ok(res, {
    withdrawRequests: {
      success: true,
      message: null,
      pagination: { total },
      data: items,
    },
  });
});

route('PUT', '/admin/withdraw-request/:withdrawRequestId', async (req, res, params, query, body) => {
  const index = db.withdrawRequests.findIndex((w) => w._id === params.withdrawRequestId);
  if (index === -1) return fail(res, 404, 'Withdraw request not found');
  db.withdrawRequests[index] = {
    ...db.withdrawRequests[index],
    status: (body || {}).status || db.withdrawRequests[index].status,
  };
  return ok(res, { withdrawRequest: db.withdrawRequests[index] });
});

// ===========================================================================
// ORDERS
// ===========================================================================
route('GET', '/admin/orders', async (req, res, params, query) => {
  let list = db.orders;
  if (query.status) list = list.filter((o) => o.orderStatus === query.status);
  const { items, total, page, limit, totalPages } = paginate(list, query.page, query.limit);
  return ok(res, { orders: items, total, page, limit, totalPages });
});

route('GET', '/admin/order/:orderId', async (req, res, params) => {
  const order = db.orders.find(
    (o) => o._id === params.orderId || o.orderId === params.orderId
  );
  if (!order) return fail(res, 404, 'Order not found');
  return ok(res, { order });
});

route('GET', '/admin/orders-paginated', async (req, res, params, query) => {
  let list = [...db.orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  if (query.search) {
    const term = String(query.search).toLowerCase();
    list = list.filter((o) => byText(o.orderId, term) || byText(o.orderAmount, term));
  }
  if (query.starting_date) list = list.filter((o) => byDate(o.createdAt, query.starting_date));
  if (query.ending_date) {
    list = list.filter((o) => new Date(o.createdAt).getTime() <= new Date(query.ending_date).getTime() + 86400000);
  }
  if (query.orderStatus) {
    const statuses = Array.isArray(query.orderStatus) ? query.orderStatus : [query.orderStatus];
    list = list.filter((o) => statuses.includes(o.orderStatus));
  }
  const { items, total, page, limit, totalPages } = paginate(list, query.page, query.rows);
  return ok(res, {
    allOrdersPaginated: {
      orders: items,
      totalCount: total,
      currentPage: page,
      totalPages,
    },
  });
});

route('GET', '/admin/active-orders', async (req, res, params, query) => {
  const activeStatuses = ['PENDING', 'ACCEPTED', 'ASSIGNED', 'PICKED', 'ARRIVED'];
  let list = db.orders.filter((o) => activeStatuses.includes(o.orderStatus));
  if (query.search) {
    const term = String(query.search).toLowerCase();
    list = list.filter((o) => byText(o.orderId, term) || byText(o.restaurant.name, term));
  }
  if (query.actions) {
    const actions = Array.isArray(query.actions) ? query.actions : [query.actions];
    if (actions.length) list = list.filter((o) => actions.includes(o.orderStatus));
  }
  const { items, total, page, limit, totalPages } = paginate(list, query.page, query.rowsPerPage);
  return ok(res, {
    getActiveOrders: {
      orders: items,
      totalCount: total,
      currentPage: page,
      totalPages,
    },
  });
});

route('GET', '/admin/stats', async (req, res) => {
  const delivered = db.orders.filter((o) => o.orderStatus === 'DELIVERED').length;
  return ok(res, {
    stats: {
      totalOrders: db.orders.length,
      totalUsers: db.users.length,
      totalRestaurants: db.restaurants.length,
      totalRiders: db.riders.length,
      totalVendors: db.vendors.length,
      deliveredOrders: delivered,
      totalRevenue: db.orders.reduce((sum, o) => sum + o.orderAmount, 0),
    },
  });
});

// ===========================================================================
// DASHBOARD
// ===========================================================================
route('GET', '/admin/dashboard/users', async (req, res) =>
  ok(res, {
    getDashboardUsers: {
      usersCount: db.users.length,
      vendorsCount: db.vendors.length,
      restaurantsCount: db.restaurants.length,
      ridersCount: db.riders.length,
    },
  })
);

route('GET', '/admin/dashboard/users-by-year', async (req, res, params, query) => {
  const year = parseInt(query.year, 10) || new Date().getFullYear();
  const monthSeries = (list) => {
    const series = new Array(12).fill(0);
    list.forEach((item) => {
      const d = new Date(item.createdAt || Date.now());
      if (d.getFullYear() === year) {
        series[d.getMonth()] += 1;
      }
    });
    return series;
  };
  return ok(res, {
    getDashboardUsersByYear: {
      usersCount: monthSeries(db.users),
      vendorsCount: monthSeries(db.vendors),
      restaurantsCount: monthSeries(db.restaurants),
      ridersCount: monthSeries(db.riders),
    },
  });
});

route('GET', '/admin/dashboard/orders-by-type', async (req, res) => {
  const count = (type) => db.orders.filter((o) => o.orderType === type).length;
  return ok(res, {
    getDashboardOrdersByType: [
      { label: 'DELIVERY', value: count('DELIVERY') },
      { label: 'PICKUP', value: count('PICKUP') },
    ],
  });
});

route('GET', '/admin/dashboard/sales-by-type', async (req, res) => {
  const sum = (type) =>
    db.orders.filter((o) => o.orderType === type).reduce((s, o) => s + o.orderAmount, 0);
  return ok(res, {
    getDashboardSalesByType: [
      { label: 'DELIVERY', value: sum('DELIVERY') },
      { label: 'PICKUP', value: sum('PICKUP') },
    ],
  });
});

// ===========================================================================
// TRANSACTION HISTORY
// ===========================================================================
route('GET', '/admin/transaction-history', async (req, res, params, query) => {
  let list = db.transactions;
  if (query.userType) list = list.filter((t) => t.userType === query.userType);
  if (query.startingDate) list = list.filter((t) => byDate(t.createdAt, query.startingDate));
  if (query.endingDate) {
    list = list.filter((t) => new Date(t.createdAt).getTime() <= new Date(query.endingDate).getTime() + 86400000);
  }
  if (query.search) {
    const term = String(query.search).toLowerCase();
    list = list.filter(
      (t) => byText(t.transactionId, term) || (t.rider && byText(t.rider.name, term)) || (t.store && byText(t.store.name, term))
    );
  }
  const { items, total, page, limit, totalPages } = paginate(list, query.pageNo || query.page, query.pageSize || query.limit);
  return ok(res, {
    transactionHistory: { data: items, pagination: { total } },
  });
});

// ===========================================================================
// EARNINGS
// ===========================================================================
route('GET', '/admin/earnings', async (req, res, params, query) => {
  let list = db.earnings;
  if (query.userType) list = list.filter((e) => e.userType === query.userType);
  if (query.orderType) list = list.filter((e) => e.orderType === query.orderType);
  if (query.paymentMethod) list = list.filter((e) => e.paymentMethod === query.paymentMethod);
  if (query.startingDate) list = list.filter((e) => byDate(e.createdAt, query.startingDate));
  if (query.endingDate) {
    list = list.filter((e) => new Date(e.createdAt).getTime() <= new Date(query.endingDate).getTime() + 86400000);
  }
  if (query.search) {
    const term = String(query.search).toLowerCase();
    list = list.filter(
      (e) =>
        byText(e.orderId, term) ||
        byText(e.storeEarnings.storeId.name, term) ||
        byText(e.riderEarnings.riderId.name, term)
    );
  }
  const { items, total } = paginate(list, query.pageNo || query.page, query.pageSize || query.limit);
  const grandTotalEarnings = {
    platformTotal: list.reduce((s, e) => s + e.platformEarnings.totalEarnings, 0),
    riderTotal: list.reduce((s, e) => s + e.riderEarnings.totalEarnings, 0),
    storeTotal: list.reduce((s, e) => s + e.storeEarnings.totalEarnings, 0),
  };
  return ok(res, {
    earnings: {
      success: true,
      message: null,
      data: { earnings: items, grandTotalEarnings },
      pagination: { total },
    },
  });
});

// ===========================================================================
// STAFF
// ===========================================================================
route('GET', '/admin/staffs-paginated', async (req, res, params, query) => {
  let list = db.staff;
  if (query.search) list = list.filter((s) => byText(s.name, query.search) || byText(s.email, query.search));
  const { items, total, page, limit, totalPages } = paginate(list, query.page, query.limit);
  return ok(res, {
    staffsPaginated: { data: items, totalCount: total, currentPage: page, totalPages },
  });
});

route('POST', '/admin/staff', async (req, res, params, query, body) => {
  const staff = { _id: nextId('staff'), __typename: 'Staff', isActive: true, permissions: [], ...(body || {}) };
  db.staff.unshift(staff);
  return created(res, { staff });
});

route('PUT', '/admin/staff', async (req, res, params, query, body) => {
  const id = (body || {})._id;
  const index = db.staff.findIndex((s) => s._id === id);
  if (index === -1) return fail(res, 404, 'Staff not found');
  db.staff[index] = { ...db.staff[index], ...(body || {}), _id: id };
  return ok(res, { staff: db.staff[index] });
});

route('DELETE', '/admin/staff/:staffId', async (req, res, params) => {
  const before = db.staff.length;
  db.staff = db.staff.filter((s) => s._id !== params.staffId);
  if (db.staff.length === before) return fail(res, 404, 'Staff not found');
  return ok(res, { success: true });
});

// ===========================================================================
// SUPPORT TICKETS
// ===========================================================================
route('GET', '/admin/support/ticket-users', async (req, res, params, query) => {
  const { items } = paginate(db.supportUsers, query.page, query.limit);
  return ok(res, { getTicketUsers: { users: items } });
});

route('GET', '/admin/support/user-tickets', async (req, res, params, query) => {
  let tickets = db.supportTickets.filter((t) => t.user._id === query.userId);
  tickets = tickets.sort(
    (a, b) => parseInt(b.lastMessageAt || b.updatedAt, 10) - parseInt(a.lastMessageAt || a.updatedAt, 10)
  );
  const { items, total } = paginate(tickets, query.page, query.limit);
  return ok(res, {
    getSingleUserSupportTickets: {
      tickets: items,
      totalCount: total,
      currentPage: query.page || 1,
      totalPages: Math.ceil(total / (query.limit || 10)),
    },
  });
});

route('GET', '/admin/support/ticket-messages', async (req, res, params, query) => {
  let messages = db.supportMessages.filter((m) => m.ticketId === query.ticketId);
  const { items, total } = paginate(messages, query.page, query.limit);
  return ok(res, {
    getTicketMessages: {
      messages: items,
      totalCount: total,
      currentPage: query.page || 1,
      totalPages: Math.ceil(total / (query.limit || 10)),
    },
  });
});

route('POST', '/admin/support/ticket-message', async (req, res, params, query, body) => {
  const { content, ticketId } = body || {};
  if (!content || !ticketId) return fail(res, 400, 'content and ticketId are required');
  const message = {
    _id: nextId('msg'),
    __typename: 'Message',
    content,
    ticketId,
    from: 'ADMIN',
    createdAt: String(Date.now()),
    user: { _id: 'admin_1', name: 'Ariiti Market Support', email: 'admin@aritii.com' },
  };
  db.supportMessages.unshift(message);
  const ticket = db.supportTickets.find((t) => t._id === ticketId);
  if (ticket) {
    ticket.lastMessageAt = message.createdAt;
    ticket.updatedAt = message.createdAt;
  }
  return created(res, { message });
});

route('PUT', '/admin/support/ticket-status', async (req, res, params, query, body) => {
  const { ticketId, status } = body || {};
  const ticket = db.supportTickets.find((t) => t._id === ticketId);
  if (!ticket) return fail(res, 404, 'Ticket not found');
  ticket.status = status;
  ticket.updatedAt = String(Date.now());
  return ok(res, { ticket });
});

// ===========================================================================
// CONFIGURATION
// ===========================================================================
route('GET', '/admin/configuration/versions', async (req, res) =>
  ok(res, {
    versions: {
      customerAppVersion: db.configuration.customerAppVersion,
      riderAppVersion: db.configuration.riderAppVersion,
      restaurantAppVersion: db.configuration.restaurantAppVersion,
    },
  })
);

route('POST', '/admin/configuration/versions', async (req, res, params, query, body) => {
  Object.assign(db.configuration, body || {});
  return ok(res, {
    versions: {
      customerAppVersion: db.configuration.customerAppVersion,
      riderAppVersion: db.configuration.riderAppVersion,
      restaurantAppVersion: db.configuration.restaurantAppVersion,
    },
  });
});

// Generic configuration updater — maps a "section" to its configuration key(s)
const CONFIG_UPDATERS = {
  currency: (b) => ({ currency: b.currency, currencySymbol: b.currencySymbol }),
  'delivery-rate': (b) => ({ deliveryRate: b.deliveryRate, costType: b.costType }),
  amplitude: (b) => ({ webAmplitudeApiKey: b.webAmplitudeApiKey, appAmplitudeApiKey: b.appAmplitudeApiKey }),
  stripe: (b) => ({ publishableKey: b.publishableKey, stripeSecretKey: b.secretKey }),
  cloudinary: (b) => ({ cloudinaryUploadUrl: b.cloudinaryUploadUrl, cloudinaryApiKey: b.cloudinaryApiKey }),
  firebase: (b) => ({ ...b }),
  'google-api': (b) => ({ googleMapsApiKey: b.googleMapsApiKey }),
  'google-client': (b) => ({ webClientID: b.webClientID, androidClientID: b.androidClientID, iOSClientID: b.iOSClientID, expoClientID: b.expoClientID }),
  email: (b) => ({ email: b.email, emailName: b.emailName, enableEmail: b.enableEmail, emailPassword: b.password }),
  paypal: (b) => ({ paypalClientId: b.clientId, paypalSandbox: b.sandbox, paypalClientSecret: b.clientSecret }),
  sentry: (b) => ({ ...b }),
  twilio: (b) => ({ ...b }),
  verification: (b) => ({ ...b }),
};

Object.entries(CONFIG_UPDATERS).forEach(([section, updater]) => {
  route('POST', `/admin/configuration/${section}`, async (req, res, params, query, body) => {
    const patch = updater(body || {});
    Object.assign(db.configuration, patch);
    return ok(res, { configuration: db.configuration });
  });
});

// ===========================================================================
// ORDER API  (lib/api/api.ts -> orderAPI)
// ===========================================================================
route('GET', '/order/active', async (req, res, params, query) => {
  const activeStatuses = ['PENDING', 'ACCEPTED', 'ASSIGNED', 'PICKED', 'ARRIVED'];
  const list = db.orders.filter((o) => activeStatuses.includes(o.orderStatus));
  const { items, total } = paginate(list, query.page, query.limit);
  return ok(res, { orders: items, total });
});

route('GET', '/order/past', async (req, res, params, query) => {
  const list = db.orders.filter((o) => ['DELIVERED', 'CANCELLED'].includes(o.orderStatus));
  const { items, total } = paginate(list, query.page, query.limit);
  return ok(res, { orders: items, total });
});

route('GET', '/order/:orderId', async (req, res, params) => {
  const order = db.orders.find((o) => o._id === params.orderId || o.orderId === params.orderId);
  if (!order) return fail(res, 404, 'Order not found');
  return ok(res, { order });
});

// ===========================================================================
// CONFIG API  (lib/api/api.ts -> configAPI)
// ===========================================================================
route('GET', '/config', async (req, res) => ok(res, { configuration: db.configuration }));
route('PUT', '/config', async (req, res, params, query, body) => {
  Object.assign(db.configuration, body || {});
  return ok(res, { configuration: db.configuration });
});
route('GET', '/config/cuisines', async (req, res) => ok(res, { cuisines: db.cuisines }));

// ===========================================================================
// HEALTH / ROOT
// ===========================================================================
route('GET', '/health', async (req, res) =>
  ok(res, { server: 'aritii-admin-web-mock-rest-api', uptime: process.uptime(), dbSize: Object.keys(db).length })
);

// ===========================================================================
// HTTP server
// ===========================================================================
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
  const path = url.pathname;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, nonce, bop-auth');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // Only serve the /api/v1 namespace
  if (path.startsWith(BASE)) {
    const stripped = path.slice(BASE.length) || '/';
    const found = match(req.method, stripped);

    if (!found) {
      return fail(res, 404, `No route for ${req.method} ${path}`);
    }

    const query = {};
    for (const [key, value] of url.searchParams.entries()) {
      if (query[key]) {
        query[key] = Array.isArray(query[key]) ? [...query[key], value] : [query[key], value];
      } else {
        query[key] = value;
      }
    }

    try {
      const body = ['POST', 'PUT', 'PATCH'].includes(req.method) ? await readBody(req) : {};
      console.log(`[${new Date().toISOString()}] ${req.method} ${path}`);
      return await found.handler(req, res, found.params, query, body);
    } catch (err) {
      return fail(res, 400, `Invalid request: ${err.message}`);
    }
  }

  return fail(res, 404, `Not found. Server only exposes ${BASE}/*`);
});

server.listen(PORT, HOST, () => {
  console.log('==========================================================');
  console.log('  Ariiti Market Admin — Mock REST API');
  console.log(`  Base URL : http://${HOST}:${PORT}${BASE}`);
  console.log(`  Health   : http://${HOST}:${PORT}${BASE}/health`);
  console.log('  Demo login: admin@aritii.com / any-password');
  console.log('==========================================================');
});
