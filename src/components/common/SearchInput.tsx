import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

export function SearchInput({
  value,
  onChange,
  placeholder,
  'aria-label': ariaLabel,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  'aria-label'?: string;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <FontAwesomeIcon icon={faSearch} size="xs" />
      </span>
      <input
        type="search"
        value={value}
        aria-label={ariaLabel ?? placeholder}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-800 shadow-sm placeholder:text-gray-400 transition-[border-color,box-shadow] focus:border-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-dark/20 dark:border-dark-600 dark:bg-dark-900 dark:text-white sm:w-72"
      />
    </div>
  );
}