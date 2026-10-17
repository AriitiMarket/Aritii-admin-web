import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { SearchInput } from '@/components/common/SearchInput';
import { SectorSelector } from '@/components/layout/SectorSelector';
import { NotificationsBell } from '@/components/layout/NotificationsBell';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import { UserMenu } from '@/components/layout/UserMenu';

export interface HeaderProps {
  onToggleSidebar: () => void;
  onToggleMobile: () => void;
}

export function Header({ onToggleSidebar, onToggleMobile }: HeaderProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  useEffect(() => {
    const value = search.trim();
    if (!value) return;
    const timer = window.setTimeout(() => {
      navigate(`/users?search=${encodeURIComponent(value)}`);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [navigate, search]);

  return (
    <header className="layout-top-container flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 px-4 shadow-sm backdrop-blur-sm dark:border-dark-600/60 dark:bg-dark-900/80 dark:text-white lg:px-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleMobile}
          aria-label="Open navigation menu"
          className="icon-button rounded-lg p-2 text-gray-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-dark-950 lg:hidden"
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="icon-button hidden rounded-lg p-2 text-gray-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-dark-950 lg:inline-flex"
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
        <div className="hidden md:block">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search users..."
            aria-label="Search"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <SectorSelector />
        <LocaleSwitcher />
        <NotificationsBell />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}