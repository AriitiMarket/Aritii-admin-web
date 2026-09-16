import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { locationsService } from '@/services/locations.service';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { PageLoader } from '@/components/common/PageLoader';
import { ErrorState } from '@/components/common/ErrorState';
import type { Location } from '@/types';

interface TreeNode extends Location {
  children?: TreeNode[];
  level: number;
}

export function LocationHierarchyPage() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [treeData, setTreeData] = useState<TreeNode[]>([]);

  const { data: locations, loading, error, refetch } = useAsync(
    () => locationsService.list({ limit: 1000 }),
    []
  );

  useEffect(() => {
    if (locations?.items) {
      // Build tree structure. The children array must be typed so nested nodes keep the
      // TreeNode shape (a bare [] would infer never[]).
      const locationMap = new Map<string, TreeNode>(
        locations.items.map((loc) => [loc.id, { ...loc, children: [] as TreeNode[], level: 0 }])
      );
      const roots: TreeNode[] = [];

      for (const node of locationMap.values()) {
        if (node.parentId && locationMap.has(node.parentId)) {
          const parent = locationMap.get(node.parentId)!;
          node.level = parent.level + 1;
          if (!parent.children) parent.children = [];
          parent.children.push(node);
        } else {
          node.level = 0;
          roots.push(node);
        }
      }

      setTreeData(roots.sort((a, b) => a.name.localeCompare(b.name)));
    }
  }, [locations]);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const TreeNode = ({ node }: { node: TreeNode }) => (
    <div key={node.id} className="my-1">
      <div className="flex items-center gap-2" style={{ paddingLeft: `${node.level * 1.5}rem` }}>
        {node.children && node.children.length > 0 && (
          <button
            onClick={() => toggleExpand(node.id)}
            className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {expandedIds.has(node.id) ? '▼' : '▶'}
          </button>
        )}
        {(!node.children || node.children.length === 0) && <div className="w-5" />}

        <div
          onClick={() => { if (node.id) navigate(`/locations/${node.id}`); }}
          className="flex-1 flex items-center gap-3 px-3 py-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-100">
            {node.type}
          </span>
          <span className="font-medium text-gray-800 dark:text-gray-100">{node.name}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {node.code && `(${node.code})`}
          </span>
          {!node.isActive && (
            <span className="text-xs text-red-600 dark:text-red-400 font-semibold">Inactive</span>
          )}
          {node.children && node.children.length > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
              {node.children.length} {node.children.length === 1 ? 'child' : 'children'}
            </span>
          )}
        </div>
      </div>

      {expandedIds.has(node.id) && node.children && (
        <div>
          {node.children.map(child => (
            <TreeNode key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );

  if (loading) return <PageLoader label={t('Loading')} />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div>
      <PageHeader
        title={t('Location Hierarchy')}
        description={t('View and manage geographic location hierarchy')}
        actions={
          <div className="flex gap-2">
            <Button onClick={() => navigate('/locations/create')} variant="primary">
              {t('Add Location')}
            </Button>
            <Button onClick={() => navigate('/locations')} variant="outline">
              {t('List View')}
            </Button>
          </div>
        }
      />

      <Card>
        <div className="space-y-1 font-mono text-sm">
          {treeData.map(node => (
            <TreeNode key={node.id} node={node} />
          ))}
        </div>
        {treeData.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {t('No locations found')}
          </div>
        )}
      </Card>
    </div>
  );
}
