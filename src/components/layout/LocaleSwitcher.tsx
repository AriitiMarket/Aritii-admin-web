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
    <div className="flex items-center gap-1 rounded-md border border-gray-300 px-2 dark:border-dark-600">
      <span className="text-gray-400">
        <FontAwesomeIcon icon={faGlobe} size="xs" />
      </span>
      <SelectField
        aria-label="Language"
        value={locale}
        options={APP_LOCALES.map((code) => ({
          value: code,
          label: LOCALE_LABELS[code],
        }))}
        onChange={(event) => setLocale(event.target.value as never)}
        className="h-8 border-0 bg-transparent pl-1 pr-6 dark:border-0"
      />
    </div>
  );
}