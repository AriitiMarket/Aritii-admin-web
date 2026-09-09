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
  faUserGroup,
  faUsers,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { useLocalization } from '@/i18n/I18nProvider';
import { useNavigationGroups } from '@/routes/navigation';
import { twMerge } from 'tailwind-merge';

const ICONS: Record<string, IconDefinition> = {
  Home: faHome,
  Users: faUsers,
  Sellers: faUserGroup,
  Stores: faStore,
  Riders: faMotorcycle,
  Customers: faUserGroup,
  Disputes: faHeadset,
  Categories: faBoxesStacked,
  Sectors: faLayerGroup,
  'Pending Reviews': faStar,
  Orders: faListCheck,
  Analytics: faChartLine,
  Admins: faUsers,
  Settings: faCog,
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
                  end={item.path === '/home'}
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