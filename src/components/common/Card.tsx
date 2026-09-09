import { twMerge } from 'tailwind-merge';
import type { HTMLAttributes } from 'react';

export function Card({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={twMerge('card', className)} {...rest}>
      {children}
    </div>
  );
}