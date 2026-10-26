import type { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 rounded-xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50 shadow-sm dark:border-dark-700/60 dark:from-dark-900 dark:to-dark-950/80 dark:shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 sm:px-8 sm:py-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}