import { twMerge } from 'tailwind-merge';

export function Spinner({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClass =
    size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-10 w-10' : 'h-6 w-6';
  return (
    <span
      role="status"
      aria-label="Loading"
      className={twMerge(
        'inline-block animate-spin rounded-full border-2 border-current border-t-transparent',
        sizeClass,
        className
      )}
    />
  );
}