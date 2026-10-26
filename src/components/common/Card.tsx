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
        'rounded-xl border border-slate-200/60 bg-white shadow-sm dark:border-dark-700/60 dark:bg-dark-900 dark:shadow-md',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}