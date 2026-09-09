import { Spinner } from '@/components/common/Spinner';

/** Full-page loading state. */
export function PageLoader({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <Spinner size="lg" className="text-primary-dark" />
      {label && <p className="text-sm text-gray-500">{label}</p>}
    </div>
  );
}