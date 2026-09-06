/**
 * Mock seed data for the Ariiti Market Admin REST API.
 *
 * The shapes below intentionally mirror the response structures the admin
 * dashboard expects (the screens read `response.data.<field>` after the REST
 * client unwraps the envelope). Field names follow the GraphQL shapes the app
 * was originally built against so the migration stays drop-in friendly.
 *
 * NOTE: this is in-memory seed data only. Every CRUD mutation in server.js
 * operates on these arrays while the process is alive.
 */
'use strict';
//     cd mock-backend
  //   node server.js

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
let __id = 1000;
function id(prefix) {
  __id += 1;
  return `${prefix}_${__id}`;
}

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
const userSeeds = [
  ['Ava Johnson', 'ava.johnson@example.com', 'RIDER', 'CUSTOM'],
  ['Liam Smith', 'liam.smith@example.com', 'CUSTOMER', 'GOOGLE'],
  ['Emma Wilson', 'emma.wilson@example.com', 'CUSTOMER', 'FACEBOOK'],
  ['Noah Brown', 'noah.brown@example.com', 'CUSTOMER', 'CUSTOM'],
  ['Olivia Davis', 'olivia.davis@example.com', 'CUSTOMER', 'CUSTOM'],
  ['Elijah Martinez', 'elijah.martinez@example.com', 'CUSTOMER', 'APPLE'],
  ['Sophia Garcia', 'sophia.garcia@example.com', 'CUSTOMER', 'CUSTOM'],
  ['Lucas Rodriguez', 'lucas.rodriguez@example.com', 'CUSTOMER', 'GOOGLE'],
  ['Isabella Lee', 'isabella.lee@example.com', 'CUSTOMER', 'CUSTOM'],
  ['Mason Walker', 'mason.walker@example.com', 'CUSTOMER', 'CUSTOM'],
  ['Mia Hall', 'mia.hall@example.com', 'CUSTOMER', 'CUSTOM'],
  ['Ethan Allen', 'ethan.allen@example.com', 'CUSTOMER', 'CUSTOM'],
  ['Amelia Young', 'amelia.young@example.com', 'CUSTOMER', 'FACEBOOK'],
  ['James King', 'james.king@example.com', 'CUSTOMER', 'CUSTOM'],
  ['Harper Wright', 'harper.wright@example.com', 'CUSTOMER', 'CUSTOM'],
  ['Benjamin Scott', 'benjamin.scott@example.com', 'CUSTOMER', 'CUSTOM'],
  ['Evelyn Green', 'evelyn.green@example.com', 'CUSTOMER', 'CUSTOM'],
  ['Alexander Baker', 'alexander.baker@example.com', 'CUSTOMER', 'CUSTOM'],
  ['Abigail Adams', 'abigail.adams@example.com', 'CUSTOMER', 'CUSTOM'],
  ['Daniel Nelson', 'daniel.nelson@example.com', 'CUSTOMER', 'CUSTOM'],
];

const users = userSeeds.map(([name, email, userType, registrationMethod], i) => {
  const createdAt = new Date(
    Date.now() - (i + 1) * 24 * 60 * 60 * 1000 * 3
  ).toISOString();
  return {
    _id: id('user'),
    __typename: 'User',
    name,
    email,
    emailIsVerified: true,
    phone: `+1 555 010${String(i).padStart(2, '0')}`,
    phoneIsVerified: true,
    isActive: i % 7 !== 0,
    status: i % 7 === 0 ? 'BLOCKED' : 'ACTIVE',
    lastLogin: createdAt,
    registrationMethod,
    isOrderNotification: true,
    isOfferNotification: i % 3 === 0,
    createdAt,
    updatedAt: createdAt,
    notificationToken: `nt_${i}`,
    userType,
    favourite: i % 2 === 0 ? ['rest_1001', 'rest_1002'] : [],
    addresses: [
      {
        _id: id('addr'),
        deliveryAddress: `221B Baker Street, London`,
        details: `Flat ${i + 1}`,
        label: 'Home',
        selected: true,
        location: { coordinates: [-0.1583, 51.5236] },
      },
    ],
    notes: i % 5 === 0 ? 'VIP customer' : '',
    actions: 'VIEW',
  };
});

// ---------------------------------------------------------------------------
// Shop types
// ---------------------------------------------------------------------------
const shopTypes = [
  {
    _id: id('stype'),
    __typename: 'ShopType',
    name: 'Fast Food',
    description: 'Quick bites and fast food restaurants',
    image:
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600',
    isActive: true,
  },
  {
    _id: id('stype'),
    __typename: 'ShopType',
    name: 'Restaurant',
    description: 'Full service sit down restaurants',
    image:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600',
    isActive: true,
  },
  {
    _id: id('stype'),
    __typename: 'ShopType',
    name: 'Cafe',
    description: 'Coffee shops and bakeries',
    image:
      'https://images.unsplash.com/photo-1504753793650-d4a2b783c15e?w=600',
    isActive: true,
  },
  {
    _id: id('stype'),
    __typename: 'ShopType',
    name: 'Dessert',
    description: 'Ice cream, sweets and dessert parlours',
    image:
      'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600',
    isActive: false,
  },
];

// ---------------------------------------------------------------------------
// Cuisines
// ---------------------------------------------------------------------------
const cuisines = [
  ['Italian', 'Fast Food'],
  ['Chinese', 'Fast Food'],
  ['Mexican', 'Fast Food'],
  ['American', 'Restaurant'],
  ['Japanese', 'Restaurant'],
  ['Indian', 'Restaurant'],
  ['Thai', 'Restaurant'],
  ['Lebanese', 'Restaurant'],
  ['French', 'Cafe'],
  ['Turkish', 'Restaurant'],
].map(([name, shopType]) => ({
  _id: id('cuisine'),
  __typename: 'Cuisine',
  name,
  description: `Authentic ${name} dishes`,
  image: `https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600`,
  shopType,
}));

// ---------------------------------------------------------------------------
// Vendors (owner accounts that own restaurants)
// ---------------------------------------------------------------------------
const vendors = [
  {
    _id: id('vendor'),
    unique_id: 'VEN-1001',
    __typename: 'Vendor',
    name: 'John Carter',
    firstName: 'John',
    lastName: 'Carter',
    email: 'vendor@enatega.com',
    phoneNumber: '+1 555 010 900',
    userType: 'VENDOR',
    isActive: true,
    image: 'https://i.pravatar.cc/150?img=12',
    username: 'vendor@enatega.com',
    address: '120 King Street, Manchester',
    restaurants: [],
  },
  {
    _id: id('vendor'),
    unique_id: 'VEN-1002',
    __typename: 'Vendor',
    name: 'Sarah Mitchell',
    firstName: 'Sarah',
    lastName: 'Mitchell',
    email: 'sarah.vendor@enatega.com',
    phoneNumber: '+1 555 010 901',
    userType: 'VENDOR',
    isActive: true,
    image: 'https://i.pravatar.cc/150?img=32',
    username: 'sarah.vendor@enatega.com',
    address: '45 Queens Road, Liverpool',
    restaurants: [],
  },
  {
    _id: id('vendor'),
    unique_id: 'VEN-1003',
    __typename: 'Vendor',
    name: 'David Chen',
    firstName: 'David',
    lastName: 'Chen',
    email: 'david.vendor@enatega.com',
    phoneNumber: '+1 555 010 902',
    userType: 'VENDOR',
    isActive: true,
    image: 'https://i.pravatar.cc/150?img=15',
    username: 'david.vendor@enatega.com',
    address: '88 Market Street, Birmingham',
    restaurants: [],
  },
];

// ---------------------------------------------------------------------------
// Restaurants / Stores
// ---------------------------------------------------------------------------
const restaurantNames = [
  'Burger Bros',
  'Pizza Paradise',
  'Sushi Sams',
  'Taco Temple',
  'Noodle Nation',
  'Curry House',
  'Pasta Palace',
  'Green Garden Cafe',
  'Sweet Tooth',
  'Golden Dragon',
  'The Grill Spot',
  'Ocean Fish Bar',
];

const restaurants = restaurantNames.map((name, i) => {
  const owner = vendors[i % vendors.length];
  const restaurant = {
    _id: id('rest'),
    __typename: 'Restaurant',
    unique_restaurant_id: `REST-${String(i + 1).padStart(4, '0')}`,
    name,
    orderPrefix: `R${i + 1}`,
    orderId: 100 + i,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    image: `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&i=${i}`,
    logo: `https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&i=${i}`,
    address: `${100 + i * 3} High Street, City Centre`,
    city: 'Manchester',
    postCode: `M${1 + i} 4AA`,
    phone: `+1 555 011 ${String(i).padStart(3, '0')}`,
    username: `store${i + 1}@enatega.com`,
    password: 'Store@123',
    deliveryTime: 15 + (i % 4) * 10,
    minimumOrder: 5 + i,
    tax: 0.08,
    commissionRate: 0.15 + (i % 3) * 0.05,
    isActive: true,
    isAvailable: true,
    stripeDetailsSubmitted: i % 3 !== 0,
    rating: Math.round((3.5 + (i % 5) * 0.3) * 10) / 10,
    reviewAverage: Math.round((3.2 + (i % 4) * 0.4) * 10) / 10,
    shopType: shopTypes[i % shopTypes.length].name,
    cuisines: [cuisines[i % cuisines.length].name],
    owner: { _id: owner._id, email: owner.email, isActive: true },
    location: { coordinates: [-0.13 + i * 0.01, 51.5 + i * 0.002] },
    deliveryBounds: {
      coordinates: [
        [
          [-0.2, 51.45],
          [-0.1, 51.45],
          [-0.1, 51.55],
          [-0.2, 51.55],
        ],
      ],
    },
    deliveryInfo: { minDeliveryFee: 1.5, deliveryFee: 2.5 + i * 0.25, deliveryDistance: 8 },
    openingTimes: DAYS.map((day) => ({
      day,
      times: [{ startTime: ['09:00'], endTime: ['22:00'] }],
    })),
  };
  owner.restaurants.push({ _id: restaurant._id });
  return restaurant;
});

// ---------------------------------------------------------------------------
// Riders
// ---------------------------------------------------------------------------
const riderNames = [
  ['Omar Farouk', 'omar_farouk'],
  ['Carlos Diaz', 'carlos_diaz'],
  ['Priya Patel', 'priya_patel'],
  ['Tom Becker', 'tom_becker'],
  ['Hannah Lee', 'hannah_lee'],
  ['Marcus Reed', 'marcus_reed'],
  ['Aisha Khan', 'aisha_khan'],
  ['Diego Ramos', 'diego_ramos'],
  ['Nina Volkov', 'nina_volkov'],
  ['Sam Okafor', 'sam_okafor'],
];

const riders = riderNames.map(([name, username], i) => ({
  _id: id('rider'),
  __typename: 'Rider',
  name,
  username,
  email: `${username}@enatega.com`,
  phone: `+1 555 012 ${String(i).padStart(3, '0')}`,
  image: `https://i.pravatar.cc/150?img=${50 + i}`,
  available: i % 4 !== 0,
  isActive: i % 6 !== 0,
  vehicleType: i % 2 === 0 ? 'Motorcycle' : 'Bicycle',
  accountNumber: `ACC-${1000 + i}`,
  currentWalletAmount: 120 + i * 25,
  totalWalletAmount: 500 + i * 90,
  withdrawnWalletAmount: 380 + i * 65,
  zone: { _id: id('zone'), title: 'Central London' },
  assigned: i % 3 === 0 ? [restaurants[i % restaurants.length]._id] : [],
  bussinessDetails: {
    bankName: 'Bank of England',
    accountName: name,
    accountCode: '20-00-0' + i,
    accountNumber: `1234567${i}`,
    businessRegNo: `BR${10000 + i}`,
    companyRegNo: `CR${20000 + i}`,
    taxRate: 0.2,
  },
  licenseDetails: {
    number: `DL-${5000 + i}`,
    expiryDate: '2027-12-31T00:00:00Z',
    image: 'https://i.pravatar.cc/300?img=60',
  },
  vehicleDetails: {
    number: `VEH-${7000 + i}`,
    image: 'https://i.pravatar.cc/300?img=61',
  },
  createdAt: new Date(Date.now() - i * 30 * 86400000).toISOString(),
  updatedAt: new Date(Date.now() - i * 30 * 86400000).toISOString(),
}));

// ---------------------------------------------------------------------------
// Zones
// ---------------------------------------------------------------------------
const zones = [
  { title: 'Central London', description: 'Coverage for central London boroughs' },
  { title: 'North Manchester', description: 'North side of Manchester' },
  { title: 'Birmingham City', description: 'Birmingham city centre zone' },
  { title: 'Liverpool Docks', description: 'Waterfront delivery area' },
  { title: 'Glasgow South', description: 'South Glasgow district' },
].map(({ title, description }, i) => ({
  _id: id('zone'),
  __typename: 'Zone',
  title,
  description,
  isActive: i % 4 !== 0,
  location: {
    type: 'Polygon',
    coordinates: [
      [
        [-0.2 + i * 0.02, 51.45 + i * 0.01],
        [-0.1 + i * 0.02, 51.45 + i * 0.01],
        [-0.1 + i * 0.02, 51.55 + i * 0.01],
        [-0.2 + i * 0.02, 51.55 + i * 0.01],
        [-0.2 + i * 0.02, 51.45 + i * 0.01],
      ],
    ],
  },
  tax: 0.08,
}));

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------
const couponTitles = ['WELCOME10', 'SUMMER25', 'FREEDELIVERY', 'SPICY50', 'MIDNIGHT20', 'FIRSTORDER'];
const coupons = couponTitles.map((title, i) => ({
  _id: id('coupon'),
  __typename: 'Coupon',
  title,
  discount: [10, 25, 15, 50, 20, 5][i],
  enabled: i % 4 !== 0,
  lifeTimeActive: i === 0,
  startDate: new Date(Date.now() - i * 10 * 86400000).toISOString(),
  endDate: new Date(Date.now() + (30 - i) * 86400000).toISOString(),
  __typename: 'Coupon',
}));

// ---------------------------------------------------------------------------
// Banners
// ---------------------------------------------------------------------------
const banners = [
  { title: 'Grand Opening Sale', screen: 'HOME' },
  { title: '50% off first order', screen: 'RESTAURANT_DETAIL' },
  { title: 'Free delivery weekend', screen: 'ALL_RESTAURANTS' },
  { title: 'New desserts available', screen: 'RESTAURANT_DETAIL' },
].map(({ title, screen }, i) => ({
  _id: id('banner'),
  __typename: 'Banner',
  title,
  description: 'Promotional banner for the Enatega marketplace',
  action: 'navigate',
  screen,
  file: `https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=1200&b=${i}`,
  parameters: i % 2 === 0 ? '' : 'restaurant',
}));

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
const notifications = [
  'New store added to the platform',
  'Maintenance window scheduled',
  'Payment gateway updated',
  'New rider joined the fleet',
  'Coupon campaign is live',
  'System security patch applied',
  'Sales report available',
  'Weekly digest ready',
].map((title, i) => ({
  _id: id('notif'),
  __typename: 'Notification',
  title,
  body: 'This is a sample push notification body used for mock testing.',
  image: '',
  notificationType: 'ADMIN',
  data: { screen: 'HOME' },
  createdAt: new Date(Date.now() - i * 12 * 3600000).toISOString(),
}));

// ---------------------------------------------------------------------------
// Tipping
// ---------------------------------------------------------------------------
const tipping = {
  _id: id('tips'),
  __typename: 'Tipping',
  tipVariations: [5, 10, 15],
  enabled: true,
};

// ---------------------------------------------------------------------------
// Items (used inside orders)
// ---------------------------------------------------------------------------
const itemTitles = [
  'Classic Cheeseburger',
  'Pepperoni Pizza',
  'Chicken Katsu Curry',
  'Beef Tacos',
  'Vegetable Fried Rice',
  'Butter Chicken',
  'Spaghetti Carbonara',
  'Avocado Toast',
  'Chocolate Sundae',
  'Kung Pao Chicken',
  'Ribeye Steak',
  'Grilled Salmon',
];

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
const orderStatuses = [
  'PENDING',
  'ACCEPTED',
  'ASSIGNED',
  'PICKED',
  'ARRIVED',
  'DELIVERED',
  'CANCELLED',
];

const orders = Array.from({ length: 42 }, (_, i) => {
  const restaurant = restaurants[i % restaurants.length];
  const user = users[(i + 2) % users.length];
  const rider = i % 4 === 0 ? riders[i % riders.length] : null;
  const status = orderStatuses[i % orderStatuses.length];
  const createdAt = new Date(
    Date.now() - (i + 1) * 8 * 3600000
  ).toISOString();

  const item = {
    _id: id('item'),
    title: itemTitles[i % itemTitles.length],
    description: 'Freshly prepared with quality ingredients',
    quantity: 1 + (i % 3),
    image: restaurant.image,
    specialInstructions: i % 4 === 0 ? 'No onions please' : '',
    variation: { _id: id('var'), title: 'Regular', price: 8 + (i % 6) },
    addons: [
      {
        _id: id('addon'),
        title: 'Extra Cheese',
        options: [{ _id: id('opt'), title: 'Cheese', price: 1.5 }],
      },
    ],
  };

  return {
    _id: id('order'),
    __typename: 'Order',
    orderId: `ORD-${String(20260000 + i)}`,
    orderAmount: 12 + (i % 40) + (i % 3),
    deliveryCharges: 2.5,
    taxationAmount: 1.2,
    orderStatus: status,
    paymentMethod: ['COD', 'STRIPE', 'PAYPAL'][i % 3],
    orderType: i % 3 === 0 ? 'PICKUP' : 'DELIVERY',
    createdAt,
    updatedAt: createdAt,
    deliveryAddress: {
      deliveryAddress: user.addresses[0].deliveryAddress,
      details: user.addresses[0].details,
      label: user.addresses[0].label,
      location: { coordinates: [-0.14 + i * 0.001, 51.5 + i * 0.001] },
    },
    items: [item],
    restaurant: { _id: restaurant._id, name: restaurant.name },
    user: { _id: user._id, name: user.name, email: user.email, phone: user.phone },
    rider: rider
      ? { _id: rider._id, name: rider.name, username: rider.username, phone: rider.phone }
      : null,
    unique_restaurant_id: restaurant.unique_restaurant_id,
    orderDeliveredAt: status === 'DELIVERED' ? createdAt : null,
  };
});

// ---------------------------------------------------------------------------
// Withdraw requests
// ---------------------------------------------------------------------------
const withdrawRequests = Array.from({ length: 8 }, (_, i) => ({
  _id: id('wdr'),
  __typename: 'WithdrawRequest',
  requestId: `WR-${String(1000 + i)}`,
  requestAmount: 150 + i * 75,
  requestTime: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
  status: ['REQUESTED', 'TRANSFERRED', 'CANCELLED'][i % 3],
  createdAt: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
  rider: i % 2 === 0
    ? riders[i % riders.length]
    : undefined,
  store: i % 2 === 1
    ? {
        unique_restaurant_id: restaurants[i % restaurants.length].unique_restaurant_id,
        _id: restaurants[i % restaurants.length]._id,
        image: restaurants[i % restaurants.length].image,
        logo: restaurants[i % restaurants.length].logo,
        address: restaurants[i % restaurants.length].address,
        username: restaurants[i % restaurants.length].username,
        password: restaurants[i % restaurants.length].password,
        slug: restaurants[i % restaurants.length].slug,
        stripeDetailsSubmitted: true,
        commissionRate: 0.15,
        bussinessDetails: {
          bankName: 'Barclays',
          accountName: restaurants[i % restaurants.length].name,
          accountCode: '20-12-0' + i,
          accountNumber: `9876543${i}`,
          businessRegNo: `BR${30000 + i}`,
          companyRegNo: `CR${40000 + i}`,
          taxRate: 0.2,
        },
      }
    : undefined,
}));

// ---------------------------------------------------------------------------
// Earnings
// ---------------------------------------------------------------------------
const earnings = orders.slice(0, 20).map((order, i) => {
  const restaurant = order.restaurant;
  const rider = riders[i % riders.length];
  const store = restaurants.find((r) => r._id === restaurant._id);
  return {
    _id: id('earning'),
    __typename: 'Earning',
    orderId: order.orderId,
    orderType: order.orderType,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt,
    updatedAt: order.createdAt,
    platformEarnings: {
      marketplaceCommission: 2.1,
      deliveryCommission: 0.9,
      tax: 1.2,
      platformFee: 0.5,
      totalEarnings: 4.7,
    },
    riderEarnings: {
      riderId: { _id: rider._id, name: rider.name, username: rider.username },
      deliveryFee: 2.5,
      tip: 1.5,
      totalEarnings: 4.0,
    },
    storeEarnings: {
      storeId: { _id: store._id, name: store.name, username: store.username },
      orderAmount: order.orderAmount,
      totalEarnings: order.orderAmount,
    },
  };
});

// ---------------------------------------------------------------------------
// Transaction history
// ---------------------------------------------------------------------------
const transactions = Array.from({ length: 20 }, (_, i) => {
  const rider = i % 2 === 0 ? riders[i % riders.length] : undefined;
  const store = i % 2 === 1 ? restaurants[i % restaurants.length] : undefined;
  const amountTransferred = 100 + i * 45;
  return {
    _id: id('txn'),
    __typename: 'TransactionHistory',
    transactionId: `TXN-${String(5000 + i)}`,
    amountCurrency: 'USD',
    status: ['SUCCESS', 'PENDING', 'FAILED'][i % 3],
    userType: i % 2 === 0 ? 'RIDER' : 'STORE',
    userId: rider ? rider._id : store._id,
    amountTransferred,
    createdAt: new Date(Date.now() - (i + 1) * 2 * 86400000).toISOString(),
    toBank: {
      accountName: (rider || store).name,
      bankName: 'Barclays',
      accountNumber: `9876543${i}`,
      accountCode: '20-12-34',
    },
    rider: rider
      ? {
          _id: rider._id,
          name: rider.name,
          email: rider.email,
          username: rider.username,
          phone: rider.phone,
          available: rider.available,
          isActive: rider.isActive,
          accountNumber: rider.accountNumber,
          currentWalletAmount: rider.currentWalletAmount,
          totalWalletAmount: rider.totalWalletAmount,
          withdrawnWalletAmount: rider.withdrawnWalletAmount,
          createdAt: rider.createdAt,
          updatedAt: rider.updatedAt,
        }
      : undefined,
    store: store
      ? {
          _id: store._id,
          unique_restaurant_id: store.unique_restaurant_id,
          name: store.name,
          rating: store.rating,
          reviewAverage: store.reviewAverage,
          isActive: store.isActive,
          isAvailable: store.isAvailable,
          slug: store.slug,
          stripeDetailsSubmitted: store.stripeDetailsSubmitted,
          phone: store.phone,
          city: store.city,
          postCode: store.postCode,
          address: store.address,
        }
      : undefined,
  };
});

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------
const staff = [
  ['Admin Support', 'support@enatega.com'],
  ['Finance Officer', 'finance@enatega.com'],
  ['Ops Manager', 'ops@enatega.com'],
  ['Marketing Lead', 'marketing@enatega.com'],
  ['Content Editor', 'content@enatega.com'],
  ['Compliance Officer', 'compliance@enatega.com'],
].map(([name, email], i) => ({
  _id: id('staff'),
  __typename: 'Staff',
  name,
  email,
  phone: 5550000000 + i,
  isActive: i % 5 !== 0,
  permissions: i % 2 === 0 ? ['orders', 'users', 'vendors'] : ['orders'],
}));

// ---------------------------------------------------------------------------
// Support tickets + messages
// ---------------------------------------------------------------------------
const supportUsers = [
  { _id: 'support_user_1', name: 'Michael Torres', email: 'michael.torres@example.com', phone: '+1 555 013 001' },
  { _id: 'support_user_2', name: 'Grace Kim', email: 'grace.kim@example.com', phone: '+1 555 013 002' },
  { _id: 'support_user_3', name: 'Hassan Ali', email: 'hassan.ali@example.com', phone: '+1 555 013 003' },
  { _id: 'support_user_4', name: 'Fatima Noor', email: 'fatima.noor@example.com', phone: '+1 555 013 004' },
  { _id: 'support_user_5', name: 'Ryan Cooper', email: 'ryan.cooper@example.com', phone: '+1 555 013 005' },
];

const ticketSeed = [
  ['Order not delivered', 'My order ORD-20260005 has not arrived yet.', 'DELIVERY_ISSUE', 'REFUND'],
  ['Wrong items received', 'I received an incorrect item in my order.', 'WRONG_ITEM', 'REPLACEMENT'],
  ['Payment charged twice', 'My card was charged twice for one order.', 'PAYMENT', 'REFUND'],
  ['Refund status enquiry', 'When will my refund be processed?', 'REFUND', 'REFUND'],
  ['Restaurant closed', 'The restaurant was closed at pickup time.', 'RESTAURANT', 'OTHER'],
];

let supportTickets = [];
let supportMessages = [];
ticketSeed.forEach(([title, description, category], i) => {
  const user = supportUsers[i % supportUsers.length];
  const ticketId = id('ticket');
  const createdAt = Date.now() - (i + 1) * 5 * 3600000;
  const status = i % 3 === 0 ? 'OPEN' : i % 3 === 1 ? 'IN_PROGRESS' : 'CLOSED';

  supportTickets.push({
    _id: ticketId,
    title,
    description,
    status,
    category,
    orderId: `ORD-${String(20260000 + i)}`,
    otherDetails: 'N/A',
    user,
    createdAt: String(createdAt),
    updatedAt: String(createdAt),
    lastMessageAt: String(createdAt + 3600000),
  });

  supportMessages.push({
    _id: id('msg'),
    __typename: 'Message',
    content: description,
    from: 'USER',
    createdAt: String(createdAt),
    user,
  });
  supportMessages.push({
    _id: id('msg'),
    __typename: 'Message',
    content: 'Thanks for reaching out. Our support team is looking into this and will get back to you shortly.',
    from: 'ADMIN',
    createdAt: String(createdAt + 3600000),
    user: {
      _id: 'admin_1',
      name: 'Enatega Support',
      email: 'admin@enatega.com',
    },
  });
});

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const configuration = {
  _id: id('config'),
  __typename: 'Configuration',
  currency: 'USD',
  currencySymbol: '$',
  deliveryRate: 2.5,
  costType: 'FIXED',
  webAmplitudeApiKey: 'amplitude_web_key',
  appAmplitudeApiKey: 'amplitude_app_key',
  publishableKey: 'pk_test_mock',
  customerAppVersion: { code: '1.0.0', name: '1.0.0' },
  riderAppVersion: { code: '1.0.0', name: '1.0.0' },
  restaurantAppVersion: { code: '1.0.0', name: '1.0.0' },
  cloudinaryUploadUrl: 'https://api.cloudinary.com/v1_1/demo/image/upload',
  cloudinaryApiKey: 'cloudinary_key',
  firebaseKey: 'mock-firebase-key',
  authDomain: 'mock.firebaseapp.com',
  projectId: 'mock-project',
  storageBucket: 'mock-project.appspot.com',
  msgSenderId: '1234567890',
  appId: '1:1234567890:web:mock',
  measurementId: 'G-MOCK123',
  vapidKey: 'vapid_mock',
  googleMapsApiKey: 'google_maps_mock_key',
  webClientID: 'web_client_id',
  androidClientID: 'android_client_id',
  iOSClientID: 'ios_client_id',
  expoClientID: 'expo_client_id',
  email: 'noreply@enatega.com',
  emailName: 'Enatega',
  enableEmail: true,
  paypalClientId: 'paypal_client_id',
  paypalSandbox: true,
  sentryDashboardUrl: 'https://sentry.io/dashboard',
  sentryWebUrl: 'https://sentry.io/web',
  sentryApiUrl: 'https://sentry.io/api',
  sentryCustomerAppUrl: 'https://sentry.io/customer',
  sentryRestaurantAppUrl: 'https://sentry.io/restaurant',
  sentryRiderAppUrl: 'https://sentry.io/rider',
  twilioAccountSid: 'twilio_account_sid',
  twilioPhoneNumber: '+15550109999',
  twilioEnabled: true,
  twilioWhatsAppNumber: '+15550109998',
  skipEmailVerification: true,
  skipMobileVerification: true,
  skipWhatsAppOTP: true,
  webGlobal: {},
};

// ---------------------------------------------------------------------------
// Database facade
// ---------------------------------------------------------------------------
function createDatabase() {
  return {
    users,
    vendors,
    restaurants,
    riders,
    zones,
    coupons,
    banners,
    cuisines,
    shopTypes,
    notifications,
    tipping,
    withdrawRequests,
    orders,
    earnings,
    transactions,
    staff,
    supportUsers,
    supportTickets,
    supportMessages,
    configuration,
  };
}

module.exports = {
  createDatabase,
  // re-exports used by server.js tests / debugging
  orders,
  users,
};
