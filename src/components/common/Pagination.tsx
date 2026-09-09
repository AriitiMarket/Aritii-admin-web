import { twMerge } from 'tailwind-merge';
import { Button } from '@/components/common/Button';

export function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
  className,
}: {
  page: number;
  totalPages: number;
  total?: number;
  onPageChange: (next: number) => void;
  className?: string;
}) {
  const safeTotalPages = Math.max(totalPages, 1);
  const canPrev = page > 1;
  const canNext = page < safeTotalPages;

  return (
    <div
      className={twMerge(
        'flex flex-wrap items-center justify-between gap-3',
        className
      )}
    >
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {total !== undefined && `Total: ${total}`}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span
          aria-live="polite"
          className="text-sm text-gray-700 dark:text-gray-300"
        >
          {page} / {safeTotalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}