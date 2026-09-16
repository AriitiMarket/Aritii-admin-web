/**
 * Navigation configuration used by the sidebar/header. Each label is an i18n
 * key (see src/i18n). `roles` restricts visibility per admin role; when
 * omitted the item is available to all authenticated admins.
 */
import { useAuth } from '@/hooks/useAuth';
import type { AdminRole } from '@/types/auth';

export interface NavigationItem {
  labelKey: string;
  path: string;
  roles?: AdminRole[];
}

export interface NavigationGroup {
  labelKey: string;
  items: NavigationItem[];
}

const ALL_ADMINS: AdminRole[] = [
  'SUPER_ADMIN',
  'SELLER_ADMIN',
  'RIDER_ADMIN',
  'CUSTOMER_ADMIN',
];

export const NAV_GROUPS: NavigationGroup[] = [
  // Dashboard
  {
    labelKey: 'Dashboard',
    items: [
      { labelKey: 'Home', path: '/home', roles: ALL_ADMINS },
      { labelKey: 'Operations', path: '/operations', roles: ['SUPER_ADMIN'] },
      { labelKey: 'Platform Explorer', path: '/explorer', roles: ['SUPER_ADMIN'] },
    ],
  },
  
  // Users Management
  {
    labelKey: 'Users',
    items: [
      {
        labelKey: 'All Users',
        path: '/users',
        roles: ['SUPER_ADMIN', 'CUSTOMER_ADMIN'],
      },
      {
        labelKey: 'Buyers',
        path: '/users?type=buyer',
        roles: ['SUPER_ADMIN', 'CUSTOMER_ADMIN'],
      },
      {
        labelKey: 'Sellers',
        path: '/sellers',
        roles: ['SUPER_ADMIN', 'SELLER_ADMIN'],
      },
      {
        labelKey: 'Customers',
        path: '/customers',
        roles: ['SUPER_ADMIN', 'CUSTOMER_ADMIN'],
      },
      {
        labelKey: 'Admins',
        path: '/admins',
        roles: ['SUPER_ADMIN'],
      },
    ],
  },

  // Businesses & Shops
  {
    labelKey: 'Businesses & Shops',
    items: [
      {
        labelKey: 'Businesses',
        path: '/businesses',
        roles: ['SUPER_ADMIN', 'SELLER_ADMIN'],
      },
      {
        labelKey: 'Shops',
        path: '/stores',
        roles: ['SUPER_ADMIN', 'SELLER_ADMIN'],
      },
    ],
  },

  // Locations & Expansion
  {
    labelKey: 'Locations & Expansion',
    items: [
      {
        labelKey: 'Regions',
        path: '/locations?type=region',
        roles: ['SUPER_ADMIN'],
      },
      {
        labelKey: 'Cities / Areas',
        path: '/locations?type=city',
        roles: ['SUPER_ADMIN'],
      },
      {
        labelKey: 'Sectors',
        path: '/sectors',
        roles: ['SUPER_ADMIN'],
      },
      {
        labelKey: 'Delivery Zones',
        path: '/delivery/zones',
        roles: ['SUPER_ADMIN', 'RIDER_ADMIN'],
      },
      {
        labelKey: 'Coverage',
        path: '/locations/hierarchy',
        roles: ['SUPER_ADMIN'],
      },
    ],
  },

  // Commerce
  {
    labelKey: 'Commerce',
    items: [
      {
        labelKey: 'Overview',
        path: '/commerce',
        roles: ['SUPER_ADMIN'],
      },
      {
        labelKey: 'Products',
        path: '/commerce/products',
        roles: ['SUPER_ADMIN'],
      },
      {
        labelKey: 'Categories',
        path: '/categories',
        roles: ['SUPER_ADMIN', 'SELLER_ADMIN'],
      },
      {
        labelKey: 'Orders',
        path: '/orders',
        roles: ['SUPER_ADMIN'],
      },
      {
        labelKey: 'Transactions / Payments',
        path: '/commerce/transactions',
        roles: ['SUPER_ADMIN'],
      },
      {
        labelKey: 'Promotions',
        path: '/commerce/promotions',
        roles: ['SUPER_ADMIN'],
      },
    ],
  },

  // Delivery
  {
    labelKey: 'Delivery',
    items: [
      {
        labelKey: 'Overview',
        path: '/delivery',
        roles: ['SUPER_ADMIN', 'RIDER_ADMIN'],
      },
      {
        labelKey: 'Riders / Delivery Actors',
        path: '/riders',
        roles: ['SUPER_ADMIN', 'RIDER_ADMIN'],
      },
      {
        labelKey: 'Assignments',
        path: '/delivery/assignments',
        roles: ['SUPER_ADMIN', 'RIDER_ADMIN'],
      },
      {
        labelKey: 'Active Deliveries',
        path: '/delivery/assignments?status=in_transit',
        roles: ['SUPER_ADMIN', 'RIDER_ADMIN'],
      },
    ],
  },

  // Disputes
  {
    labelKey: 'Disputes',
    items: [
      {
        labelKey: 'Pending Reviews',
        path: '/disputes?status=open',
        roles: ['SUPER_ADMIN', 'CUSTOMER_ADMIN'],
      },
      {
        labelKey: 'Active Disputes',
        path: '/disputes?status=in_progress',
        roles: ['SUPER_ADMIN', 'CUSTOMER_ADMIN'],
      },
      {
        labelKey: 'Resolved',
        path: '/disputes?status=resolved',
        roles: ['SUPER_ADMIN', 'CUSTOMER_ADMIN'],
      },
      {
        labelKey: 'Complaints',
        path: '/disputes',
        roles: ['SUPER_ADMIN', 'CUSTOMER_ADMIN'],
      },
    ],
  },

  // Reports & Analytics
  {
    labelKey: 'Reports & Analytics',
    items: [
      {
        labelKey: 'Analytics',
        path: '/analytics',
        roles: ['SUPER_ADMIN', 'CUSTOMER_ADMIN'],
      },
      {
        labelKey: 'Growth & Analytics',
        path: '/analytics/growth',
        roles: ['SUPER_ADMIN'],
      },
      {
        labelKey: 'Shop Analytics',
        path: '/stores/analytics',
        roles: ['SUPER_ADMIN', 'SELLER_ADMIN'],
      },
    ],
  },

  // Audit Logs
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

  // Platform Settings
  {
    labelKey: 'Platform Settings',
    items: [
      {
        labelKey: 'General Settings',
        path: '/settings/platform',
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

  // Admin Roles & Permissions
  {
    labelKey: 'Admin Roles & Permissions',
    items: [
      {
        labelKey: 'Roles & Permissions',
        path: '/admin-roles',
        roles: ['SUPER_ADMIN'],
      },
      {
        labelKey: 'Admin Users',
        path: '/admins',
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