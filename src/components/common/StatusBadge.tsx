import { twMerge } from 'tailwind-merge';

export type StatusVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

const VARIANT_CONFIG: Record<
  StatusVariant,
  { container: string; dot: string; pulse?: boolean }
> = {
  success: {
    container:
      'border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 shadow-xs dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-400',
    dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
  },
  warning: {
    container:
      'border border-amber-500/25 bg-amber-500/10 text-amber-800 shadow-xs dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-400',
    dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]',
    pulse: true,
  },
  danger: {
    container:
      'border border-rose-500/25 bg-rose-500/10 text-rose-700 shadow-xs dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-400',
    dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]',
  },
  info: {
    container:
      'border border-sky-500/25 bg-sky-500/10 text-sky-700 shadow-xs dark:border-sky-500/30 dark:bg-sky-950/40 dark:text-sky-400',
    dot: 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]',
  },
  neutral: {
    container:
      'border border-slate-300/60 bg-slate-100 text-slate-700 shadow-xs dark:border-dark-600 dark:bg-dark-800 dark:text-slate-300',
    dot: 'bg-slate-400 dark:bg-slate-500',
  },
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
    value.includes('exception') ||
    value.includes('suspended')
  ) {
    return 'danger';
  }

  if (value.includes('info')) return 'info';
  return 'neutral';
}

function formatStatusText(text?: string): string {
  if (!text) return '—';
  // Replace underscores with spaces and capitalize each word
  return text
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export interface StatusBadgeProps {
  label?: string;
  variant?: StatusVariant;
  className?: string;
  /** Accepted for callers that use the legacy badge API. */
  status?: string;
  /** Optional override to prevent formatting (keep RAW uppercase) */
  raw?: boolean;
}

export function StatusBadge({
  label,
  variant,
  className,
  raw = false,
}: StatusBadgeProps) {
  const resolved = variant ?? statusVariantFor(label);
  const cfg = VARIANT_CONFIG[resolved];
  const displayText = raw ? label || '—' : formatStatusText(label);

  return (
    <span
      className={twMerge(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide backdrop-blur-xs transition-colors',
        cfg.container,
        className
      )}
    >
      <span
        className={twMerge(
          'h-1.5 w-1.5 rounded-full shrink-0',
          cfg.dot,
          cfg.pulse && 'animate-pulse'
        )}
      />
      <span>{displayText}</span>
    </span>
  );
}