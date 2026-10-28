import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faCheck } from '@fortawesome/free-solid-svg-icons';
import { useLocalization } from '@/i18n/I18nProvider';
import {
  APP_LOCALES,
  LOCALE_LABELS,
  type AppLocale,
} from '@/i18n/locales';

export function LocaleSwitcher() {
  const { locale, setLocale, t } = useLocalization();
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
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={t('Select language')}
        aria-haspopup="menu"
        aria-expanded={open}
        title={LOCALE_LABELS[locale] || 'Language'}
        className="rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-950"
      >
        <FontAwesomeIcon icon={faGlobe} />
      </button>

      {open && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 top-full z-40 mt-2 min-w-[10rem] overflow-hidden rounded-xl border border-slate-200 bg-white/95 py-1 shadow-xl backdrop-blur-md dark:border-dark-600 dark:bg-dark-900/95"
        >
          <div className="border-b border-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-dark-700/60 dark:text-slate-500">
            {t('Language')}
          </div>
          <div className="p-1">
            {APP_LOCALES.map((code) => {
              const isSelected = locale === code;
              return (
                <button
                  key={code}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setLocale(code as AppLocale);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-lime-50 font-semibold text-lime-700 dark:bg-lime-950/50 dark:text-lime-400'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-dark-800'
                  }`}
                >
                  <span>{LOCALE_LABELS[code]}</span>
                  {isSelected && (
                    <FontAwesomeIcon
                      icon={faCheck}
                      className="ml-2 text-xs text-lime-600 dark:text-lime-400"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}