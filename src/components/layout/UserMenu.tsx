import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronDown,
  faRightFromBracket,
  faShieldHalved,
  faGear,
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
  const roleLabel =
    user?.role === 'SUPER_ADMIN'
      ? t('Super Admin')
      : user?.role === 'OPERATIONS_ADMIN'
        ? t('Operations')
        : (user?.role || t('Admin'));

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-xl border border-slate-200/90 bg-slate-50/70 p-1.5 pr-2.5 shadow-xs transition-all hover:border-slate-300 hover:bg-slate-100/80 dark:border-dark-600 dark:bg-dark-950/60 dark:hover:bg-dark-900"
      >
        <div className="relative">
          <Avatar src={user?.image} name={name} size="sm" />
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-dark-900" />
        </div>
        <div className="hidden text-left lg:block">
          <p className="max-w-[120px] truncate text-xs font-bold text-slate-800 dark:text-white">
            {name}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            {roleLabel}
          </p>
        </div>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`text-[10px] text-slate-400 transition-transform duration-200 ${
            open ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-md dark:border-dark-600 dark:bg-dark-900/95"
        >
          {/* Header Card */}
          <div className="border-b border-slate-100 bg-slate-50/50 p-4 dark:border-dark-700 dark:bg-dark-950/40">
            <div className="flex items-center gap-3">
              <Avatar src={user?.image} name={name} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-800 dark:text-white">
                  {name}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {user?.email}
                </p>
                <span className="mt-1 inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-1.5 space-y-0.5">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate('/settings/security');
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-dark-800"
            >
              <FontAwesomeIcon icon={faShieldHalved} className="text-slate-400 w-4" />
              {t('Security & 2FA')}
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate('/settings/platform');
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-dark-800"
            >
              <FontAwesomeIcon icon={faGear} className="text-slate-400 w-4" />
              {t('Platform Settings')}
            </button>
          </div>

          <div className="border-t border-slate-100 p-1.5 dark:border-dark-700">
            <button
              type="button"
              role="menuitem"
              onClick={onLogout}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <FontAwesomeIcon icon={faRightFromBracket} className="w-4" />
              {t('Logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}