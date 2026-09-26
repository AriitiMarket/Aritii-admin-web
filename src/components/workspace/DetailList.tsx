import type { ReactNode } from 'react';

/**
 * Compact key/value list used inside every detail drawer, so Locations, Zones,
 * Hubs and Routes present their facts identically.
 */
export function Facts({ items }: { items: [string, ReactNode | null | undefined][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div
          key={label}
          className="flex justify-between gap-3 border-b border-gray-100 py-1.5 text-sm dark:border-dark-600"
        >
          <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
          <dd className="text-right font-medium text-gray-800 dark:text-gray-100">
            {value ?? '—'}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Small labelled count used in a drawer's summary strip. */
export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-md border border-gray-100 p-3 dark:border-dark-600">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-100">{value ?? '—'}</p>
    </div>
  );
}
