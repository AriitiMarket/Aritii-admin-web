/**
 * Locale registry — preserves the existing translation keys/JSON files from
 * the previous next-intl implementation. Only the Aritii locales are bundled.
 */
import en from '../../locales/en.json';
import om from '../../locales/om.json';
import am from '../../locales/am.json';

export type AppLocale = 'en' | 'om' | 'am';

export type LocaleMessages = Record<string, unknown>;

export const APP_LOCALES: AppLocale[] = ['en', 'om', 'am'];

export const LOCALE_LABELS: Record<AppLocale, string> = {
  en: 'English',
  om: 'Afaan Oromoo',
  am: 'አማርኛ',
};

export const MESSAGES: Record<AppLocale, LocaleMessages> = {
  en: en as LocaleMessages,
  om: om as LocaleMessages,
  am: am as LocaleMessages,
};

export const isAppLocale = (value: unknown): value is AppLocale => {
  return value === 'en' || value === 'om' || value === 'am';
};

export const getDefaultLocale = (): AppLocale => {
  const stored =
    typeof window !== 'undefined' ? window.localStorage.getItem('ariiti-locale') : null;
  return isAppLocale(stored) ? stored : 'en';
};