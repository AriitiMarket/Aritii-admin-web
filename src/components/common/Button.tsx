import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';
import { Spinner } from '@/components/common/Spinner';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'danger'
    | 'destructive'
    | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-primary-dark text-white hover:opacity-90 disabled:opacity-50',
  secondary:
    'bg-dark-900 text-white hover:bg-dark-600 disabled:opacity-50',
  outline:
    'border border-dark-600 bg-transparent hover:bg-gray-100 dark:hover:bg-dark-900 disabled:opacity-50',
  ghost:
    'bg-transparent hover:bg-gray-100 dark:hover:bg-dark-900 disabled:opacity-50',
  danger:
    'bg-red-600 text-white hover:bg-red-500 disabled:opacity-50',
  destructive:
    'bg-red-600 text-white hover:opacity-50 disabled:opacity-50',
  success:
    'bg-green-600 text-white hover:opacity-90 disabled:opacity-50',
};

const SIZE_CLASSES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    className,
    children,
    type = 'button',
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={twMerge(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
      {...rest}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
});

export { Button };