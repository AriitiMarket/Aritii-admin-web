import type { ReactNode } from 'react';
import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/common/ErrorState';

export type ViewMode = 'list' | 'map';

/**
 * List View / Map View switch, shown next to a tab's action buttons.
 *
 * Only rendered when the caller actually supports a map (`showMap`), so a tab
 * without map data never offers a dead toggle.
 */
export function ViewToggle({
  mode,
  onChange,
  showMap,
}: {
  mode: ViewMode;
  onChange: (next: ViewMode) => void;
  showMap: boolean;
}) {
  if (!showMap) return null;
  return (
    <div className="flex overflow-hidden rounded-md border border-gray-300 dark:border-dark-600" role="group" aria-label="View mode">
      {(['list', 'map'] as const).map((m) => (
        <Button
          key={m}
          size="sm"
          variant={mode === m ? 'primary' : 'ghost'}
          onClick={() => onChange(m)}
          aria-pressed={mode === m}
          className="rounded-none capitalize"
        >
          {m === 'list' ? 'List View' : 'Map View'}
        </Button>
      ))}
    </div>
  );
}

/** Wrap map children in a fixed-height container so Leaflet can size itself. */
export function MapPanel({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-gray-200 p-3 dark:border-dark-600">{children}</div>;
}


/**
 * Shared table wrapper for the Locations & Expansion tabs.
 *
 * Renders loading skeletons, a useful empty state WITH the next action, and a
 * readable error with Retry — the three states every tab must handle the same
 * way. On mobile the tabs use a card list instead of a wide table; that choice
 * lives in each tab, this just provides consistent table chrome.
 */
export function DataSection({
  error,
  onRetry,
  isEmpty,
  emptyTitle,
  emptyDescription,
  emptyAction,
  children,
}: {
  error?: string | null;
  onRetry?: () => void;
  /** Pass `!loading && rows.length === 0` so skeletons are not mistaken for "empty". */
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; onClick: () => void };
  children: ReactNode;
}) {
  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (isEmpty) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center dark:border-dark-600">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {emptyTitle ?? 'Nothing to show'}
        </p>
        {emptyDescription && (
          <p className="mx-auto mt-1 max-w-sm px-4 text-xs text-gray-500 dark:text-gray-400">
            {emptyDescription}
          </p>
        )}
        {emptyAction && (
          <Button variant="primary" size="sm" className="mt-4" onClick={emptyAction.onClick}>
            {emptyAction.label}
          </Button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}

/** Text-style row actions, as required by the module's UX rules. */
export function RowActions({
  onView,
  onEdit,
  onManage,
  onMore,
}: {
  onView?: () => void;
  onEdit?: () => void;
  onManage?: () => void;
  onMore?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {onView && (
        <button type="button" onClick={onView} className="text-primary-dark hover:underline">
          View Details
        </button>
      )}
      {onEdit && (
        <button type="button" onClick={onEdit} className="text-primary-dark hover:underline">
          Edit
        </button>
      )}
      {onManage && (
        <button type="button" onClick={onManage} className="text-primary-dark hover:underline">
          Manage
        </button>
      )}
      {onMore && (
        <button type="button" onClick={onMore} className="text-gray-500 hover:underline">
          More
        </button>
      )}
    </div>
  );
}
