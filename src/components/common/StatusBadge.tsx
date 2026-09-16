import { twMerge } from 'tailwind-merge';

export type StatusVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

const VARIANT_STYLES: Record<StatusVariant, string> = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  info: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  neutral: 'bg-gray-100 text-gray-700 dark:bg-dark-900 dark:text-gray-300',
};

export function statusVariantFor(input: string | undefined): StatusVariant {
  const value = (input || '').toLowerCase();
  if (
    value.includes('active') ||
    value.includes('approved') ||
    value.includes('delivered') ||
    value.includes('success') ||
    value.includes('open') ||
    value.includes('resolved')
  ) {
    return 'success';
  }
  if (
    value.includes('pending') ||
    value.includes('in_progress') ||
    value.includes('in-progress') ||
    value.includes('processing') ||
    value.includes('assigned') ||
    value.includes('picked') ||
    value.includes('arrived')
  ) {
    return 'warning';
  }
  if (
    value.includes('blocked') ||
    value.includes('rejected') ||
    value.includes('cancelled') ||
    value.includes('failed') ||
    value.includes('closed') ||
    value.includes('error')
  ) {
    return 'danger';
  }
  if (value.includes('info')) return 'info';
  return 'neutral';
}

export function StatusBadge({
  label,
  variant,
  className,
}: {
  label?: string;
  variant?: StatusVariant;
  className?: string;
}) {
  const resolved = variant ?? statusVariantFor(label);
  return (
    <span
      className={twMerge(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        VARIANT_STYLES[resolved],
        className
      )}
    >
      {label || '—'}
    </span>
  );
}