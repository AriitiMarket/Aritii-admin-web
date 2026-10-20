import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string | ReactNode;
  render?: (row: T) => ReactNode;
  /** Show raw string value when no render fn is provided. */
  accessor?: (row: T) => string | number | undefined;
  className?: string;
}

/**
 * Column shape still used by the older console pages: the caption lives in
 * `label`, the cell renderer receives the raw cell value instead of the row
 * and `accessor` may be a plain field name.
 */
export interface LegacyColumn<T> {
  key?: string;
  label?: string;
  header?: string | ReactNode;
  width?: string;
  render?(value: unknown, ...rest: unknown[]): ReactNode;
  accessor?: string | ((row: T) => ReactNode);
  cell?: (row: T) => ReactNode;
  className?: string;
}

export type AnyColumn<T> = Column<T> | LegacyColumn<T>;

export interface DataTableProps<T> {
  columns: AnyColumn<T>[];
  rows?: T[];
  rowKey?: (row: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  /** Legacy collection alias. */
  data?: T[];
  /** Legacy pagination props. */
  onPageChange?: (page: number) => void;
  currentPage?: number;
  pageSize?: number;
  total?: number;
  pagination?: {
    page: number;
    setPage: (page: number) => void;
    limit: number;
    total: number;
  };
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription,
  onRowClick,
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

  const list = rows as T[];

  if (list.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        {emptyTitle}
        {emptyDescription && <p className="text-xs">{emptyDescription}</p>}
      </div>
    );
  }

  const hasRowClick = typeof onRowClick === 'function';

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-dark-600">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <caption className="sr-only">{emptyTitle}</caption>
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 dark:border-dark-600 dark:bg-dark-950">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map((row) => (
            <tr
              key={rowKey?.(row)}
              onClick={hasRowClick ? () => onRowClick?.(row) : undefined}
              className={
                hasRowClick
                  ? 'cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-dark-600/50 dark:hover:bg-dark-900'
                  : 'border-b border-gray-100 dark:border-dark-600/50'
              }
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-4 py-3 text-gray-700 dark:text-gray-200 ${column.className ?? ''}`}
                >
                  {column.render
                    ? column.render(row)
                    : column.accessor
                      ? typeof column.accessor === 'function'
                        ? String(column.accessor(row) ?? '—')
                        : null
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
