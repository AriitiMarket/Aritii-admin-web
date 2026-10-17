import type { ReactNode } from 'react';
import { Button } from '@/components/common/Button';
import { SearchInput } from '@/components/common/SearchInput';
import type { SelectOption } from '@/components/forms/SelectField';

/**
 * The single, consistent filter + action bar at the TOP of every tab.
 *
 * Design rules it enforces:
 *  - one tight HORIZONTAL row of filters, labels inline beside each control
 *    (SelectField stacks its label above, which made the bar tall and loose);
 *  - the row never wraps on desktop — it scrolls horizontally instead, so the
 *    filters always stay "close to the top" and next to each other;
 *  - on mobile the row keeps the same inline shape and simply scrolls, which
 *    is the standard admin pattern and avoids a tall stacked column;
 *  - "Reset Filters" + the tab's primary action always sit on the right.
 */
export interface FilterDef {
  key: string;
  label: string;
  value: string;
  /** Choices for a select filter — omitted for `type: 'date'` or `type: 'text'`. */
  options?: SelectOption[];
  /** `select` (default), `date` for date-range pickers, or `text` for text input. */
  type?: 'select' | 'date' | 'text';
  onChange: (value: string) => void;
}

const INLINE_CONTROL_CLASS =
  'h-9 rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-800 focus:border-primary-dark focus:outline-none focus:ring-1 focus:ring-primary-dark dark:border-dark-600 dark:bg-dark-900 dark:text-white';

/** Compact inline labelled control used inside the filter row. */
function InlineFilter({ label, value, options = [], type = 'select', onChange }: FilterDef) {
  return (
    <label className="flex shrink-0 items-center gap-1.5">
      <span className="whitespace-nowrap text-xs font-medium text-gray-600 dark:text-gray-300">
        {label}
      </span>
      {type === 'date' ? (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className={INLINE_CONTROL_CLASS}
        />
      ) : type === 'text' ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          placeholder={label}
          className={INLINE_CONTROL_CLASS}
        />
      ) : (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className={`${INLINE_CONTROL_CLASS} pr-7`}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </label>
  );
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filters,
  onReset,
  isFiltered,
  actions,
  resultSummary,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  filters: FilterDef[];
  onReset: () => void;
  isFiltered: boolean;
  actions?: ReactNode;
  resultSummary?: string;
}) {
  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-white dark:border-dark-600 dark:bg-dark-900">
      {/* Filters: one horizontal, non-wrapping, scrollable row. */}
      <div className="flex items-center gap-3 overflow-x-auto px-3 py-2.5 scrollbar-thin">
        <div className="w-48 shrink-0 sm:w-56">
          <SearchInput
            value={searchValue}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
          />
        </div>
        {filters.map(({ key, ...f }) => (
          <InlineFilter key={key} {...f} />
        ))}
      </div>

      {/* Consistent action row. */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-3 py-2 dark:border-dark-600">
        <div className="flex items-center gap-3 shrink-0">
          <Button variant="ghost" size="sm" onClick={onReset} disabled={!isFiltered}>
            Reset Filters
          </Button>
          {resultSummary && (
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{resultSummary}</span>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

