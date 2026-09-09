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
  {
    labelKey: 'General',
    items: [
      { labelKey: 'Home', path: '/home', roles: ALL_ADMINS },
      {
        labelKey: 'Users',
        path: '/users',
        roles: ['SUPER_ADMIN', 'CUSTOMER_ADMIN'],
      },
      {
        labelKey: 'Sellers',
        path: '/sellers',
        roles: ['SUPER_ADMIN', 'SELLER_ADMIN'],
      },
      {
        labelKey: 'Stores',
        path: '/stores',
        roles: ['SUPER_ADMIN', 'SELLER_ADMIN'],
      },
      {
        labelKey: 'Riders',
        path: '/riders',
        roles: ['SUPER_ADMIN', 'RIDER_ADMIN'],
      },
      {
        labelKey: 'Customers',
        path: '/customers',
        roles: ['SUPER_ADMIN', 'CUSTOMER_ADMIN'],
      },
      {
        labelKey: 'Disputes',
        path: '/disputes',
        roles: ['SUPER_ADMIN', 'CUSTOMER_ADMIN'],
      },
    ],
  },
  {
    labelKey: 'Catalog',
    items: [
      {
        labelKey: 'Categories',
        path: '/categories',
        roles: ['SUPER_ADMIN', 'SELLER_ADMIN'],
      },
      { labelKey: 'Sectors', path: '/sectors', roles: ['SUPER_ADMIN'] },
      {
        labelKey: 'Pending Reviews',
        path: '/reviews/pending',
        roles: ['SUPER_ADMIN', 'SELLER_ADMIN'],
      },
    ],
  },
  {
    labelKey: 'Operations',
    items: [
      { labelKey: 'Orders', path: '/orders', roles: ['SUPER_ADMIN'] },
      {
        labelKey: 'Analytics',
        path: '/analytics',
        roles: ['SUPER_ADMIN', 'CUSTOMER_ADMIN'],
      },
      { labelKey: 'Admins', path: '/admins', roles: ['SUPER_ADMIN'] },
      {
        labelKey: 'Settings',
        path: '/settings/platform',
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