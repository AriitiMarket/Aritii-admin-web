import type { ReactNode } from 'react';
import { Card } from '@/components/common/Card';
import { twMerge } from 'tailwind-merge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowTrendUp, faArrowTrendDown } from '@fortawesome/free-solid-svg-icons';

export interface StatTrend {
  value: number | string;
  isPositive?: boolean;
  label?: string;
}

export interface StatCardProps {
  label?: string;
  value: string;
  icon?: ReactNode;
  hint?: string;
  trend?: StatTrend;
  className?: string;
  /** Accepted for callers that use the legacy card API. */
  title?: string;
  subtitle?: string;
  variant?: string;
}

export function StatCard({
  label,
  value,
  icon,
  hint,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card
      className={twMerge(
        'group relative flex min-h-[135px] flex-col justify-between gap-3 overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-sm dark:border-dark-700/80 dark:bg-dark-900/90 dark:hover:border-dark-600',
        className
      )}
    >
      {/* Top subtle emerald gradient line on hover */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 tabular-nums dark:text-white">
            {value}
          </p>
        </div>

        {icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20 shadow-xs transition-transform duration-200 group-hover:scale-105 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-500/30">
            {icon}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        {trend ? (
          <div className="flex items-center gap-1.5 font-semibold">
            <span
              className={twMerge(
                'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px]',
                trend.isPositive !== false
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
              )}
            >
              <FontAwesomeIcon
                icon={trend.isPositive !== false ? faArrowTrendUp : faArrowTrendDown}
                className="text-[10px]"
              />
              {trend.value}
            </span>
            {trend.label && (
              <span className="text-slate-400 dark:text-slate-500 font-normal">
                {trend.label}
              </span>
            )}
          </div>
        ) : hint ? (
          <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>
        ) : null}
      </div>
    </Card>
  );
}