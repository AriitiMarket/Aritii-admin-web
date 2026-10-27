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
import { RouteErrorBoundary } from '@/components/common/ErrorBoundary';
import type { AdminRole } from '@/types/auth';
import { USERS_TAB_ROLES } from '@/pages/users/usersTabs';

// Auth
import { LoginPage } from '@/pages/LoginPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';

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
// Financial Management Pages
const WalletsPage = lazy(() =>
  import('@/pages/commerce/WalletsPage').then((m) => ({
    default: m.default,
  }))
);
const PayoutsPage = lazy(() =>
  import('@/pages/commerce/PayoutsPage').then((m) => ({
    default: m.default,
  }))
);
const CommissionSettingsPage = lazy(() =>
  import('@/pages/AdminCommissionSettingsPage').then((m) => ({
    default: m.AdminCommissionSettingsPage,
  }))
);
const SellerFinancialDetail = lazy(() =>
  import('@/pages/sellers/SellerFinancialDetail').then((m) => ({
    default: m.default,
  }))
);
// Phase-1 fulfilment ops — priority queue, SLA breaches, payment reconciliation
const PriorityQueuePage = lazy(() =>
  import('@/pages/commerce/PriorityQueuePage').then((m) => ({
    default: m.PriorityQueuePage,
  }))
);
const SLADashboardPage = lazy(() =>
  import('@/pages/commerce/SLADashboardPage').then((m) => ({
    default: m.SLADashboardPage,
  }))
);
const PaymentReconciliationPage = lazy(() =>
  import('@/pages/commerce/PaymentReconciliationPage').then((m) => ({
    default: m.PaymentReconciliationPage,
  }))
);
// Admin audit pages — commission & payment ledger
const CommissionAuditPage = lazy(() =>
  import('@/pages/commerce/CommissionAuditPage').then((m) => ({
    default: m.CommissionAuditPage,
  }))
);
const PaymentLedgerPage = lazy(() =>
  import('@/pages/commerce/PaymentLedgerPage').then((m) => ({
    default: m.PaymentLedgerPage,
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
const SecuritySettingsPage = lazy(() =>
  import('@/pages/settings/SecuritySettingsPage').then((m) => ({
    default: m.SecuritySettingsPage,
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
// Role constants for route gating (2-role system)
const SUPER: AdminRole[] = ['SUPER_ADMIN'];
const OPS: AdminRole[] = ['SUPER_ADMIN', 'OPERATIONS_ADMIN'];
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
const DelivererPayoutsPage = lazy(() =>
  import('@/pages/delivery/DelivererPayoutsPage').then((m) => ({ default: m.DelivererPayoutsPage }))
);

export function AppRoutes() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <AuthLayout />,
      errorElement: <RouteErrorBoundary />,
      children: [
        { index: true, element: <Navigate to="/login" replace /> },
        { path: 'login', element: <LoginPage /> },
        { path: 'forgot-password', element: <ForgotPasswordPage /> },
        { path: 'reset-password', element: <ResetPasswordPage /> },
      ],
    },
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      ),
      errorElement: <RouteErrorBoundary />,
      children: [
        { index: true, element: <Navigate to="/home" replace /> },
        { path: 'home', element: <Suspend roles={OPS}><HomePage /></Suspend> },
        // The old live-operations feed is now the delivery history inside each
        // delivery (Deliveries page) — no separate Operations page.
        { path: 'operations', element: <Navigate to="/delivery/deliveries" replace /> },
        { path: 'users', element: <Suspend roles={USERS}><UsersPage /></Suspend> },
        { path: 'users/:userId', element: <Suspend roles={OPS}><UserDetailPage /></Suspend> },
        // Legacy list paths redirect to Users tabs; detail routes stay unchanged.
        { path: 'sellers', element: <Navigate to="/users?tab=sellers" replace /> },
        { path: 'sellers/:sellerId', element: <Suspend roles={OPS}><SellerDetailPage /></Suspend> },
        { path: 'businesses', element: <Suspend roles={OPS}><BusinessesPage /></Suspend> },
        { path: 'businesses/:businessId', element: <Suspend roles={OPS}><BusinessDetailPage /></Suspend> },
        { path: 'stores', element: <Suspend roles={OPS}><StoresPage /></Suspend> },
        { path: 'stores/pending', element: <Suspend roles={OPS}><StoresPendingPage /></Suspend> },
        { path: 'stores/:storeId', element: <Suspend roles={OPS}><StoreDetailPage /></Suspend> },
        { path: 'stores/analytics', element: <Suspend roles={OPS}><ShopsAnalyticsPage /></Suspend> },
        // Delivery Providers — one workspace for riders, businesses and
        // logistics partners. The old /riders URLs redirect here so existing
        // links and bookmarks keep working.
        { path: 'delivery/providers', element: <Suspend roles={OPS}><ProvidersPage /></Suspend> },
        { path: 'riders', element: <Navigate to="/delivery/providers" replace /> },
        { path: 'riders/pending', element: <Navigate to="/delivery/providers?status=pending" replace /> },
        // Provider detail lives in the Providers workspace (drawer); the old
        // per-rider page was a duplicate with admin Online/Offline controls.
        { path: 'riders/:riderId', element: <Navigate to="/delivery/providers" replace /> },
        { path: 'customers', element: <Navigate to="/users?tab=customers" replace /> },
        { path: 'customers/:buyerId', element: <Suspend roles={OPS}><CustomerDetailPage /></Suspend> },
        { path: 'disputes', element: <Suspend roles={OPS}><DisputesPage /></Suspend> },
        { path: 'requests', element: <Suspend roles={OPS}><RequestsPage /></Suspend> },
        { path: 'admins', element: <Navigate to="/users?tab=admins" replace /> },
        { path: 'admins/new', element: <Suspend roles={SUPER}><AdminNewPage /></Suspend> },
        { path: 'admins/:adminId', element: <Suspend roles={SUPER}><AdminDetailPage /></Suspend> },
        { path: 'admin-roles', element: <Suspend roles={SUPER}><AdminRolesPage /></Suspend> },
        { path: 'categories', element: <Suspend roles={OPS}><CategoriesPage /></Suspend> },
        { path: 'reviews/pending', element: <Suspend roles={OPS}><PendingReviewsPage /></Suspend> },
        { path: 'orders', element: <Suspend roles={OPS}><OrdersPage /></Suspend> },
        { path: 'orders/:orderId', element: <Suspend roles={OPS}><OrderDetailPage /></Suspend> },
        { path: 'analytics', element: <Suspend roles={OPS}><AnalyticsPage /></Suspend> },
        { path: 'audit-logs', element: <Suspend roles={SUPER}><AuditLogsPage /></Suspend> },
        { path: 'settings/platform', element: <Suspend roles={SUPER}><PlatformSettingsPage /></Suspend> },
        { path: 'settings/commission', element: <Suspend roles={SUPER}><CommissionSettingsPage /></Suspend> },
        { path: 'settings/notifications', element: <Suspend roles={SUPER}><NotificationsSettingsPage /></Suspend> },
        { path: 'settings/system', element: <Suspend roles={SUPER}><SystemSettingsPage /></Suspend> },
        { path: 'settings/security', element: <Suspend roles={OPS}><SecuritySettingsPage /></Suspend> },
        { path: 'commerce', element: <Suspend roles={SUPER}><CommerceOverviewPage /></Suspend> },
        { path: 'commerce/products', element: <Suspend roles={OPS}><ProductsPage /></Suspend> },
        { path: 'commerce/transactions', element: <Suspend roles={SUPER}><TransactionsPage /></Suspend> },
        { path: 'commerce/promotions', element: <Suspend roles={SUPER}><PromotionsPage /></Suspend> },
        // Financial Management — Wallets & Payouts
        { path: 'commerce/wallets', element: <Suspend roles={OPS}><WalletsPage /></Suspend> },
        { path: 'commerce/payouts', element: <Suspend roles={OPS}><PayoutsPage /></Suspend> },
        { path: 'commerce/commission', element: <Navigate to="/settings/commission" replace /> },
        { path: 'sellers/:sellerId/financial', element: <Suspend roles={OPS}><SellerFinancialDetail /></Suspend> },
        // Phase-1 fulfilment ops — priority queue, SLA dashboard, reconciliation
        { path: 'commerce/priority', element: <Suspend roles={OPS}><PriorityQueuePage /></Suspend> },
        { path: 'commerce/sla', element: <Suspend roles={OPS}><SLADashboardPage /></Suspend> },
        { path: 'commerce/reconciliation', element: <Suspend roles={SUPER}><PaymentReconciliationPage /></Suspend> },
        // Admin audit pages — commission & payment ledger
        { path: 'commerce/commission-audit', element: <Suspend roles={SUPER}><CommissionAuditPage /></Suspend> },
        { path: 'commerce/payment-ledger', element: <Suspend roles={SUPER}><PaymentLedgerPage /></Suspend> },

        // Delivery Module Routes — ONE operational screen (Deliveries) with the
        // assignment action inside each delivery. There are deliberately no
        // separate Assignments / Dispatch / Shipments / Consolidation pages:
        // the old URLs redirect so bookmarks keep working.
        { path: 'delivery', element: <Suspend roles={OPS}><DeliveryLogisticsPage /></Suspend> },
        { path: 'delivery/overview', element: <Navigate to="/delivery" replace /> },
        { path: 'delivery/assignments', element: <Navigate to="/delivery/deliveries" replace /> },
        { path: 'delivery/dispatch', element: <Navigate to="/delivery/deliveries" replace /> },
        { path: 'delivery/services', element: <Suspend roles={OPS}><DeliveryServicesPage /></Suspend> },
        { path: 'delivery/requests', element: <Suspend roles={OPS}><DeliveryRequestsPage /></Suspend> },
        { path: 'delivery/deliveries', element: <Suspend roles={OPS}><DeliveriesPage /></Suspend> },
        { path: 'delivery/payouts', element: <Suspend roles={OPS}><DelivererPayoutsPage /></Suspend> },
        { path: 'delivery/shipments', element: <Navigate to="/delivery" replace /> },
        { path: 'delivery/consolidation', element: <Navigate to="/delivery" replace /> },
        // Tracking is the second view of the Deliveries screen (same records, same
        // status). The old URL still works and lands on that view.
        { path: 'delivery/tracking', element: <Navigate to="/delivery/deliveries?view=tracking" replace /> },
        { path: 'delivery/assignments/:assignmentId', element: <Navigate to="/delivery/deliveries" replace /> },
        // Locations & Expansion is ONE workspace with tabs. The standalone
        // zone/port/route list pages redirect into the matching tab so old links
        // and bookmarks (including the sidebar entries) keep working without
        // creating duplicate dashboards.
        { path: 'locations', element: <Suspend roles={OPS}><LocationsExpansionPage /></Suspend> },
        { path: 'locations/tree', element: <Suspend roles={OPS}><LocationsPage /></Suspend> },
        { path: 'locations/:id', element: <Suspend roles={OPS}><LocationDetailPage /></Suspend> },
        { path: 'delivery/zones', element: <Navigate to="/locations?tab=zones" replace /> },
        { path: 'delivery/ports', element: <Navigate to="/locations?tab=ports" replace /> },
        { path: 'delivery/routes', element: <Navigate to="/locations?tab=routes" replace /> },
        { path: 'delivery/routes/:id', element: <Suspend roles={OPS}><RouteDetailPage /></Suspend> },
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
    <RouterProvider router={router} />
  );
}
