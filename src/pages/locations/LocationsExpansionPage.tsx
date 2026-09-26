import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { LocationsTab } from './workspace/LocationsTab';
import { ZonesTab } from './workspace/ZonesTab';
import { HubsTab } from './workspace/HubsTab';
import { RoutesTab } from './workspace/RoutesTab';
import { ExpansionTab } from './workspace/ExpansionTab';

type TabId = 'locations' | 'zones' | 'hubs' | 'routes' | 'expansion';

const TABS: { id: TabId; label: string }[] = [
  { id: 'locations', label: 'Locations' },
  { id: 'zones', label: 'Delivery Zones' },
  { id: 'hubs', label: 'Hubs' },
  { id: 'routes', label: 'Routes' },
  { id: 'expansion', label: 'Expansion' },
];

function isTab(v: string | null): v is TabId {
  return !!v && TABS.some((t) => t.id === v);
}

/**
 * Locations & Expansion — ONE admin workspace.
 *
 * Not separate dashboards: a single header, a single tab strip, and each tab
 * renders its own content, filters and actions inside the same module. The
 * active tab lives in `?tab=` so old deep links (and the legacy
 * /delivery/zones, /delivery/routes URLs) land on the right tab, and so the
 * admin can bookmark a specific view.
 */
export function LocationsExpansionPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get('tab');
  const active: TabId = isTab(param) ? param : 'locations';

  const selectTab = (id: TabId) => {
    setSearchParams(id === 'locations' ? {} : { tab: id }, { replace: true });
  };

  return (
    <div>
      <PageHeader
        title="Locations & Expansion"
        description="Manage operating locations, delivery zones, hubs, routes, and geographic expansion."
      />

      {/* Horizontally scrollable tab strip — wraps into view on mobile. */}
      <div
        className="mb-4 flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-dark-600"
        role="tablist"
        aria-label="Locations and expansion sections"
      >
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active === id}
            onClick={() => selectTab(id)}
            className={
              active === id
                ? 'whitespace-nowrap border-b-2 border-primary-dark px-4 py-2.5 text-sm font-medium text-primary-dark'
                : 'whitespace-nowrap border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }
          >
            {label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {active === 'locations' && <LocationsTab />}
        {active === 'zones' && <ZonesTab />}
        {active === 'hubs' && <HubsTab />}
        {active === 'routes' && <RoutesTab />}
        {active === 'expansion' && <ExpansionTab />}
      </div>
    </div>
  );
}

export default LocationsExpansionPage;
