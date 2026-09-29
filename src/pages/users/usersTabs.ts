/**
 * Users module tabs — the single source of truth for the user-type navigation.
 *
 * The console used to show one sidebar entry per user type (All Users, Buyers,
 * Sellers, Customers, Admins), and then merged them into tabs of ONE Users
 * page. This registry drives all three consumers:
 *   * the sidebar entry        (src/routes/navigation.ts)
 *   * the `/users` route guard (src/routes/AppRoutes.tsx)
 *   * the tab bar and panels   (src/pages/users/UsersPage.tsx)
 *
 * Buyer and customer are the SAME actor (the platform's canonical role is
 * BUYER, "Customer" is its display name), so they are ONE tab — a "Buyers"
 * tab next to a "Customers" tab showed the identical list twice and read as a
 * contradiction. The legacy spellings still resolve through TAB_ALIASES.
 *
 * Each tab keeps the EXACT role set of the page it replaces, so merging the
 * pages cannot widen anyone's access:
 *   /users (+ the old /users?type=buyer) -> All Users, Customers
 *   /sellers                             -> Sellers
 *   /customers                           -> Customers
 *   /admins                              -> Admins
 */
import type { AdminRole } from '@/types/auth';

export type UsersTabId = 'all' | 'sellers' | 'customers' | 'admins';

export interface UsersTabDefinition {
  id: UsersTabId;
  /** i18n key of the tab label. */
  labelKey: string;
  /** Admin roles allowed to see this tab. */
  roles: AdminRole[];
}

export const USERS_TABS: UsersTabDefinition[] = [
  { id: 'all', labelKey: 'All Users', roles: ['SUPER_ADMIN', 'CUSTOMER_ADMIN'] },
  { id: 'customers', labelKey: 'Customers', roles: ['SUPER_ADMIN', 'CUSTOMER_ADMIN'] },
  { id: 'sellers', labelKey: 'Sellers', roles: ['SUPER_ADMIN', 'SELLER_ADMIN'] },
  { id: 'admins', labelKey: 'Admins', roles: ['SUPER_ADMIN'] },
];

/**
 * Roles that get the single "Users" sidebar item and the `/users` route: the
 * union of the tabs, i.e. every role that could reach at least one user type
 * before the merge.
 */
export const USERS_TAB_ROLES: AdminRole[] = Array.from(
  new Set(USERS_TABS.flatMap((tab) => tab.roles))
);

/** Tabs the signed-in admin may see, in display order. */
export function visibleUsersTabs(role?: AdminRole): UsersTabDefinition[] {
  if (!role) return [];
  return USERS_TABS.filter((tab) => tab.roles.includes(role));
}

/** `?tab=` spellings plus the legacy `?type=` values the old sidebar links used. */
const TAB_ALIASES: Record<string, UsersTabId> = {
  all: 'all',
  users: 'all',
  // "Buyer" was the old tab spelling of the same actor as "customer".
  buyer: 'customers',
  buyers: 'customers',
  seller: 'sellers',
  sellers: 'sellers',
  customer: 'customers',
  customers: 'customers',
  admin: 'admins',
  admins: 'admins',
};

/**
 * Normalizes a `?tab=` / legacy `?type=` value onto a tab id. Unknown values
 * return null, so the caller falls back to the first tab the admin may see (this
 * is what keeps a SELLER_ADMIN following an old `/customers` link from being
 * shown customer data).
 */
export function resolveUsersTab(value: string | null | undefined): UsersTabId | null {
  if (!value) return null;
  return TAB_ALIASES[value.trim().toLowerCase()] ?? null;
}
