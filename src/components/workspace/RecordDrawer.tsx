import { useEffect, type ReactNode } from 'react';
import { Button } from '@/components/common/Button';
import { StatusBadge, type StatusVariant } from '@/components/common/StatusBadge';

/**
 * ONE detail pattern shared by Locations, Zones, Ports and Routes so the module
 * feels like a single system instead of four unrelated CRUD pages.
 *
 *   Header  — name, status, primary actions
 *   Summary — key facts + related counts
 *   Tabs    — related operational information
 *   Activity— recent changes / audit history
 *
 * It renders as a right-hand drawer so the admin never loses the list they came
 * from (the module's "expandable details instead of navigating away" rule), and
 * on mobile it becomes a full-height sheet.
 */
export interface DetailTab {
  id: string;
  label: string;
  content: ReactNode;
}

export interface SummaryItem {
  label: string;
  value: ReactNode;
}

export function RecordDrawer({
  open,
  onClose,
  title,
  subtitle,
  statusLabel,
  statusVariant,
  actions,
  summary,
  body,
  tabs,
  activeTab,
  onTabChange,
  loading,
  error,
  onRetry,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  statusLabel?: string;
  statusVariant?: StatusVariant;
  actions?: ReactNode;
  summary: SummaryItem[];
  /**
   * Optional tab-free content rendered after the summary. Use this for simple,
   * single-view panels; callers with related information to switch between pass
   * `tabs` instead (or alongside).
   */
  body?: ReactNode;
  tabs?: DetailTab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  const current = (tabs ?? []).find((t) => t.id === activeTab) ?? tabs?.[0];

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white shadow-xl dark:bg-dark-900">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-dark-600">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="heading-6 truncate">{title}</h2>
              {statusLabel && <StatusBadge label={statusLabel} variant={statusVariant} />}
            </div>
            {subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close details">
            Close
          </Button>
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-5 py-3 dark:border-dark-600">
            {actions}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <div className="space-y-2" aria-busy="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-gray-100 dark:bg-dark-600/40" />
              ))}
            </div>
          )}

          {!loading && error && (
            <div role="alert" className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              <p>{error}</p>
              {onRetry && (
                <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
                  Retry
                </Button>
              )}
            </div>
          )}

          {!loading && !error && (
            <>
              {summary.length > 0 && (
                <dl className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {summary.map((item) => (
                    <div key={item.label} className="rounded-md border border-gray-100 p-3 dark:border-dark-600">
                      <dt className="text-xs uppercase tracking-wide text-gray-500">{item.label}</dt>
                      <dd className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-100">
                        {item.value ?? '—'}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              {body}

              {(tabs ?? []).length > 0 && (
                <>
                  <div
                    className="mb-3 flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-dark-600"
                    role="tablist"
                  >
                    {(tabs ?? []).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        role="tab"
                        aria-selected={current?.id === t.id}
                        onClick={() => onTabChange?.(t.id)}
                        className={
                          current?.id === t.id
                            ? 'whitespace-nowrap border-b-2 border-primary-dark px-3 py-2 text-sm font-medium text-primary-dark'
                            : 'whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <div role="tabpanel">{current?.content}</div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
