/**
 * Navigation configuration used by the sidebar/header. Each label is an i18n
 * key (see src/i18n). `roles` restricts visibility per admin role; when
 * omitted the item is available to all authenticated admins.
 */
import { useAuth } from '@/hooks/useAuth';
import type { AdminRole } from '@/types/auth';
import { USERS_TAB_ROLES } from '@/pages/users/usersTabs';

export interface NavigationItem {
  labelKey: string;
  path: string;
  roles?: AdminRole[];
}

export interface NavigationGroup {
  labelKey: string;
  items: NavigationItem[];
  /** Whether the group should be collapsed by default */
  defaultCollapsed?: boolean;
}

const ALL_ADMINS: AdminRole[] = [
  'SUPER_ADMIN',
  'OPERATIONS_ADMIN',
];

export const NAV_GROUPS: NavigationGroup[] = [
  // Dashboard - Single item, no collapse needed
  {
    labelKey: 'Dashboard',
    items: [
      { labelKey: 'Home', path: '/home', roles: ALL_ADMINS },
    ],
  },

  // Users Management — ONE entry. The user types (All Users, Buyers, Sellers,
  // Customers, Admins) are tabs of the Users page, not separate pages; the tab
  // registry supplies the roles so the entry cannot drift from the tabs.
  {
    labelKey: 'Users',
    items: [
      {
        labelKey: 'Users',
        path: '/users',
        roles: USERS_TAB_ROLES,
      },
    ],
  },

  // Businesses & Shops - Collapsible (both roles)
  {
    labelKey: 'Businesses & Shops',
    defaultCollapsed: false,
    items: [
      {
        labelKey: 'Businesses',
        path: '/businesses',
        roles: ['SUPER_ADMIN', 'OPERATIONS_ADMIN'],
      },
      {
        labelKey: 'Shops',
        path: '/stores',
        roles: ['SUPER_ADMIN', 'OPERATIONS_ADMIN'],
      },
    ],
  },

  // Commerce - Collapsible (many items)
  {
    labelKey: 'Commerce',
    defaultCollapsed: false,
    items: [
      {
        labelKey: 'Overview',
        path: '/commerce',
        roles: ['SUPER_ADMIN'],
      },
      {
        labelKey: 'Products',
        path: '/commerce/products',
        roles: ['SUPER_ADMIN', 'OPERATIONS_ADMIN'],
      },
      {
        labelKey: 'Categories',
        path: '/categories',
        roles: ['SUPER_ADMIN', 'OPERATIONS_ADMIN'],
      },
      {
        labelKey: 'Reviews',
        path: '/reviews/pending',
        roles: ['SUPER_ADMIN', 'OPERATIONS_ADMIN'],
      },
      {
        labelKey: 'Orders',
        path: '/orders',
        roles: ['SUPER_ADMIN', 'OPERATIONS_ADMIN'],
      },
      {
        labelKey: 'Requests',
        path: '/requests',
        roles: ['SUPER_ADMIN', 'OPERATIONS_ADMIN'],
      },
      {
        labelKey: 'Transactions / Payments',
        path: '/commerce/transactions',
        roles: ['SUPER_ADMIN'],
      },
      {
        labelKey: 'Seller Wallets',
        path: '/commerce/wallets',
        roles: ['SUPER_ADMIN'],
      },
      {
        labelKey: 'Seller Payouts',
        path: '/commerce/payouts',
        roles: ['SUPER_ADMIN'],
      },
      {
        labelKey: 'Promotions',
        path: '/commerce/promotions',
        roles: ['SUPER_ADMIN'],
      },
    ],
  },

  // Delivery & Logistics - Collapsible (both roles)
  {
    labelKey: 'Delivery & Logistics',
    defaultCollapsed: false,
    items: [
      { labelKey: 'Overview', path: '/delivery', roles: ['SUPER_ADMIN', 'OPERATIONS_ADMIN'] },
      { labelKey: 'Locations', path: '/locations', roles: ['SUPER_ADMIN', 'OPERATIONS_ADMIN'] },
      { labelKey: 'Delivery Zones', path: '/delivery/zones', roles: ['SUPER_ADMIN', 'OPERATIONS_ADMIN'] },
      { labelKey: 'Ports', path: '/delivery/ports', roles: ['SUPER_ADMIN', 'OPERATIONS_ADMIN'] },
      { labelKey: 'Providers', path: '/delivery/providers', roles: ['SUPER_ADMIN', 'OPERATIONS_ADMIN'] },
      { labelKey: 'Requests', path: '/delivery/requests', roles: ['SUPER_ADMIN', 'OPERATIONS_ADMIN'] },
      // Deliveries is the ONE operational screen: its second tab is Tracking.
      { labelKey: 'Deliveries', path: '/delivery/deliveries', roles: ['SUPER_ADMIN', 'OPERATIONS_ADMIN'] },
      { labelKey: 'Deliverer payouts', path: '/delivery/payouts', roles: ['SUPER_ADMIN'] },
    ],
  },

  // Disputes - Collapsible (both roles)
  {
    labelKey: 'Disputes',
    defaultCollapsed: true,
    items: [
      {
        labelKey: 'Pending Reviews',
        path: '/disputes?status=open',
        roles: ['SUPER_ADMIN', 'OPERATIONS_ADMIN'],
      },
      {
        labelKey: 'Active Disputes',
        path: '/disputes?status=in_progress',
        roles: ['SUPER_ADMIN', 'OPERATIONS_ADMIN'],
      },
      {
        labelKey: 'Resolved',
        path: '/disputes?status=resolved',
        roles: ['SUPER_ADMIN', 'OPERATIONS_ADMIN'],
      },
      {
        labelKey: 'Complaints',
        path: '/disputes',
        roles: ['SUPER_ADMIN', 'OPERATIONS_ADMIN'],
      },
    ],
  },

  // Reports & Analytics - Collapsible (both roles)
  {
    labelKey: 'Reports & Analytics',
    defaultCollapsed: true,
    items: [
      {
        labelKey: 'Analytics',
        path: '/analytics',
        roles: ['SUPER_ADMIN', 'OPERATIONS_ADMIN'],
      },
      {
        labelKey: 'Shop Analytics',
        path: '/stores/analytics',
        roles: ['SUPER_ADMIN', 'OPERATIONS_ADMIN'],
      },
    ],
  },

  // Audit Logs - Single item (SUPER_ADMIN only)
  {
    labelKey: 'Audit Logs',
    items: [
      {
        labelKey: 'Audit Logs',
        path: '/audit-logs',
        roles: ['SUPER_ADMIN'],
      },
    ],
  },

  // Platform Settings - Collapsible (SUPER_ADMIN only)
  {
    labelKey: 'Platform Settings',
    defaultCollapsed: true,
    items: [
      {
        labelKey: 'General Settings',
        path: '/settings/platform',
        roles: ['SUPER_ADMIN'],
      },
      {
        labelKey: 'Commission Settings',
        path: '/settings/commission',
        roles: ['SUPER_ADMIN'],
      },
      {
        labelKey: 'Notifications',
        path: '/settings/notifications',
        roles: ['SUPER_ADMIN'],
      },
      {
        labelKey: 'System',
        path: '/settings/system',
        roles: ['SUPER_ADMIN'],
      },
    ],
  },

  // Account Security - Collapsible (All admins)
  {
    labelKey: 'Account Security',
    defaultCollapsed: true,
    items: [
      {
        labelKey: 'Security Settings',
        path: '/settings/security',
        roles: ALL_ADMINS,
      },
    ],
  },

  // Admin Roles & Permissions - Single item, no collapse needed
  {
    labelKey: 'Admin Roles & Permissions',
    items: [
      {
        labelKey: 'Roles & Permissions',
        path: '/admin-roles',
        roles: ['SUPER_ADMIN'],
      },
    ],
  },
];

/** Filters navigation groups according to the signed-in admin role. */
export function useNavigationGroups(): NavigationGroup[] {
  const { user } = useAuth();
  const role = user?.role;

  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.roles || (role !== undefined && item.roles.includes(role))
    ),
  })).filter((group) => group.items.length > 0);
}
