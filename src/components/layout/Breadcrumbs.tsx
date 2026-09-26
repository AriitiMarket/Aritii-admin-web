import { Link, useLocation } from 'react-router-dom';
import { useLocalization } from '@/i18n/I18nProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faHome } from '@fortawesome/free-solid-svg-icons';

/** Path-prefix -> i18n key mapping for breadcrumb labels. */
const CRUMB_KEYS: Array<{ match: RegExp; key: string }> = [
  { match: /^\/home$/, key: 'Home' },
  { match: /^\/users/, key: 'Users' },
  { match: /^\/sellers/, key: 'Sellers' },
  { match: /^\/stores\/pending/, key: 'Pending' },
  { match: /^\/stores/, key: 'Stores' },
  { match: /^\/riders\/pending/, key: 'Pending' },
  { match: /^\/riders/, key: 'Riders' },
  { match: /^\/customers/, key: 'Customers' },
  { match: /^\/disputes/, key: 'Disputes' },
  { match: /^\/admins\/new/, key: 'New Admin' },
  { match: /^\/admins/, key: 'Admins' },
  { match: /^\/categories/, key: 'Categories' },
  { match: /^\/reviews\/pending/, key: 'Pending Reviews' },
  { match: /^\/reviews/, key: 'Reviews' },
  { match: /^\/orders/, key: 'Orders' },
  { match: /^\/analytics\/reports/, key: 'Reports' },
  { match: /^\/analytics/, key: 'Analytics' },
  { match: /^\/settings\/platform/, key: 'Platform' },
  { match: /^\/settings\/notifications/, key: 'Notifications' },
  { match: /^\/settings\/system/, key: 'System' },
  { match: /^\/settings/, key: 'Settings' },
];

export function Breadcrumbs() {
  const { t } = useLocalization();
  const { pathname } = useLocation();

  if (pathname === '/home') return null;

  const crumbKey =
    CRUMB_KEYS.find((entry) => entry.match.test(pathname))?.key ?? 'Home';

  return (
    <nav aria-label="Breadcrumb" className="mb-2 text-sm text-gray-500 dark:text-gray-400">
      <ol className="flex items-center gap-1.5">
        <li>
          <Link
            to="/home"
            className="inline-flex items-center gap-1 hover:text-primary-dark"
          >
            <FontAwesomeIcon icon={faHome} size="xs" />
            {t('Home')}
          </Link>
        </li>
        <li aria-hidden="true">
          <FontAwesomeIcon icon={faChevronRight} size="xs" />
        </li>
        <li aria-current="page" className="font-medium text-gray-800 dark:text-gray-100">
          {t(crumbKey)}
        </li>
      </ol>
    </nav>
  );
}