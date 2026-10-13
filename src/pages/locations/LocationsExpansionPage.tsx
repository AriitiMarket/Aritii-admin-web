/**
 * Locations & Expansion — ONE admin workspace for the geographical structure
 * that delivery operations run on.
 *
 * Geography and configuration ONLY. This page never edits a delivery status,
 * never assigns a rider and never shows live delivery operations; those belong
 * to the Delivery & Logistics pages.
 *
 *   LOCATIONS                              EXPANSION
 *     Cities                                 Existing active areas
 *     Service areas                          Areas being configured
 *     Zones                                  Areas not yet active
 *     Ports
 *     Pickup & service locations
 *     Routes
 *
 * The hierarchy the tables describe is City → Zone → Port → Service area:
 * Cities and Service areas are location types, Zones and Ports are their own
 * entities attached to a location, and a Port sits on a location inside a Zone.
 *
 * The active view lives in `?view=` and the section in `?tab=`, so the legacy
 * deep links (including the /delivery/zones, /delivery/ports and
 * /delivery/routes redirects) still land on the right screen.
 */
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { LocationTablePanel } from './workspace/LocationTablePanel';
import { ZonesTab } from './workspace/ZonesTab';
import { PortsTab } from './workspace/PortsTab';
import { RoutesTab } from './workspace/RoutesTab';

type ViewId = 'locations' | 'expansion';

interface Section {
  id: string;
  label: string;
  hint: string;
}

const LOCATION_SECTIONS: Section[] = [
  { id: 'cities', label: 'Cities', hint: 'City level of the operating hierarchy' },
  { id: 'zones', label: 'Zones', hint: 'Delivery zones and their coverage rules' },
  { id: 'ports', label: 'Ports', hint: 'Collection and dispatch points' },
  { id: 'pickup-points', label: 'Pickup & service locations', hint: 'Locations where pickup is available' },
  { id: 'routes', label: 'Routes', hint: 'Configured routes between locations' },
];

const EXPANSION_SECTIONS: Section[] = [
  { id: 'active', label: 'Existing active areas', hint: 'Areas already live on the network' },
  { id: 'configuring', label: 'Areas being configured', hint: 'Preparing and testing before go-live' },
  { id: 'planned', label: 'Areas not yet active', hint: 'Planned areas awaiting setup' },
];

/** Legacy ?tab= values (used by the /delivery/* redirects) still resolve. */
const LEGACY_TAB: Record<string, { view: ViewId; tab: string }> = {
  locations: { view: 'locations', tab: 'cities' },
  zones: { view: 'locations', tab: 'zones' },
  ports: { view: 'locations', tab: 'ports' },
  routes: { view: 'locations', tab: 'routes' },
  expansion: { view: 'expansion', tab: 'active' },
  active: { view: 'expansion', tab: 'active' },
  configuring: { view: 'expansion', tab: 'configuring' },
  planned: { view: 'expansion', tab: 'planned' },
};

function resolve(viewParam: string | null, tabParam: string | null) {
  const legacy = tabParam ? LEGACY_TAB[tabParam] : undefined;
  const view: ViewId = (legacy?.view ?? viewParam) === 'expansion' ? 'expansion' : 'locations';
  const sections = view === 'expansion' ? EXPANSION_SECTIONS : LOCATION_SECTIONS;
  const requested = legacy?.tab ?? tabParam;
  const tab = sections.some((s) => s.id === requested) ? (requested as string) : sections[0].id;
  return { view, tab, sections };
}

/** A small tab strip that mirrors the current section styling. */
function SectionTabs({
  sections,
  active,
  onSelect,
  label,
}: {
  sections: Section[];
  active: string;
  onSelect: (id: string) => void;
  label: string;
}) {
  const current = sections.find((s) => s.id === active);
  return (
    <div className="mb-4">
      <div
        className="flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-dark-600"
        role="tablist"
        aria-label={label}
      >
        {sections.map(({ id, label: text }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active === id}
            onClick={() => onSelect(id)}
            className={
              active === id
                ? 'whitespace-nowrap border-b-2 border-primary-dark px-4 py-2.5 text-sm font-medium text-primary-dark'
                : 'whitespace-nowrap border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }
          >
            {text}
          </button>
        ))}
      </div>
      {current && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{current.hint}</p>}
    </div>
  );
}

function ViewSwitch({
  view,
  onSelect,
}: {
  view: ViewId;
  onSelect: (v: ViewId) => void;
}) {
  const items: { id: ViewId; label: string }[] = [
    { id: 'locations', label: 'Locations' },
    { id: 'expansion', label: 'Expansion' },
  ];
  return (
    <div className="mb-4 inline-flex gap-1 rounded-md border border-gray-200 p-1 dark:border-dark-600">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-pressed={view === item.id}
          onClick={() => onSelect(item.id)}
          className={
            view === item.id
              ? 'rounded px-3 py-1.5 text-sm font-medium bg-primary-dark text-white'
              : 'rounded px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-800'
          }
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function LocationsExpansionPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { view, tab, sections } = resolve(
    searchParams.get('view'),
    searchParams.get('tab')
  );

  const selectView = (next: ViewId) => {
    const nextSections = next === 'expansion' ? EXPANSION_SECTIONS : LOCATION_SECTIONS;
    setSearchParams({ view: next, tab: nextSections[0].id }, { replace: true });
  };

  const selectTab = (id: string) => {
    setSearchParams({ view, tab: id }, { replace: true });
  };

  return (
    <div>
      <PageHeader
        title="Locations & Expansion"
        description="Manage the cities, service areas, zones, ports and pickup locations that delivery operations run on."
      />

      <ViewSwitch view={view} onSelect={selectView} />
      <SectionTabs
        sections={sections}
        active={tab}
        onSelect={selectTab}
        label={view === 'expansion' ? 'Expansion sections' : 'Location sections'}
      />

      <div role="tabpanel">
        {view === 'locations' && tab === 'cities' && (
          <LocationTablePanel
            heading="Cities"
            description="City level of the operating hierarchy. Zones, ports and service areas hang off a city."
            lockedType="city"
            emptyTitle="No cities yet"
            emptyDescription="Add your first city to start building the delivery network."
            addLabel="Add City"
          />
        )}


        {view === 'locations' && tab === 'zones' && <ZonesTab />}

        {view === 'locations' && tab === 'ports' && <PortsTab />}

        {view === 'locations' && tab === 'pickup-points' && (
          <LocationTablePanel
            heading="Pickup & service locations"
            description="Locations flagged as available for pickup, with the service configuration already stored on them."
            pickupOnly
            emptyTitle="No pickup locations yet"
            emptyDescription="Enable pickup availability on a location's service configuration to list it here."
            addLabel="Add Location"
          />
        )}

        {view === 'locations' && tab === 'routes' && <RoutesTab />}

        {view === 'expansion' && tab === 'active' && (
          <LocationTablePanel
            heading="Existing active areas"
            description="Areas already live on the delivery network."
            expansionStages={['active']}
            emptyTitle="No active areas yet"
            emptyDescription="Areas appear here once their expansion stage is Active."
            addLabel="Add Area"
          />
        )}

        {view === 'expansion' && tab === 'configuring' && (
          <LocationTablePanel
            heading="Areas being configured"
            description="Areas being prepared or tested before they go live."
            expansionStages={['preparing', 'testing']}
            emptyTitle="Nothing is being configured"
            emptyDescription="Areas appear here once their expansion stage is Preparing or Testing."
            addLabel="Add Area"
          />
        )}

        {view === 'expansion' && tab === 'planned' && (
          <LocationTablePanel
            heading="Areas not yet active"
            description="Planned areas awaiting configuration."
            expansionStages={['planned']}
            emptyTitle="No planned areas"
            emptyDescription="Areas you plan to launch appear here before setup starts."
            addLabel="Add Area"
          />
        )}
      </div>
    </div>
  );
}

export default LocationsExpansionPage;
