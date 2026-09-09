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
  import('@/pages/dashboard/HomePage').then((m) => ({ default: m.HomePage }))
);
const UsersPage = lazy(() =>
  import('@/pages/users/UsersPage').then((m) => ({ default: m.UsersPage }))
);
const UserDetailPage = lazy(() =>
  import('@/pages/users/UserDetailPage').then((m) => ({
    default: m.UserDetailPage,
  }))
);
const SellersPage = lazy(() =>
  import('@/pages/sellers/SellersPage').then((m) => ({
    default: m.SellersPage,
  }))
);
const SellerDetailPage = lazy(() =>
  import('@/pages/sellers/SellerDetailPage').then((m) => ({
    default: m.SellerDetailPage,
  }))
);
const StoresPage = lazy(() =>
  import('@/pages/stores/StoresPage').then((m) => ({ default: m.StoresPage }))
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
  import('@/pages/riders/RidersPage').then((m) => ({ default: m.RidersPage }))
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
    default: m.CustomersPage,
  }))
);
const CustomerDetailPage = lazy(() =>
  import('@/pages/customers/CustomerDetailPage').then((m) => ({
    default: m.CustomerDetailPage,
  }))
);
const DisputesPage = lazy(() =>
  import('@/pages/disputes/DisputesPage').then((m) => ({
    default: m.DisputesPage,
  }))
);
const AdminsPage = lazy(() =>
  import('@/pages/admins/AdminsPage').then((m) => ({ default: m.AdminsPage }))
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
  import('@/pages/orders/OrdersPage').then((m) => ({ default: m.OrdersPage }))
);
const OrderDetailPage = lazy(() =>
  import('@/pages/orders/OrderDetailPage').then((m) => ({
    default: m.OrderDetailPage,
  }))
);
const AnalyticsPage = lazy(() =>
  import('@/pages/analytics/AnalyticsPage').then((m) => ({
    default: m.AnalyticsPage,
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
        { path: 'users', element: <Suspend roles={CUSTOMER}><UsersPage /></Suspend> },
        { path: 'users/:userId', element: <Suspend roles={CUSTOMER}><UserDetailPage /></Suspend> },
        { path: 'sellers', element: <Suspend roles={SELLER}><SellersPage /></Suspend> },
        { path: 'sellers/:sellerId', element: <Suspend roles={SELLER}><SellerDetailPage /></Suspend> },
        { path: 'stores', element: <Suspend roles={SELLER}><StoresPage /></Suspend> },
        { path: 'stores/pending', element: <Suspend roles={SELLER}><StoresPendingPage /></Suspend> },
        { path: 'stores/:storeId', element: <Suspend roles={SELLER}><StoreDetailPage /></Suspend> },
        { path: 'riders', element: <Suspend roles={RIDER}><RidersPage /></Suspend> },
        { path: 'riders/pending', element: <Suspend roles={RIDER}><RidersPendingPage /></Suspend> },
        { path: 'riders/:riderId', element: <Suspend roles={RIDER}><RiderDetailPage /></Suspend> },
        { path: 'customers', element: <Suspend roles={CUSTOMER}><CustomersPage /></Suspend> },
        { path: 'customers/:customerId', element: <Suspend roles={CUSTOMER}><CustomerDetailPage /></Suspend> },
        { path: 'disputes', element: <Suspend roles={CUSTOMER}><DisputesPage /></Suspend> },
        { path: 'admins', element: <Suspend roles={SUPER}><AdminsPage /></Suspend> },
        { path: 'admins/new', element: <Suspend roles={SUPER}><AdminNewPage /></Suspend> },
        { path: 'admins/:adminId', element: <Suspend roles={SUPER}><AdminDetailPage /></Suspend> },
        { path: 'categories', element: <Suspend roles={SELLER}><CategoriesPage /></Suspend> },
        { path: 'sectors', element: <Suspend roles={SUPER}><SectorsPage /></Suspend> },
        { path: 'reviews/pending', element: <Suspend roles={SELLER}><PendingReviewsPage /></Suspend> },
        { path: 'orders', element: <Suspend roles={SUPER}><OrdersPage /></Suspend> },
        { path: 'orders/:orderId', element: <Suspend roles={SUPER}><OrderDetailPage /></Suspend> },
        { path: 'analytics', element: <Suspend roles={CUSTOMER}><AnalyticsPage /></Suspend> },
        { path: 'settings/platform', element: <Suspend roles={SUPER}><PlatformSettingsPage /></Suspend> },
        { path: 'settings/notifications', element: <Suspend roles={SUPER}><NotificationsSettingsPage /></Suspend> },
        { path: 'settings/system', element: <Suspend roles={SUPER}><SystemSettingsPage /></Suspend> },
      ],
    },
    { path: '/forbidden', element: <ForbiddenPage /> },
    { path: '*', element: <NotFoundPage /> },
  ]);

  return <RouterProvider router={router} />;
}