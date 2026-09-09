import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronDown,
  faRightFromBracket,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/hooks/useAuth';
import { useLocalization } from '@/i18n/I18nProvider';
import { Avatar } from '@/components/common/Avatar';

export function UserMenu() {
  const { t } = useLocalization();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const name = user?.name ?? user?.email ?? 'Admin';

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-md p-1 hover:bg-gray-100 dark:hover:bg-dark-950"
      >
        <Avatar src={user?.image} name={name} size="sm" />
        <span className="hidden max-w-32 truncate text-sm font-medium text-gray-700 dark:text-gray-200 sm:block">
          {name}
        </span>
        <FontAwesomeIcon
          icon={faChevronDown}
          size="xs"
          className="text-gray-400"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-dark-600 dark:bg-dark-900"
        >
          <div className="border-b border-gray-200 px-4 py-3 dark:border-dark-600">
            <p className="truncate text-sm font-semibold text-gray-800 dark:text-white">
              {name}
            </p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              {user?.email}
            </p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={onLogout}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-dark-950"
          >
            <FontAwesomeIcon icon={faRightFromBracket} />
            {t('Logout')}
          </button>
        </div>
      )}
    </div>
  );
}