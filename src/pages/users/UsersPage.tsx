/**
 * Users page — ONE page for every user type.
 *
 * The sidebar has a single "Users" entry; the user types are clickable tabs:
 * All Users | Buyers | Sellers | Customers | Admins. Each tab renders the panel
 * that used to be its own page (see usersTabs.ts for the registry and the
 * per-tab role sets), so the APIs, filters, actions and permissions are the
 * existing ones.
 *
 * The active tab lives in the URL (`/users?tab=sellers`) so the view is
 * shareable, the browser back button works, and the legacy `/sellers`,
 * `/customers` and `/admins` links still land on the right tab. The old
 * `?type=buyer` spelling is accepted as well.
 */
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { Tabs, TabContent } from '@/components/common/Tabs';
import {
  resolveUsersTab,
  visibleUsersTabs,
  type UsersTabId,
} from '@/pages/users/usersTabs';
import { UsersListPanel } from '@/pages/users/UsersListPanel';
import { SellersListPanel } from '@/pages/users/SellersListPanel';
import { AdminsListPanel } from '@/pages/users/AdminsListPanel';

export function UsersManagementPage() {
  const { t } = useLocalization();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Only the tabs this admin role may see. The role sets are exactly those of the
  // standalone pages, so merging them cannot widen anyone's access.
  const tabs = useMemo(() => visibleUsersTabs(user?.role), [user?.role]);

  // `?tab=` wins, then the legacy `?type=`, then the first tab this role may see
  // (which is what keeps an old `/customers` link from showing customer data to a
  // role that never had access to it).
  const requested = resolveUsersTab(searchParams.get('tab') ?? searchParams.get('type'));
  const activeTab: UsersTabId =
    tabs.find((tab) => tab.id === requested)?.id ?? tabs[0]?.id ?? 'all';

  const handleTabChange = (next: string) => {
    const tab = resolveUsersTab(next);
    if (!tab || !tabs.some((entry) => entry.id === tab)) return;
    const params = new URLSearchParams(searchParams);
    params.delete('type'); // legacy spelling, superseded by ?tab=
    params.set('tab', tab);
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('Users')}
        description={t('Manage registered marketplace users')}
      />

      <Tabs
        tabs={tabs.map((tab) => ({ value: tab.id, label: t(tab.labelKey) }))}
        activeTab={activeTab}
        onChange={handleTabChange}
      />

      <TabContent>
        {/*
          `key={activeTab}` remounts the panel when the tab changes, so page
          number, search text and selection never leak from one user type into
          another.
        */}
        {activeTab === 'all' && <UsersListPanel key="all" />}
        {activeTab === 'customers' && <UsersListPanel key="customers" role="BUYER" />}
        {activeTab === 'sellers' && <SellersListPanel key="sellers" />}
        {activeTab === 'admins' && <AdminsListPanel key="admins" />}
      </TabContent>
    </div>
  );
}
