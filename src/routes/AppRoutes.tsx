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
import { USERS_TAB_ROLES } from '@/pages/users/usersTabs';

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
const RiderDetailPage = lazy(() =>
  import('@/pages/riders/RiderDetailPage').then((m) => ({
    default: m.RiderDetailPage,
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
// Request Management — buyer → seller negotiation pipeline
const RequestsPage = lazy(() =>
  import('@/pages/requests/RequestsPage').then((m) => ({
    default: m.RequestsManagementPage,
  }))
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
const PendingReviewsPage = lazy(() =>
  import('@/pages/catalog/PendingReviewsPage').then((m) => ({
    default: m.PendingReviewsPage,
  }))
);
const OrdersPage = lazy(() =>
  import('@/pages/orders/OrdersPage').then((m) => ({ default: m.OrdersMonitoringPage }))
);

// Platform Admin Control Center — live operations
const OperationsPage = lazy(() =>
  import('@/pages/operations/OperationsPage').then((m) => ({ default: m.OperationsPage }))
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
const DeliveryLogisticsPage = lazy(() =>
  import('@/pages/delivery/DeliveryLogisticsPage').then((m) => ({
    default: m.DeliveryLogisticsPage,
  }))
);

const DeliveryAssignmentsPage = lazy(() =>
  import('@/pages/delivery/DeliveryAssignmentsPage').then((m) => ({
    default: m.DeliveryAssignmentsPage,
  }))
);
const DeliveryAssignmentDetailPage = lazy(() =>
  import('@/pages/delivery/DeliveryAssignmentDetailPage').then((m) => ({
    default: m.DeliveryAssignmentDetailPage,
  }))
);

// Location Management
const LocationsPage = lazy(() =>
  import('@/pages/locations/LocationsPage').then((m) => ({
    default: m.default,
  }))
);
const LocationsExpansionPage = lazy(() =>
  import('@/pages/locations/LocationsExpansionPage').then((m) => ({
    default: m.LocationsExpansionPage,
  }))
);
const ProvidersPage = lazy(() =>
  import('@/pages/providers/ProvidersPage').then((m) => ({
    default: m.ProvidersPage,
  }))
);
const LocationDetailPage = lazy(() =>
  import('@/pages/locations/LocationDetailPage').then((m) => ({
    default: m.default,
  }))
);
const RouteDetailPage = lazy(() =>
  import('@/pages/locations/RouteDetailPage').then((m) => ({
    default: m.default,
  }))
);
// Role constants
const SUPER: AdminRole[] = ['SUPER_ADMIN'];
const SELLER: AdminRole[] = ['SUPER_ADMIN', 'SELLER_ADMIN'];
const RIDER: AdminRole[] = ['SUPER_ADMIN', 'RIDER_ADMIN'];
const CUSTOMER: AdminRole[] = ['SUPER_ADMIN', 'CUSTOMER_ADMIN'];
// Every role that may reach at least one user type — the union of the Users
// page tabs (see src/pages/users/usersTabs.ts).
const USERS: AdminRole[] = USERS_TAB_ROLES;

function Suspend({ children, roles }: { children: React.ReactElement; roles: AdminRole[] }) {
  return (
    <React.Suspense fallback={<PageLoader />}>
      <RoleRoute roles={roles}>{children}</RoleRoute>
    </React.Suspense>
  );
}

const DeliveryServicesPage = lazy(() =>
  import('@/pages/delivery/DeliveryServicesPage').then((m) => ({ default: m.DeliveryServicesPage }))
);
const DeliveryRequestsPage = lazy(() =>
  import('@/pages/delivery/DeliveryRequestsPage').then((m) => ({ default: m.DeliveryRequestsPage }))
);
const DeliveriesPage = lazy(() =>
  import('@/pages/delivery/DeliveriesPage').then((m) => ({ default: m.DeliveriesPage }))
);
const ShipmentsPage = lazy(() =>
  import('@/pages/delivery/ShipmentsPage').then((m) => ({ default: m.ShipmentsPage }))
);
const ConsolidationPage = lazy(() =>
  import('@/pages/delivery/ConsolidationPage').then((m) => ({ default: m.ConsolidationPage }))
);
const TrackingPage = lazy(() =>
  import('@/pages/delivery/TrackingPage').then((m) => ({ default: m.TrackingPage }))
);

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
        { path: 'operations', element: <Suspend roles={SUPER}><OperationsPage /></Suspend> },
        { path: 'users', element: <Suspend roles={USERS}><UsersPage /></Suspend> },
        { path: 'users/:userId', element: <Suspend roles={CUSTOMER}><UserDetailPage /></Suspend> },
        // Legacy list paths redirect to Users tabs; detail routes stay unchanged.
        { path: 'sellers', element: <Navigate to="/users?tab=sellers" replace /> },
        { path: 'sellers/:sellerId', element: <Suspend roles={SELLER}><SellerDetailPage /></Suspend> },
        { path: 'businesses', element: <Suspend roles={SELLER}><BusinessesPage /></Suspend> },
        { path: 'businesses/:businessId', element: <Suspend roles={SELLER}><BusinessDetailPage /></Suspend> },
        { path: 'stores', element: <Suspend roles={SELLER}><StoresPage /></Suspend> },
        { path: 'stores/pending', element: <Suspend roles={SELLER}><StoresPendingPage /></Suspend> },
        { path: 'stores/:storeId', element: <Suspend roles={SELLER}><StoreDetailPage /></Suspend> },
        { path: 'stores/analytics', element: <Suspend roles={SELLER}><ShopsAnalyticsPage /></Suspend> },
        // Delivery Providers — one workspace for riders, businesses and
        // logistics partners. The old /riders URLs redirect here so existing
        // links and bookmarks keep working.
        { path: 'delivery/providers', element: <Suspend roles={RIDER}><ProvidersPage /></Suspend> },
        { path: 'riders', element: <Navigate to="/delivery/providers" replace /> },
        { path: 'riders/pending', element: <Navigate to="/delivery/providers?status=pending" replace /> },
        { path: 'riders/:riderId', element: <Suspend roles={RIDER}><RiderDetailPage /></Suspend> },
        { path: 'customers', element: <Navigate to="/users?tab=customers" replace /> },
        { path: 'customers/:buyerId', element: <Suspend roles={CUSTOMER}><CustomerDetailPage /></Suspend> },
        { path: 'disputes', element: <Suspend roles={CUSTOMER}><DisputesPage /></Suspend> },
        { path: 'requests', element: <Suspend roles={CUSTOMER}><RequestsPage /></Suspend> },
        { path: 'admins', element: <Navigate to="/users?tab=admins" replace /> },
        { path: 'admins/new', element: <Suspend roles={SUPER}><AdminNewPage /></Suspend> },
        { path: 'admins/:adminId', element: <Suspend roles={SUPER}><AdminDetailPage /></Suspend> },
        { path: 'admin-roles', element: <Suspend roles={SUPER}><AdminRolesPage /></Suspend> },
        { path: 'categories', element: <Suspend roles={SELLER}><CategoriesPage /></Suspend> },
        { path: 'reviews/pending', element: <Suspend roles={SELLER}><PendingReviewsPage /></Suspend> },
        { path: 'orders', element: <Suspend roles={SUPER}><OrdersPage /></Suspend> },
        { path: 'orders/:orderId', element: <Suspend roles={SUPER}><OrderDetailPage /></Suspend> },
        { path: 'analytics', element: <Suspend roles={CUSTOMER}><AnalyticsPage /></Suspend> },
        { path: 'audit-logs', element: <Suspend roles={SUPER}><AuditLogsPage /></Suspend> },
        { path: 'settings/platform', element: <Suspend roles={SUPER}><PlatformSettingsPage /></Suspend> },
        { path: 'settings/notifications', element: <Suspend roles={SUPER}><NotificationsSettingsPage /></Suspend> },
        { path: 'settings/system', element: <Suspend roles={SUPER}><SystemSettingsPage /></Suspend> },
        { path: 'commerce', element: <Suspend roles={SUPER}><CommerceOverviewPage /></Suspend> },
        { path: 'commerce/products', element: <Suspend roles={SUPER}><ProductsPage /></Suspend> },
        { path: 'commerce/transactions', element: <Suspend roles={SUPER}><TransactionsPage /></Suspend> },
        { path: 'commerce/promotions', element: <Suspend roles={SUPER}><PromotionsPage /></Suspend> },
        
        // Delivery Module Routes
        { path: 'delivery', element: <Suspend roles={RIDER}><DeliveryLogisticsPage /></Suspend> },
        { path: 'delivery/overview', element: <Navigate to="/delivery" replace /> },
        { path: 'delivery/assignments', element: <Suspend roles={RIDER}><DeliveryAssignmentsPage /></Suspend> },
        // Dispatch / Batches is now the tabs of Assignments (ready orders →
        // assign/reassign → batches); old links and bookmarks land there.
        { path: 'delivery/dispatch', element: <Navigate to="/delivery/assignments" replace /> },
        { path: 'delivery/services', element: <Suspend roles={RIDER}><DeliveryServicesPage /></Suspend> },
        { path: 'delivery/requests', element: <Suspend roles={RIDER}><DeliveryRequestsPage /></Suspend> },
        { path: 'delivery/deliveries', element: <Suspend roles={RIDER}><DeliveriesPage /></Suspend> },
        { path: 'delivery/shipments', element: <Suspend roles={RIDER}><ShipmentsPage /></Suspend> },
        { path: 'delivery/consolidation', element: <Suspend roles={RIDER}><ConsolidationPage /></Suspend> },
        { path: 'delivery/tracking', element: <Suspend roles={RIDER}><TrackingPage /></Suspend> },

        { path: 'delivery/assignments/:assignmentId', element: <Suspend roles={RIDER}><DeliveryAssignmentDetailPage /></Suspend> },
        // Locations & Expansion is ONE workspace with tabs. The standalone
        // zone/hub/route list pages redirect into the matching tab so old links
        // and bookmarks (including the sidebar entries) keep working without
        // creating duplicate dashboards.
        { path: 'locations', element: <Suspend roles={SUPER}><LocationsExpansionPage /></Suspend> },
        { path: 'locations/tree', element: <Suspend roles={SUPER}><LocationsPage /></Suspend> },
        { path: 'locations/:id', element: <Suspend roles={SUPER}><LocationDetailPage /></Suspend> },
        { path: 'delivery/zones', element: <Navigate to="/locations?tab=zones" replace /> },
        { path: 'delivery/hubs', element: <Navigate to="/locations?tab=hubs" replace /> },
        { path: 'delivery/routes', element: <Navigate to="/locations?tab=routes" replace /> },
        { path: 'delivery/routes/:id', element: <Suspend roles={SUPER}><RouteDetailPage /></Suspend> },
      ],
    },
    { path: '/forbidden', element: <ForbiddenPage /> },
    { path: '*', element: <NotFoundPage /> },
  ], {
    // Opt in to the v7 router behaviours now so the dev console stays free of
    // React Router future-flag warnings and the v7 upgrade is a no-op.
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  });

  return (
    <RouterProvider router={router} future={{ v7_startTransition: true }} />
  );
}