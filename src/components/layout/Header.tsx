import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { HeaderSearch } from '@/components/layout/HeaderSearch';
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
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md shadow-xs transition-colors dark:border-dark-700/80 dark:bg-dark-900/80 lg:px-6">
      {/* Left: Sidebar Toggle & Portal Status */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobile}
          aria-label="Open navigation menu"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-dark-600 dark:text-slate-300 dark:hover:bg-dark-800 dark:hover:text-white lg:hidden"
        >
          <FontAwesomeIcon icon={faBars} className="text-sm" />
        </button>

        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="hidden h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:border-dark-600 dark:text-slate-300 dark:hover:border-dark-500 dark:hover:bg-dark-800 dark:hover:text-white lg:flex"
        >
          <FontAwesomeIcon icon={faBars} className="text-sm" />
        </button>

        <div className="hidden items-center gap-2 xl:flex pl-1">
          <span className="flex h-2 w-2 rounded-full bg-lime-500 animate-pulse" />
          <span className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500">
            MARKETPLACE ADMIN
          </span>
        </div>
      </div>

      {/* Center: Search Bar (Centered, Modern, Powerful) */}
      <div className="flex flex-1 items-center justify-center px-4 sm:px-8">
        <HeaderSearch />
      </div>

      {/* Right: Sector, Locale, Notifications, Theme, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        <SectorSelector />
        <LocaleSwitcher />
        <NotificationsBell />
        <ThemeToggle />
        <div className="hidden h-5 w-px bg-slate-200 dark:bg-dark-700 sm:block" />
        <UserMenu />
      </div>
    </header>
  );
}