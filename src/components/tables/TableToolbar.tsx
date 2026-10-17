import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';
import { SearchInput } from '@/components/common/SearchInput';
import { Button } from '@/components/common/Button';

export function TableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  searchLabel = 'Search',
  filters,
  actions,
  resultCount,
  resultLabel,
  hasActiveFilters = false,
  onClearFilters,
  className,
}: {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchLabel?: string;
  filters?: ReactNode;
  actions?: ReactNode;
  resultCount?: number | string;
  resultLabel?: string;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  className?: string;
}) {
  return (
    <div
      className={twMerge(
        'flex flex-col gap-3 rounded-xl border border-gray-200/80 bg-white p-3 shadow-sm dark:border-dark-600 dark:bg-dark-900 sm:flex-row sm:flex-wrap sm:items-center',
        className
      )}
    >
      {resultCount !== undefined && (
        <span className="text-sm text-gray-500 dark:text-gray-400 sm:mr-auto">
          {resultCount} {resultLabel ?? 'records'}
        </span>
      )}
      {onSearchChange && (
        <SearchInput
          value={search ?? ''}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          aria-label={searchLabel}
        />
      )}
      {filters}
      {hasActiveFilters && onClearFilters && (
        <Button type="button" variant="ghost" size="sm" onClick={onClearFilters}>
          Clear filters
        </Button>
      )}
      {actions}
    </div>
  );
}
