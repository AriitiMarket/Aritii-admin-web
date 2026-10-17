import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string | ReactNode;
  render?: (row: T) => ReactNode;
  /** Show raw string value when no render fn is provided. */
  accessor?: (row: T) => string | number | undefined;
  className?: string;
  /** Optional column width for proportional layout */
  width?: string;
  /** Whether column contains numeric data (right-aligns content) */
  numeric?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  ariaLabel?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription,
  onRowClick,
  ariaLabel = 'Data table',
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div aria-busy="true" className="space-y-2 py-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-10 animate-pulse rounded bg-gray-100 dark:bg-dark-600/40"
          />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="py-8">
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-6 py-12 text-center dark:border-dark-600">
          <div className="text-3xl" aria-hidden="true">
            📋
          </div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {emptyTitle}
          </p>
          {emptyDescription && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{emptyDescription}</p>
          )}
        </div>
      </div>
    );
  }

  const hasRowClick = typeof onRowClick === 'function';

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200/80 bg-white shadow-sm dark:border-dark-600 dark:bg-dark-900">
      <table aria-label={ariaLabel} className="w-full min-w-[640px] border-collapse text-left text-sm">
        <caption className="sr-only">{ariaLabel}</caption>
        <thead>
          <tr className="border-b border-gray-200 bg-primary-color/10 dark:border-dark-600 dark:bg-dark-950">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                style={column.width ? { width: column.width } : undefined}
                className={`px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-gray-600 dark:text-gray-300 ${
                  column.numeric ? 'text-right' : 'text-left'
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={hasRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={
                hasRowClick
                  ? (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onRowClick(row);
                      }
                    }
                  : undefined
              }
              tabIndex={hasRowClick ? 0 : undefined}
              aria-label={hasRowClick ? `Open ${ariaLabel} row` : undefined}
              className={
                hasRowClick
                  ? 'cursor-pointer border-b border-gray-100 transition-colors hover:bg-primary-color/5 dark:border-dark-600/50 dark:hover:bg-dark-950'
                  : 'border-b border-gray-100 dark:border-dark-600/50'
              }
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-4 py-3 text-gray-700 dark:text-gray-200 ${
                    column.numeric ? 'text-right' : ''
                  } ${column.className ?? ''}`}
                >
                  {column.render
                    ? column.render(row)
                    : column.accessor
                      ? String(column.accessor(row) ?? '—')
                      : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}