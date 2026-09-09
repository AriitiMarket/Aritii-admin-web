import { twMerge } from 'tailwind-merge';

export function Skeleton({
  className,
  rows = 1,
}: {
  className?: string;
  rows?: number;
}) {
  return (
    <div aria-hidden="true" className="space-y-2">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className={twMerge(
            'h-4 animate-pulse rounded bg-gray-200 dark:bg-dark-600',
            className
          )}
        />
      ))}
    </div>
  );
}