import React from 'react';

interface HierarchyLevel {
  id: string;
  name: string;
  type: 'region' | 'city' | 'area' | 'sector';
}

interface HierarchyBreadcrumbProps {
  hierarchyFilter: HierarchyLevel | null;
  onClear: () => void;
  compact?: boolean;
}

/**
 * HIERARCHY BREADCRUMB
 * 
 * Shows active hierarchy filter across admin pages
 * Consistent component for all pages that support hierarchy filtering
 * 
 * Usage:
 * <HierarchyBreadcrumb 
 *   hierarchyFilter={currentFilter}
 *   onClear={() => setFilter(null)}
 * />
 * 
 * Output: "Filtered by: SECTOR • Upper Hill ✕ Clear"
 */
export const HierarchyBreadcrumb: React.FC<HierarchyBreadcrumbProps> = ({
  hierarchyFilter,
  onClear,
  compact = false,
}) => {
  if (!hierarchyFilter) return null;

  const typeLabel = hierarchyFilter.type.toUpperCase();

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 text-xs font-medium">
        <span>{typeLabel} • {hierarchyFilter.name}</span>
        <button
          onClick={onClear}
          className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
          title="Clear hierarchy filter"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-medium text-gray-600 dark:text-gray-400">Filtered by:</span>
      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 font-medium">
        {typeLabel} • {hierarchyFilter.name}
      </span>
      <button
        onClick={onClear}
        className="ml-1 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
      >
        ✕ Clear
      </button>
    </div>
  );
};

/**
 * HIERARCHY CONTEXT LABEL
 * 
 * Shows hierarchy context for a single item (e.g., business location)
 * 
 * Usage:
 * <HierarchyContextLabel 
 *   path={["Nairobi", "Nairobi City", "Westlands", "Upper Hill"]}
 * />
 * 
 * Output: "Upper Hill, Westlands, Nairobi City, Nairobi"
 */
export const HierarchyContextLabel: React.FC<{ path: string[] | null }> = ({ path }) => {
  if (!path || path.length === 0) return null;

  return (
    <span className="text-xs text-gray-500 dark:text-gray-400">
      {path.reverse().join(' › ')}
    </span>
  );
};

/**
 * HIERARCHY STATUS BADGE
 * 
 * Colored badge for hierarchy level type
 * 
 * Color Scheme:
 * - Region: Purple
 * - City: Blue
 * - Area: Green
 * - Sector: Orange
 */
export const HierarchyStatusBadge: React.FC<{ type: string }> = ({ type }) => {
  const colorMap: Record<string, string> = {
    region: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-100',
    city: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100',
    area: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100',
    sector: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-100',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colorMap[type] || 'bg-gray-100 text-gray-700'}`}>
      {type.toUpperCase()}
    </span>
  );
};
