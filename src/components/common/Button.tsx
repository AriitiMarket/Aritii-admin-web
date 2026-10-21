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
    'bg-primary-dark text-white shadow-sm hover:-translate-y-px hover:opacity-90 disabled:pointer-events-none disabled:opacity-50',
  secondary:
    'bg-dark-900 text-white shadow-sm hover:-translate-y-px hover:bg-dark-600 disabled:pointer-events-none disabled:opacity-50',
  outline:
    'border border-slate-300 bg-white hover:bg-slate-50 dark:border-dark-600 dark:bg-transparent dark:hover:bg-dark-900 disabled:pointer-events-none disabled:opacity-50',
  ghost:
    'bg-transparent hover:bg-slate-100 dark:hover:bg-dark-900 disabled:pointer-events-none disabled:opacity-50',
  danger:
    'bg-red-600 text-white shadow-sm hover:-translate-y-px hover:bg-red-500 disabled:pointer-events-none disabled:opacity-50',
  destructive:
    'bg-red-600 text-white shadow-sm hover:-translate-y-px hover:bg-red-500 disabled:pointer-events-none disabled:opacity-50',
  success:
    'bg-green-600 text-white shadow-sm hover:-translate-y-px hover:bg-green-500 disabled:pointer-events-none disabled:opacity-50',
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
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-[background-color,box-shadow,transform] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark',
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