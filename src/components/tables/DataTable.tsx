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
  /** Legacy alias for `header`, used by the older console pages. */
  label?: string;
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
  /** Whether column contains numeric data (right-aligns content) */
  numeric?: boolean;
}

export type AnyColumn<T> = Column<T> | LegacyColumn<T>;

/**
 * Render one cell for either column shape.
 *
 * The modern shape renders the whole row (`render(row)`). The legacy shape
 * renders the raw cell value (`render(value)`) and may address a field by
 * name (`accessor: 'total'`), so the value is resolved first.
 */
function renderCell<T>(column: AnyColumn<T>, row: T): ReactNode {
  if (!row) return null;

  const legacy = column as LegacyColumn<T>;
  const modern = column as Column<T>;

  // 1. Explicit cell renderer always receives the row
  if (legacy.cell) return legacy.cell(row);

  // 2. String accessor (e.g. accessor: 'email')
  if (typeof legacy.accessor === 'string') {
    const value = (row as unknown as Record<string, unknown>)?.[legacy.accessor];
    if (legacy.render) return legacy.render(value, row);
    return value === undefined || value === null ? '—' : String(value);
  }

  // 3. Modern render function (render: (row) => ReactNode)
  if (modern.render) {
    // If a function accessor is also provided, support legacy render(val, row)
    if (typeof legacy.accessor === 'function') {
      const val = (legacy.accessor as (row: T) => ReactNode)(row);
      return (legacy.render as (value: unknown, ...rest: unknown[]) => ReactNode)(val, row);
    }
    // Modern render expects the entire row object
    return modern.render(row);
  }

  // 4. Accessor function with no render
  if (typeof modern.accessor === 'function') {
    const val = modern.accessor(row);
    return val === undefined || val === null ? '—' : String(val);
  }

  return null;
}

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
  ariaLabel?: string;
}

export function DataTable<T>({
  columns,
  rows,
  data,
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

  // `rows` is the modern prop; `data` is the legacy alias the older console
  // pages still pass.
  const list = (rows ?? data ?? []) as T[];

  if (list.length === 0) {
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
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-dark-700/80 dark:bg-dark-900">
      <div className="overflow-x-auto">
        <table aria-label={ariaLabel} className="w-full min-w-[640px] border-collapse text-left text-sm">
          <caption className="sr-only">{ariaLabel}</caption>
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/90 dark:border-dark-700/80 dark:bg-dark-950/90">
              {columns.map((column, columnIndex) => (
                <th
                  key={column.key ?? columnIndex}
                  scope="col"
                  style={column.width ? { width: column.width } : undefined}
                  className={`px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ${
                    column.numeric ? 'text-right' : 'text-left'
                  }`}
                >
                  {column.header ?? column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-dark-700/50">
            {list.map((row) => (
              <tr
                key={rowKey?.(row)}
                onClick={hasRowClick ? () => onRowClick?.(row) : undefined}
                onKeyDown={
                  hasRowClick
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onRowClick?.(row);
                        }
                      }
                    : undefined
                }
                tabIndex={hasRowClick ? 0 : undefined}
                aria-label={hasRowClick ? `Open ${ariaLabel} row` : undefined}
                className={
                  hasRowClick
                    ? 'cursor-pointer transition-colors duration-150 hover:bg-lime-50/40 dark:hover:bg-lime-950/20'
                    : 'transition-colors duration-150 hover:bg-slate-50/50 dark:hover:bg-dark-800/40'
                }
              >
                {columns.map((column, columnIndex) => (
                  <td
                    key={column.key ?? columnIndex}
                    className={`px-4 py-3.5 text-slate-700 dark:text-slate-200 ${
                      column.numeric ? 'text-right tabular-nums' : ''
                    } ${column.className ?? ''}`}
                  >
                    {renderCell(column, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
