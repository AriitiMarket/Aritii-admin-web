import { useState } from 'react';
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
  faChevronDown,
  faChevronRight,
  faWallet,
  faMoneyBillWave,
  faPercent,
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
  'Ports': faBuilding,
  'Active Deliveries': faClock,
  'Delivery & Logistics': faTruck,
  'Overview': faChartLine,
  'Providers': faMotorcycle,
  'Requests': faListCheck,
  'Deliveries': faTruck,
  'Deliverer payouts': faMoneyBillWave,
  'Seller Wallets': faWallet,
  'Seller Payouts': faMoneyBillWave,
  'Commission Settings': faPercent,
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

  // Track expanded state for each group
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    groups.forEach((group) => {
      // Groups with single items are always expanded
      // Multi-item groups use defaultCollapsed if specified, default to false
      if (group.items.length === 1) {
        initial[group.labelKey] = true;
      } else {
        initial[group.labelKey] = group.defaultCollapsed !== true;
      }
    });
    return initial;
  });

  const toggleGroup = (labelKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [labelKey]: !prev[labelKey],
    }));
  };

  return (
    <nav aria-label="Primary" className={twMerge('flex-1 space-y-2 overflow-y-auto px-3 py-4', className)}>
      {groups.map((group) => {
        const isSingleItem = group.items.length === 1;
        const isExpanded = expandedGroups[group.labelKey];

        if (isSingleItem) {
          // Single item groups are always expanded (no collapse)
          return (
            <div key={group.labelKey}>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/home' || item.path === '/delivery'}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        twMerge(
                          'group flex min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark',
                          isActive
                            ? 'bg-lime-100 text-lime-900 font-semibold shadow-sm border-l-4 border-lime-500 dark:bg-lime-900/30 dark:text-lime-400 dark:border-lime-400'
                            : 'text-gray-600 hover:bg-slate-50 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-dark-950 dark:hover:text-white'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            aria-hidden="true"
                            className={
                              isActive
                                ? 'text-lime-900 dark:text-lime-400'
                                : 'text-gray-400 dark:text-gray-500'
                            }
                          >
                            <FontAwesomeIcon
                              icon={ICONS[item.labelKey] ?? faFolderOpen}
                              fixedWidth
                            />
                          </span>
                          <span className="truncate">{t(item.labelKey)}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        }

        // Multi-item groups with collapsible functionality
        return (
          <div key={group.labelKey}>
            <button
              type="button"
              onClick={() => toggleGroup(group.labelKey)}
              className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-semibold capitalize text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-dark-900 dark:hover:text-white transition-all rounded-lg"
              aria-expanded={isExpanded}
            >
              <span>{t(group.labelKey)}</span>
              <FontAwesomeIcon
                icon={isExpanded ? faChevronDown : faChevronRight}
                className="text-[10px] transition-transform"
              />
            </button>
            {isExpanded && (
              <ul className="mt-1 space-y-1">
                {group.items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/home' || item.path === '/delivery'}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        twMerge(
                          'group flex min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark',
                          isActive
                            ? 'bg-lime-100 text-lime-900 font-semibold shadow-sm border-l-4 border-lime-500 dark:bg-lime-900/30 dark:text-lime-400 dark:border-lime-400'
                            : 'text-gray-600 hover:bg-slate-50 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-dark-950 dark:hover:text-white'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            aria-hidden="true"
                            className={
                              isActive
                                ? 'text-lime-900 dark:text-lime-400'
                                : 'text-gray-400 dark:text-gray-500'
                            }
                          >
                            <FontAwesomeIcon
                              icon={ICONS[item.labelKey] ?? faFolderOpen}
                              fixedWidth
                            />
                          </span>
                          <span className="truncate">{t(item.labelKey)}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}