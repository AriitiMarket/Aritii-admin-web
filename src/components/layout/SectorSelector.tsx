import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore } from '@fortawesome/free-solid-svg-icons';
import { useLocalization } from '@/i18n/I18nProvider';
import { useSector } from '@/hooks/useSector';
import { SelectField } from '@/components/forms/SelectField';

export function SectorSelector() {
  const { t } = useLocalization();
  const { sectors, selectedSector, setSelectedSector, loading } = useSector();

  return (
    <div className="hidden items-center gap-1 sm:flex">
      <span className="text-gray-400" aria-hidden="true">
        <FontAwesomeIcon icon={faStore} size="xs" />
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
        className="h-8 w-44 border-0 bg-transparent pl-2 pr-6 text-sm dark:border-0"
      />
    </div>
  );
}