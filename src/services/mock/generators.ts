/**
 * Explicit demo generators for feature surfaces the bundled mock REST server
 * does not implement yet (catalog/sector/review/dispute/admin surfaces).
 *
 * These are DEMO data only and are exclusively reachable when
 * VITE_USE_MOCKS=true. Production code paths never touch this module.
 */
import type { Category, Dispute, Review, Sector } from '@/types/catalog';
import type { AdminAccount } from '@/types/admin';
import type { WebNotification } from '@/types/notification';

export interface DemoData {
  sectors: Sector[];
  categories: Category[];
  reviews: Review[];
  disputes: Dispute[];
  admins: AdminAccount[];
  notifications: WebNotification[];
}

const DAY_MS = 24 * 60 * 60 * 1000;
const iso = (daysAgo: number): string =>
  new Date(Date.now() - daysAgo * DAY_MS).toISOString();

export const demoData: DemoData = {
  sectors: [
    { id: 'sec_food', name: 'Food & Beverage', code: 'food', status: 'ACTIVE', description: 'Restaurants, cafes and food delivery' },
    { id: 'sec_grocery', name: 'Grocery', code: 'grocery', status: 'ACTIVE', description: 'Supermarkets and daily goods' },
    { id: 'sec_pharmacy', name: 'Pharmacy', code: 'pharmacy', status: 'ACTIVE', description: 'Pharmacies and health products' },
    { id: 'sec_fashion', name: 'Fashion', code: 'fashion', status: 'ACTIVE', description: 'Clothing and accessories' },
    { id: 'sec_retail', name: 'Retail', code: 'retail', status: 'ACTIVE', description: 'General retail shops' },
  ],
  categories: [
    { id: 'cat_1', title: 'Fruits & Vegetables', sector: 'sec_grocery', isActive: true, createdAt: iso(60) },
    { id: 'cat_2', title: 'Dairy & Eggs', sector: 'sec_grocery', isActive: true, createdAt: iso(54) },
    { id: 'cat_3', title: 'Bakery & Pastry', sector: 'sec_food', isActive: true, createdAt: iso(40) },
    { id: 'cat_4', title: 'Hot Meals', sector: 'sec_food', isActive: true, createdAt: iso(35) },
    { id: 'cat_5', title: 'Medicines', sector: 'sec_pharmacy', isActive: true, createdAt: iso(28) },
    { id: 'cat_6', title: "Men's Apparel", sector: 'sec_fashion', isActive: true, createdAt: iso(22) },
  ],
  reviews: [
    { id: 'rev_1', storeId: 'rest_1', storeName: 'Ariiti Pizzeria', orderId: 'ORD-20260001', rating: 5, description: 'Amazing food, quick delivery!', status: 'PENDING', createdAt: iso(1), isPublished: false },
    { id: 'rev_2', storeId: 'rest_2', storeName: 'Golden Grill House', orderId: 'ORD-20260002', rating: 4, description: 'Tasty but a bit slow.', status: 'PENDING', createdAt: iso(2), isPublished: false },
    { id: 'rev_3', storeId: 'rest_3', storeName: 'Spice Garden', orderId: 'ORD-20260003', rating: 3, description: 'Average experience.', status: 'APPROVED', createdAt: iso(4), isPublished: true },
  ],
  disputes: [
    { id: 'dsp_1', subject: 'Order never arrived', description: 'Customer reported the order was not delivered although it shows delivered.', orderId: 'ORD-20260001', reportedBy: { id: 'user_1001', name: 'Ava Johnson' }, status: 'OPEN', priority: 'HIGH', createdAt: iso(0) },
    { id: 'dsp_2', subject: 'Wrong items received', description: 'Customer received items different from the order.', orderId: 'ORD-20260005', reportedBy: { id: 'user_1002', name: 'Liam Smith' }, status: 'IN_PROGRESS', priority: 'MEDIUM', createdAt: iso(1) },
    { id: 'dsp_3', subject: 'Charged twice', description: 'Duplicate charge on the payment method.', orderId: 'ORD-20260009', reportedBy: { id: 'user_1003', name: 'Emma Wilson' }, status: 'OPEN', priority: 'HIGH', createdAt: iso(2) },
    { id: 'dsp_4', subject: 'Refund not processed', description: 'Refund requested 5 days ago.', orderId: 'ORD-20260011', reportedBy: { id: 'user_1004', name: 'Noah Brown' }, status: 'RESOLVED', priority: 'MEDIUM', createdAt: iso(5) },
  ],
  admins: [
    { id: 'admin_1', name: 'Ariiti Market Super Admin', email: 'admin@aritii.com', role: 'SUPER_ADMIN', status: 'ACTIVE', sectors: ['sec_food', 'sec_grocery', 'sec_pharmacy', 'sec_fashion', 'sec_retail'], createdAt: iso(200) },
    { id: 'admin_2', name: 'Dawit Bekele', email: 'dawit@aritii.com', role: 'RIDER_ADMIN', status: 'ACTIVE', sectors: ['sec_food'], createdAt: iso(90) },
    { id: 'admin_3', name: 'Hanna Tadesse', email: 'hanna@aritii.com', role: 'SELLER_ADMIN', status: 'ACTIVE', sectors: ['sec_grocery', 'sec_food'], createdAt: iso(80) },
    { id: 'admin_4', name: 'Samuel Girma', email: 'samuel@aritii.com', role: 'CUSTOMER_ADMIN', status: 'INACTIVE', sectors: ['sec_food'], createdAt: iso(40) },
  ],
  notifications: [
    { id: 'ntf_1', title: 'New store pending approval', body: 'Golden Grill House submitted onboarding details.', isRead: false, createdAt: iso(0) },
    { id: 'ntf_2', title: 'Dispute raised', body: 'Order ORD-20260001 — Order never arrived.', isRead: false, createdAt: iso(0) },
    { id: 'ntf_3', title: 'Rider payout processed', body: 'Weekly rider earnings payout completed.', isRead: true, createdAt: iso(1) },
  ],
};