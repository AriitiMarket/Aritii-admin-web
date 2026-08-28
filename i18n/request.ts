import { getUserLocale } from '@/lib/utils/methods/locale';
import { getRequestConfig } from 'next-intl/server';
import { locales } from '@/config';

export default getRequestConfig(async () => {
  const locale = await getUserLocale();
  const safeLocale = locales.includes(locale) ? locale : 'en';

  return {
    locale: safeLocale,
    messages: (await import(`../locales/${safeLocale}.json`)).default,
  };
});
