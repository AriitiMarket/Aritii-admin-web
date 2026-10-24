import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { useLocalization } from '@/i18n/I18nProvider';
import { useSector } from '@/hooks/useSector';
import { SelectField } from '@/components/forms/SelectField';

export function SectorSelector() {
  const { t } = useLocalization();
  const { sectors, selectedSector, setSelectedSector, loading } = useSector();

  return (
    <div className="hidden items-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50/70 px-2.5 py-1 text-xs font-medium shadow-xs transition-all hover:border-slate-300 dark:border-dark-600 dark:bg-dark-950/60 sm:flex">
      <span className="text-lime-600 dark:text-lime-400" aria-hidden="true">
        <FontAwesomeIcon icon={faLayerGroup} className="text-xs" />
      </span>
      <SelectField
        aria-label="Marketplace sector"
        value={selectedSector}
        onChange={(event) => setSelectedSector(event.target.value)}
        disabled={loading}
        options={[
          { value: 'all', label: t('All sectors') },
          ...sectors.map((sector) => ({ value: sector.id, label: sector.name })),
        ]}
        className="h-7 border-0 bg-transparent pl-1 pr-5 text-xs font-medium text-slate-700 focus:ring-0 dark:border-0 dark:text-slate-200"
      />
    </div>
  );
}