import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBoxesStacked,
  faChartLine,
  faCog,
  faFolderOpen,
  faHeadset,
  faHome,
  faLayerGroup,
  faListCheck,
  faMotorcycle,
  faStar,
  faStore,
  faUsers,
  faMap,
  faUpload,
  faBuilding,
  faShoppingCart,
  faTag,
  faExchangeAlt,
  faTruck,
  faClock,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { useLocalization } from '@/i18n/I18nProvider';
import { useNavigationGroups } from '@/routes/navigation';
import { twMerge } from 'tailwind-merge';

const ICONS: Record<string, IconDefinition> = {
  Home: faHome,
  Users: faUsers,
  Businesses: faBuilding,
  Stores: faStore,
  Riders: faMotorcycle,
  Disputes: faHeadset,
  Locations: faMap,
  'Bulk Import': faUpload,
  'Commerce Overview': faShoppingCart,
  Products: faBoxesStacked,
  Categories: faTag,
  Orders: faListCheck,
  Transactions: faExchangeAlt,
  Promotions: faStar,
  'Shop Analytics': faChartLine,
  Sectors: faLayerGroup,
  'Pending Reviews': faStar,
  Analytics: faChartLine,
  Settings: faCog,
  Expansion: faMap,
  Commerce: faShoppingCart,
  'Delivery Zones': faLayerGroup,
  'Active Deliveries': faClock,
  'Delivery & Logistics': faTruck,
  'Locations & Expansion': faMap,
  'Overview': faChartLine,
  'Delivery Services': faTruck,
  'Partners & Providers': faMotorcycle,
  'Delivery Requests': faListCheck,
  'Deliveries': faTruck,
  'Assignments': faListCheck,
  'Operations': faCog,
  'Shipments': faTruck,
  'Consolidation': faBoxesStacked,
  'Tracking': faMap,
};

export function NavList({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const { t } = useLocalization();
  const groups = useNavigationGroups();

  return (
    <nav aria-label="Primary" className={twMerge('flex-1 space-y-4 overflow-y-auto px-2', className)}>
      {groups.map((group) => (
        <div key={group.labelKey}>
          <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {t(group.labelKey)}
          </p>
          <ul className="space-y-1">
            {group.items.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  // Exact match where the path is only a parent of other
                  // entries: /home and /delivery must not stay highlighted
                  // while a sibling page (e.g. /delivery/shipments) is open.
                  end={item.path === '/home' || item.path === '/delivery'}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    twMerge(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-color/15 text-primary-dark dark:bg-primary-dark/20 dark:text-primary-color'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-dark-900 dark:hover:text-white'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        aria-hidden="true"
                        className={
                          isActive
                            ? 'text-primary-dark dark:text-primary-color'
                            : 'text-gray-400 dark:text-gray-500'
                        }
                      >
                        <FontAwesomeIcon
                          icon={ICONS[item.labelKey] ?? faFolderOpen}
                          fixedWidth
                        />
                      </span>
                      <span>{t(item.labelKey)}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}