/**
 * Lightweight i18n provider replacing next-intl.
 * Preserves the flat translation keys, JSON locale files and placeholders
 * from the legacy implementation. Supports:
 *   t('key')                    -> localized string
 *   t('nested.key')             -> dot-notation lookup
 *   t('Order {orderId}', {...}) -> placeholder interpolation
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getDefaultLocale,
  isAppLocale,
  MESSAGES,
  type AppLocale,
  type LocaleMessages,
} from './locales';

export interface TranslateParams {
  [key: string]: string | number;
}

export type TranslateFn = (key: string, values?: TranslateParams) => string;

interface I18nContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: TranslateFn;
  messages: LocaleMessages;
}

export const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const STORAGE_KEY = 'ariiti-locale';

function lookup(messages: LocaleMessages, key: string): unknown {
  if (!key || typeof key !== 'string') return undefined;
  const parts = key.split('.');
  let current: unknown = messages;
  for (const part of parts) {
    if (current !== null && typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

const interpolate = (value: string, values?: TranslateParams): string => {
  if (!values) return value;
  return Object.entries(values).reduce(
    (acc, [key, val]) => acc.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val)),
    value
  );
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(() => {
    const stored =
      typeof window !== 'undefined'
        ? window.localStorage.getItem(STORAGE_KEY)
        : null;
    return isAppLocale(stored) ? stored : getDefaultLocale();
  });

  const setLocale = useCallback((next: AppLocale) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
    document.documentElement.lang = next;
    setLocaleState(next);
  }, []);

  const t = useCallback<TranslateFn>(
    (key, values) => {
      if (!key || typeof key !== 'string') return '';
      let value = lookup(MESSAGES[locale], key);
      if (typeof value !== 'string') value = lookup(MESSAGES.en, key);
      if (typeof value !== 'string') return key;
      return interpolate(value, values);
    },
    [locale]
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t, messages: MESSAGES[locale] }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useLocalization(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useLocalization must be used within an I18nProvider');
  }
  return context;
}