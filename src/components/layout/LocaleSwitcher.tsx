import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import { useLocalization } from '@/i18n/I18nProvider';
import {
  APP_LOCALES,
  LOCALE_LABELS,
} from '@/i18n/locales';
import { SelectField } from '@/components/forms/SelectField';

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocalization();
  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50/70 px-2.5 py-1 text-xs font-medium shadow-xs transition-all hover:border-slate-300 dark:border-dark-600 dark:bg-dark-950/60">
      <span className="text-slate-400 dark:text-slate-500">
        <FontAwesomeIcon icon={faGlobe} className="text-xs" />
      </span>
      <SelectField
        aria-label="Language"
        value={locale}
        options={APP_LOCALES.map((code) => ({
          value: code,
          label: LOCALE_LABELS[code],
        }))}
        onChange={(event) => setLocale(event.target.value as never)}
        className="h-7 border-0 bg-transparent pl-1 pr-5 text-xs font-medium text-slate-700 focus:ring-0 dark:border-0 dark:text-slate-200"
      />
    </div>
  );
}