import type { ReactNode } from 'react';
import { Card } from '@/components/common/Card';
import { twMerge } from 'tailwind-merge';

export interface StatCardProps {
  label?: string;
  value: string;
  icon?: ReactNode;
  hint?: string;
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
  className,
}: StatCardProps) {
  return (
    <Card className={twMerge('group flex min-h-[132px] flex-col justify-between gap-4 overflow-hidden', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">{label}</p>
        {icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-color/15 text-primary-dark transition-transform group-hover:scale-105 dark:text-primary-color">
            {icon}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">{value}</p>
        {hint && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
      </div>
    </Card>
  );
}