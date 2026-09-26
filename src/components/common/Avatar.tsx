import { twMerge } from 'tailwind-merge';
import { resolveImageUrl } from '@/utils/image';

export function Avatar({
  src,
  name,
  size = 'md',
  className,
}: {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const dimensions =
    size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-14 w-14 text-lg' : 'h-10 w-10 text-sm';
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const resolved = src ? resolveImageUrl(src) : null;

  return resolved ? (
    <img
      src={resolved}
      alt={name}
      className={twMerge('rounded-full object-cover', dimensions, className)}
    />
  ) : (
    <span
      aria-hidden="true"
      className={twMerge(
        'inline-flex items-center justify-center rounded-full bg-primary-color font-semibold text-white',
        dimensions,
        className
      )}
    >
      {initials || '?'}
    </span>
  );
}