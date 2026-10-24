import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faTimes,
  faStore,
  faListCheck,
  faBoxesStacked,
  faUsers,
  faTruck,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import { useLocalization } from '@/i18n/I18nProvider';

type SearchScope = 'all' | 'stores' | 'orders' | 'products' | 'users';

interface QuickLink {
  label: string;
  scope: SearchScope;
  path: string;
  icon: typeof faStore;
  hint: string;
}

export function HeaderSearch() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('all');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickLinks: QuickLink[] = [
    { label: t('Shops & Stores'), scope: 'stores', path: '/stores', icon: faStore, hint: t('Manage vendor shops') },
    { label: t('Orders'), scope: 'orders', path: '/orders', icon: faListCheck, hint: t('Customer orders & invoices') },
    { label: t('Products'), scope: 'products', path: '/commerce/products', icon: faBoxesStacked, hint: t('Product catalog & stock') },
    { label: t('Users & Sellers'), scope: 'users', path: '/users', icon: faUsers, hint: t('Buyer & seller directory') },
    { label: t('Deliveries'), scope: 'orders', path: '/delivery/deliveries', icon: faTruck, hint: t('Real-time logistics') },
  ];

  // Global Ctrl+K / Cmd+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (overrideScope?: SearchScope) => {
    const activeScope = overrideScope || scope;
    const trimmed = query.trim();
    setIsOpen(false);

    if (!trimmed) {
      if (activeScope === 'stores') navigate('/stores');
      else if (activeScope === 'orders') navigate('/orders');
      else if (activeScope === 'products') navigate('/commerce/products');
      else if (activeScope === 'users') navigate('/users');
      else navigate('/stores');
      return;
    }

    const encoded = encodeURIComponent(trimmed);
    switch (activeScope) {
      case 'stores':
        navigate(`/stores?search=${encoded}`);
        break;
      case 'orders':
        navigate(`/orders?search=${encoded}`);
        break;
      case 'products':
        navigate(`/commerce/products?search=${encoded}`);
        break;
      case 'users':
        navigate(`/users?search=${encoded}`);
        break;
      default:
        // Default 'all' searches shops first or matches context
        navigate(`/stores?search=${encoded}`);
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="group relative flex items-center">
        {/* Search Icon */}
        <span className="pointer-events-none absolute left-3.5 flex items-center text-slate-400 transition-colors group-focus-within:text-emerald-600 dark:text-slate-500 dark:group-focus-within:text-emerald-400">
          <FontAwesomeIcon icon={faSearch} className="text-sm" />
        </span>

        {/* Input */}
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={t('Search shops, orders, products, users...')}
          className="h-10 w-full rounded-xl border border-slate-200/90 bg-slate-100/70 pl-10 pr-20 text-sm text-slate-800 placeholder-slate-400 shadow-inner backdrop-blur-sm transition-all focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:border-dark-600 dark:bg-dark-950/80 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-emerald-400 dark:focus:bg-dark-900 dark:focus:ring-emerald-400/20"
        />

        {/* Right side controls: Clear + Shortcut badge */}
        <div className="absolute right-2.5 flex items-center gap-1.5">
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-dark-700 dark:hover:text-slate-200"
              aria-label="Clear search"
            >
              <FontAwesomeIcon icon={faTimes} className="text-xs" />
            </button>
          )}

          <kbd className="hidden sm:inline-flex items-center rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-slate-400 shadow-xs dark:border-dark-700 dark:bg-dark-800 dark:text-slate-400">
            Ctrl K
          </kbd>
        </div>
      </div>

      {/* Modern Popover / Search Results Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-2xl backdrop-blur-md dark:border-dark-600 dark:bg-dark-900/95">
          {/* Quick Scope Filter Chips */}
          <div className="mb-2 flex items-center gap-1 border-b border-slate-100 px-2 pb-2 text-xs dark:border-dark-700">
            <span className="font-medium text-slate-400 dark:text-slate-500 mr-1">{t('Scope')}:</span>
            {(['all', 'stores', 'orders', 'products', 'users'] as SearchScope[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition-all ${
                  scope === s
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-dark-800'
                }`}
              >
                {s === 'all' ? t('All') : t(s)}
              </button>
            ))}
          </div>

          {/* Dynamic Search Actions when user typed */}
          {query.trim() ? (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t('Search For')} &ldquo;{query}&rdquo; {t('in')}:
              </div>
              <button
                type="button"
                onClick={() => handleSearchSubmit('stores')}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 dark:text-slate-200 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                    <FontAwesomeIcon icon={faStore} className="text-xs" />
                  </span>
                  <div>
                    <p className="font-medium">{t('Shops / Stores')}</p>
                    <p className="text-[11px] text-slate-400">Search marketplace vendor stores</p>
                  </div>
                </div>
                <FontAwesomeIcon icon={faArrowRight} className="text-xs opacity-60" />
              </button>

              <button
                type="button"
                onClick={() => handleSearchSubmit('orders')}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-900 dark:text-slate-200 dark:hover:bg-blue-950/40 dark:hover:text-blue-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                    <FontAwesomeIcon icon={faListCheck} className="text-xs" />
                  </span>
                  <div>
                    <p className="font-medium">{t('Orders & Deliveries')}</p>
                    <p className="text-[11px] text-slate-400">Search customer orders & transactions</p>
                  </div>
                </div>
                <FontAwesomeIcon icon={faArrowRight} className="text-xs opacity-60" />
              </button>

              <button
                type="button"
                onClick={() => handleSearchSubmit('products')}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-900 dark:text-slate-200 dark:hover:bg-purple-950/40 dark:hover:text-purple-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                    <FontAwesomeIcon icon={faBoxesStacked} className="text-xs" />
                  </span>
                  <div>
                    <p className="font-medium">{t('Catalog Products')}</p>
                    <p className="text-[11px] text-slate-400">Search products across all vendors</p>
                  </div>
                </div>
                <FontAwesomeIcon icon={faArrowRight} className="text-xs opacity-60" />
              </button>

              <button
                type="button"
                onClick={() => handleSearchSubmit('users')}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 dark:text-slate-200 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                    <FontAwesomeIcon icon={faUsers} className="text-xs" />
                  </span>
                  <div>
                    <p className="font-medium">{t('Users & Customers')}</p>
                    <p className="text-[11px] text-slate-400">Search registered buyers & sellers</p>
                  </div>
                </div>
                <FontAwesomeIcon icon={faArrowRight} className="text-xs opacity-60" />
              </button>
            </div>
          ) : (
            /* Quick Navigation when input is empty */
            <div>
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t('Quick Access')}
              </div>
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {quickLinks.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      navigate(item.path);
                    }}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors hover:bg-slate-100 dark:hover:bg-dark-800"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-dark-700 dark:text-slate-300">
                      <FontAwesomeIcon icon={item.icon} className="text-xs" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {item.label}
                      </p>
                      <p className="truncate text-[10px] text-slate-400 dark:text-slate-500">
                        {item.hint}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
