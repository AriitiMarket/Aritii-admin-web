import { twMerge } from 'tailwind-merge';
import type { HTMLAttributes } from 'react';

export function Card({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge(
        'rounded-xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/50 dark:bg-slate-900 dark:shadow-md',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}