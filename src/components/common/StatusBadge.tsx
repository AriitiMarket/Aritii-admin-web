import { twMerge } from 'tailwind-merge';

export type StatusVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

const VARIANT_STYLES: Record<StatusVariant, string> = {
  success: 'border border-primary-dark/20 bg-primary-color/20 text-primary-dark dark:border-primary-color/30 dark:bg-primary-dark/20 dark:text-primary-color',
  warning: 'border border-secondary-color/60 bg-secondary-color/25 text-gray-800 dark:border-secondary-color/40 dark:bg-secondary-color/20 dark:text-secondary-color',
  danger: 'border border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300',
  info: 'border border-primary-color/30 bg-primary-color/10 text-primary-dark dark:border-primary-color/30 dark:bg-primary-color/10 dark:text-primary-color',
  neutral: 'border border-gray-200 bg-gray-100 text-gray-700 dark:border-dark-600 dark:bg-dark-900 dark:text-gray-300',
};

export function statusVariantFor(input: string | undefined): StatusVariant {
  const value = (input || '').toLowerCase();

  // Explicit payment status mappings
  if (value === 'settling') return 'warning';
  if (value === 'confirmed') return 'success';
  if (value === 'failed') return 'danger';

  // Success states
  if (
    value.includes('active') ||
    value.includes('approved') ||
    value.includes('delivered') ||
    value.includes('success') ||
    value.includes('open') ||
    value.includes('resolved') ||
    value.includes('completed') ||
    value.includes('confirmed')
  ) {
    return 'success';
  }

  // Warning states
  if (
    value.includes('pending') ||
    value.includes('in_progress') ||
    value.includes('in-progress') ||
    value.includes('processing') ||
    value.includes('assigned') ||
    value.includes('picked') ||
    value.includes('arrived') ||
    value.includes('settling') ||
    value.includes('ready') ||
    value.includes('transit')
  ) {
    return 'warning';
  }

  // Danger states
  if (
    value.includes('blocked') ||
    value.includes('rejected') ||
    value.includes('cancelled') ||
    value.includes('failed') ||
    value.includes('closed') ||
    value.includes('error') ||
    value.includes('exception')
  ) {
    return 'danger';
  }

  if (value.includes('info')) return 'info';
  return 'neutral';
}

export interface StatusBadgeProps {
  label?: string;
  variant?: StatusVariant;
  className?: string;
  /** Accepted for callers that use the legacy badge API. */
  status?: string;
}

export function StatusBadge({
  label,
  variant,
  className,
}: StatusBadgeProps) {
  const resolved = variant ?? statusVariantFor(label);
  return (
    <span
      className={twMerge(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide',
        VARIANT_STYLES[resolved],
        className
      )}
    >
      {label || '—'}
    </span>
  );
}