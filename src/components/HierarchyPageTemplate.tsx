/**
 * HierarchyPageTemplate — Reusable template for hierarchy-aware pages.
 *
 * Every Admin page that needs hierarchy filtering should use this template.
 * It provides:
 * - Automatic hierarchy scoping
 * - Loading/error states
 * - Scope display
 * - Re-fetch on hierarchy change
 * - Common patterns
 *
 * This is the STANDARD way to build hierarchy-aware pages.
 */

import { useHierarchy } from '@/hooks/useHierarchy';
import { buildHierarchyQueryParams, buildHierarchyScopeLabel } from '@/utils/hierarchyQueryBuilder';
import { useAsync } from '@/hooks/useAsync';
import { PageHeader } from '@/components/common/PageHeader';
import { PageLoader } from '@/components/common/PageLoader';
import { ErrorState } from '@/components/common/ErrorState';

export interface HierarchyPageTemplateProps<T> {
  title: string;
  subtitle?: string;
  fetchData: (params: any) => Promise<T>;
  renderContent: (data: T, scope: string) => React.ReactNode;
  onError?: (error: Error) => void;
  additionalParams?: Record<string, any>;
}

export function HierarchyPageTemplate<T>({
  title,
  subtitle,
  fetchData,
  renderContent,
  onError,
  additionalParams = {},
}: HierarchyPageTemplateProps<T>) {
  // STEP 1: Get hierarchy selection
  const { selection } = useHierarchy();

  // STEP 2: Build query params from hierarchy
  const hierarchyParams = buildHierarchyQueryParams(selection);

  // STEP 3: Build scope label
  const scopeLabel = buildHierarchyScopeLabel(selection);

  // STEP 4: Fetch data with hierarchy filter
  const { data, loading, error } = useAsync(
    () =>
      fetchData({
        ...hierarchyParams,  // ← Hierarchy filtering
        ...additionalParams, // ← Additional filters
      }),
    [hierarchyParams, additionalParams] // Re-fetch when hierarchy changes
  );

  if (loading) {
    return <PageLoader label={`Loading ${title}...`} />;
  }

  if (error) {
    onError?.(error);
    return <ErrorState title={`Failed to load ${title}`} message={error.message} />;
  }

  return (
    <div className="space-y-6">
      {/* Page header with hierarchy scope */}
      <PageHeader
        title={title}
        subtitle={subtitle || scopeLabel}
      />

      {/* Scope indicator (redundant with AdminScopeBar but helpful) */}
      <div className="rounded bg-blue-50 p-3 text-sm text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
        📍 {scopeLabel}
      </div>

      {/* Content */}
      <div>
        {data ? renderContent(data, scopeLabel) : <p>No data available</p>}
      </div>
    </div>
  );
}

/**
 * Usage Example:
 *
 * export function MyPage() {
 *   return (
 *     <HierarchyPageTemplate
 *       title="Orders"
 *       fetchData={async (params) => await ordersApi.list(params)}
 *       renderContent={(data, scope) => (
 *         <div>
 *           <DataTable columns={columns} data={data.items} />
 *         </div>
 *       )}
 *     />
 *   );
 * }
 */
