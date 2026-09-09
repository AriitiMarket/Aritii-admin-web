import type { ReactNode } from 'react';
import { Card } from '@/components/common/Card';
import { twMerge } from 'tailwind-merge';

export function StatCard({
  label,
  value,
  icon,
  hint,
  className,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <Card className={twMerge('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between">
        <p className="card-h2 text-gray-500 dark:text-gray-400">{label}</p>
        {icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-color/15 text-primary-dark dark:text-primary-color">
            {icon}
          </span>
        )}
      </div>
      <p className="heading-5 dark:text-white">{value}</p>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </Card>
  );
}