import React, { lazy } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { RoleRoute } from '@/routes/RoleRoute';
import { PageLoader } from '@/components/common/PageLoader';
import type { AdminRole } from '@/types/auth';

// Auth
import { LoginPage } from '@/pages/LoginPage';

// Static error pages
import { ForbiddenPage } from '@/pages/ForbiddenPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

// Lazy feature pages
const HomePage = lazy(() =>
  import('@/pages/dashboard/HomePage').then((m) => ({ default: m.AdminDashboardPage }))
);
const UsersPage = lazy(() =>
  import('@/pages/users/UsersPage').then((m) => ({ default: m.UsersManagementPage }))
);
const UserDetailPage = lazy(() =>
  import('@/pages/users/UserDetailPage').then((m) => ({
    default: m.UserDetailPage,
  }))
);
const SellersPage = lazy(() =>
  import('@/pages/sellers/SellersPage').then((m) => ({
    default: m.SellersManagementPage,
  }))
);
const SellerDetailPage = lazy(() =>
  import('@/pages/sellers/SellerDetailPage').then((m) => ({
    default: m.SellerDetailPage,
  }))
);
const BusinessesPage = lazy(() =>
  import('@/pages/businesses/BusinessesPage').then((m) => ({
    default: m.BusinessesManagementPage,
  }))
);
const BusinessDetailPage = lazy(() =>
  import('@/pages/businesses/BusinessDetailPage').then((m) => ({
    default: m.BusinessDetailPage,
  }))
);
const StoresPage = lazy(() =>
  import('@/pages/stores/StoresPage').then((m) => ({ default: m.StoresManagementPage }))
);
const StoresPendingPage = lazy(() =>
  import('@/pages/stores/StoresPendingPage').then((m) => ({
    default: m.StoresPendingPage,
  }))
);
const StoreDetailPage = lazy(() =>
  import('@/pages/stores/StoreDetailPage').then((m) => ({
    default: m.StoreDetailPage,
  }))
);
const RidersPage = lazy(() =>
  import('@/pages/riders/RidersPage').then((m) => ({ default: m.RidersManagementPage }))
);
const RidersPendingPage = lazy(() =>
  import('@/pages/riders/RidersPendingPage').then((m) => ({
    default: m.RidersPendingPage,
  }))
);
const RiderDetailPage = lazy(() =>
  import('@/pages/riders/RiderDetailPage').then((m) => ({
    default: m.RiderDetailPage,
  }))
);
const CustomersPage = lazy(() =>
  import('@/pages/customers/CustomersPage').then((m) => ({
    default: m.CustomersManagementPage,
  }))
);
const CustomerDetailPage = lazy(() =>
  import('@/pages/customers/CustomerDetailPage').then((m) => ({
    default: m.CustomerDetailPage,
  }))
);
const DisputesPage = lazy(() =>
  import('@/pages/disputes/DisputesPage').then((m) => ({
    default: m.DisputesManagementPage,
  }))
);
const AdminsPage = lazy(() =>
  import('@/pages/admins/AdminsPage').then((m) => ({ default: m.AdminsManagementPage }))
);
const AdminNewPage = lazy(() =>
  import('@/pages/admins/AdminNewPage').then((m) => ({
    default: m.AdminNewPage,
  }))
);
const AdminDetailPage = lazy(() =>
  import('@/pages/admins/AdminDetailPage').then((m) => ({
    default: m.AdminDetailPage,
  }))
);
const AdminRolesPage = lazy(() =>
  import('@/pages/admins/AdminRolesPage').then((m) => ({
    default: m.AdminRolesPage,
  }))
);
const CategoriesPage = lazy(() =>
  import('@/pages/catalog/CategoriesPage').then((m) => ({
    default: m.CategoriesPage,
  }))
);
const SectorsPage = lazy(() =>
  import('@/pages/catalog/SectorsPage').then((m) => ({
    default: m.SectorsPage,
  }))
);
const PendingReviewsPage = lazy(() =>
  import('@/pages/catalog/PendingReviewsPage').then((m) => ({
    default: m.PendingReviewsPage,
  }))
);
const OrdersPage = lazy(() =>
  import('@/pages/orders/OrdersPage').then((m) => ({ default: m.OrdersMonitoringPage }))
);

// Platform Admin Control Center — explorer, live operations, hierarchy growth
const PlatformExplorerPage = lazy(() =>
  import('@/pages/explorer/PlatformExplorerPage').then((m) => ({ default: m.PlatformExplorerPage }))
);
const OperationsPage = lazy(() =>
  import('@/pages/operations/OperationsPage').then((m) => ({ default: m.OperationsPage }))
);
const GrowthByHierarchyPage = lazy(() =>
  import('@/pages/analytics/GrowthByHierarchyPage').then((m) => ({ default: m.GrowthByHierarchyPage }))
);
const OrderDetailPage = lazy(() =>
  import('@/pages/orders/OrderDetailPage').then((m) => ({
    default: m.OrderDetailPage,
  }))
);
const AnalyticsPage = lazy(() =>
  import('@/pages/analytics/AnalyticsPage').then((m) => ({
    default: m.GrowthAnalyticsPage,
  }))
);
const CommerceOverviewPage = lazy(() =>
  import('@/pages/commerce/CommerceOverviewPage').then((m) => ({
    default: m.CommerceDashboardPage,
  }))
);
const ProductsPage = lazy(() =>
  import('@/pages/commerce/ProductsPage').then((m) => ({
    default: m.ProductsPage,
  }))
);
const TransactionsPage = lazy(() =>
  import('@/pages/commerce/TransactionsPage').then((m) => ({
    default: m.TransactionsPage,
  }))
);
const PromotionsPage = lazy(() =>
  import('@/pages/commerce/PromotionsPage').then((m) => ({
    default: m.PromotionsPage,
  }))
);
const PlatformSettingsPage = lazy(() =>
  import('@/pages/settings/PlatformSettingsPage').then((m) => ({
    default: m.PlatformSettingsPage,
  }))
);
const NotificationsSettingsPage = lazy(() =>
  import('@/pages/settings/NotificationsSettingsPage').then((m) => ({
    default: m.NotificationsSettingsPage,
  }))
);
const SystemSettingsPage = lazy(() =>
  import('@/pages/settings/SystemSettingsPage').then((m) => ({
    default: m.SystemSettingsPage,
  }))
);
const LocationsPage = lazy(() =>
  import('@/pages/locations/LocationsPage').then((m) => ({
    default: m.LocationsManagementPage,
  }))
);
const LocationDetailPage = lazy(() =>
  import('@/pages/locations/LocationDetailPage').then((m) => ({
    default: m.LocationDetailPage,
  }))
);
const LocationCreatePage = lazy(() =>
  import('@/pages/locations/LocationCreatePage').then((m) => ({
    default: m.LocationCreatePage,
  }))
);
const LocationHierarchyPage = lazy(() =>
  import('@/pages/locations/LocationHierarchyPage').then((m) => ({
    default: m.LocationHierarchyPage,
  }))
);
const LocationDeliveryZonesPage = lazy(() =>
  import('@/pages/locations/LocationDeliveryZonesPage').then((m) => ({
    default: m.LocationDeliveryZonesPage,
  }))
);
const LocationBulkImportPage = lazy(() =>
  import('@/pages/locations/LocationBulkImportPage').then((m) => ({
    default: m.LocationBulkImportPage,
  }))
);
const ShopsAnalyticsPage = lazy(() =>
  import('@/pages/stores/ShopsAnalyticsPage').then((m) => ({
    default: m.ShopsAnalyticsPage,
  }))
);
const AuditLogsPage = lazy(() =>
  import('@/pages/audit/AuditLogsPage').then((m) => ({
    default: m.AdminAuditLogsPage,
  }))
);

// Delivery Module
const DeliveryOverviewPage = lazy(() =>
  import('@/pages/delivery/DeliveryOverviewPage').then((m) => ({
    default: m.DeliveryDashboardPage,
  }))
);
const DeliveryAssignmentsPage = lazy(() =>
  import('@/pages/delivery/DeliveryAssignmentsPage').then((m) => ({
    default: m.DeliveryAssignmentsPage,
  }))
);
const DeliveryZonesPage = lazy(() =>
  import('@/pages/delivery/DeliveryZonesPage').then((m) => ({
    default: m.DeliveryZonesPage,
  }))
);

// Role constants
const SUPER: AdminRole[] = ['SUPER_ADMIN'];
const SELLER: AdminRole[] = ['SUPER_ADMIN', 'SELLER_ADMIN'];
const RIDER: AdminRole[] = ['SUPER_ADMIN', 'RIDER_ADMIN'];
const CUSTOMER: AdminRole[] = ['SUPER_ADMIN', 'CUSTOMER_ADMIN'];

function Suspend({ children, roles }: { children: React.ReactElement; roles: AdminRole[] }) {
  return (
    <React.Suspense fallback={<PageLoader />}>
      <RoleRoute roles={roles}>{children}</RoleRoute>
    </React.Suspense>
  );
}

export function AppRoutes() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <AuthLayout />,
      children: [
        { index: true, element: <Navigate to="/login" replace /> },
        { path: 'login', element: <LoginPage /> },
      ],
    },
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <Navigate to="/home" replace /> },
        { path: 'home', element: <Suspend roles={SUPER}><HomePage /></Suspend> },
        // Platform Admin Control Center
        { path: 'explorer', element: <Suspend roles={SUPER}><PlatformExplorerPage /></Suspend> },
        { path: 'operations', element: <Suspend roles={SUPER}><OperationsPage /></Suspend> },
        { path: 'users', element: <Suspend roles={CUSTOMER}><UsersPage /></Suspend> },
        { path: 'users/:userId', element: <Suspend roles={CUSTOMER}><UserDetailPage /></Suspend> },
        { path: 'sellers', element: <Suspend roles={SELLER}><SellersPage /></Suspend> },
        { path: 'sellers/:sellerId', element: <Suspend roles={SELLER}><SellerDetailPage /></Suspend> },
        { path: 'businesses', element: <Suspend roles={SELLER}><BusinessesPage /></Suspend> },
        { path: 'businesses/:businessId', element: <Suspend roles={SELLER}><BusinessDetailPage /></Suspend> },
        { path: 'stores', element: <Suspend roles={SELLER}><StoresPage /></Suspend> },
        { path: 'stores/pending', element: <Suspend roles={SELLER}><StoresPendingPage /></Suspend> },
        { path: 'stores/:storeId', element: <Suspend roles={SELLER}><StoreDetailPage /></Suspend> },
        { path: 'locations', element: <Suspend roles={SUPER}><LocationsPage /></Suspend> },
        { path: 'locations/create', element: <Suspend roles={SUPER}><LocationCreatePage /></Suspend> },
        { path: 'locations/hierarchy', element: <Suspend roles={SUPER}><LocationHierarchyPage /></Suspend> },
        { path: 'locations/:locationId', element: <Suspend roles={SUPER}><LocationDetailPage /></Suspend> },
        { path: 'locations/:locationId/zones', element: <Suspend roles={SUPER}><LocationDeliveryZonesPage /></Suspend> },
        { path: 'locations/bulk/import', element: <Suspend roles={SUPER}><LocationBulkImportPage /></Suspend> },
        { path: 'stores/analytics', element: <Suspend roles={SELLER}><ShopsAnalyticsPage /></Suspend> },
        { path: 'riders', element: <Suspend roles={RIDER}><RidersPage /></Suspend> },
        { path: 'riders/pending', element: <Suspend roles={RIDER}><RidersPendingPage /></Suspend> },
        { path: 'riders/:riderId', element: <Suspend roles={RIDER}><RiderDetailPage /></Suspend> },
        { path: 'customers', element: <Suspend roles={CUSTOMER}><CustomersPage /></Suspend> },
        { path: 'customers/:customerId', element: <Suspend roles={CUSTOMER}><CustomerDetailPage /></Suspend> },
        { path: 'disputes', element: <Suspend roles={CUSTOMER}><DisputesPage /></Suspend> },
        { path: 'admins', element: <Suspend roles={SUPER}><AdminsPage /></Suspend> },
        { path: 'admins/new', element: <Suspend roles={SUPER}><AdminNewPage /></Suspend> },
        { path: 'admins/:adminId', element: <Suspend roles={SUPER}><AdminDetailPage /></Suspend> },
        { path: 'admin-roles', element: <Suspend roles={SUPER}><AdminRolesPage /></Suspend> },
        { path: 'categories', element: <Suspend roles={SELLER}><CategoriesPage /></Suspend> },
        { path: 'sectors', element: <Suspend roles={SUPER}><SectorsPage /></Suspend> },
        { path: 'reviews/pending', element: <Suspend roles={SELLER}><PendingReviewsPage /></Suspend> },
        { path: 'orders', element: <Suspend roles={SUPER}><OrdersPage /></Suspend> },
        { path: 'orders/:orderId', element: <Suspend roles={SUPER}><OrderDetailPage /></Suspend> },
        { path: 'analytics', element: <Suspend roles={CUSTOMER}><AnalyticsPage /></Suspend> },
        { path: 'analytics/growth', element: <Suspend roles={SUPER}><GrowthByHierarchyPage /></Suspend> },
        { path: 'audit-logs', element: <Suspend roles={SUPER}><AuditLogsPage /></Suspend> },
        { path: 'settings/platform', element: <Suspend roles={SUPER}><PlatformSettingsPage /></Suspend> },
        { path: 'settings/notifications', element: <Suspend roles={SUPER}><NotificationsSettingsPage /></Suspend> },
        { path: 'settings/system', element: <Suspend roles={SUPER}><SystemSettingsPage /></Suspend> },
        { path: 'commerce', element: <Suspend roles={SUPER}><CommerceOverviewPage /></Suspend> },
        { path: 'commerce/products', element: <Suspend roles={SUPER}><ProductsPage /></Suspend> },
        { path: 'commerce/transactions', element: <Suspend roles={SUPER}><TransactionsPage /></Suspend> },
        { path: 'commerce/promotions', element: <Suspend roles={SUPER}><PromotionsPage /></Suspend> },
        
        // Delivery Module Routes
        { path: 'delivery', element: <Suspend roles={RIDER}><DeliveryOverviewPage /></Suspend> },
        { path: 'delivery/assignments', element: <Suspend roles={RIDER}><DeliveryAssignmentsPage /></Suspend> },
        { path: 'delivery/zones', element: <Suspend roles={RIDER}><DeliveryZonesPage /></Suspend> },
      ],
    },
    { path: '/forbidden', element: <ForbiddenPage /> },
    { path: '*', element: <NotFoundPage /> },
  ]);

  return <RouterProvider router={router} />;
}