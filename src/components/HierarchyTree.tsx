/**
 * HierarchyTree — Interactive tree view for managing the platform hierarchy.
 *
 * Features:
 * - Expand/collapse nodes
 * - Inline edit/delete/add actions
 * - Visual hierarchy levels
 * - Active/inactive status indicators
 * - Context-aware (show available actions based on node type)
 */

import { useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronDown,
  faChevronRight,
  faPlus,
  faPencil,
  faTrash,
  faCircle,
} from '@fortawesome/free-solid-svg-icons';
import type { HierarchyNodeData } from '@/services/hierarchyManager.service';
import { Button } from '@/components/common/Button';

export interface HierarchyTreeProps {
  nodes: HierarchyNodeData[];
  level?: number;
  maxLevel?: number;
  onAddChild?: (parentId: string, parentType: string) => void;
  onEdit?: (node: HierarchyNodeData) => void;
  onDelete?: (nodeId: string) => void;
  loading?: boolean;
}

const LEVEL_NAMES: Record<string, string> = {
  region: 'Region',
  city: 'City',
  area: 'Area',
  sector: 'Sector',
  business: 'Business',
  shop: 'Shop',
};

const HIERARCHY_ORDER = ['region', 'city', 'area', 'sector', 'business', 'shop'];

function HierarchyTreeNode({
  node,
  level = 0,
  onAddChild,
  onEdit,
  onDelete,
}: {
  node: HierarchyNodeData;
  level?: number;
  onAddChild?: (parentId: string, parentType: string) => void;
  onEdit?: (node: HierarchyNodeData) => void;
  onDelete?: (nodeId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<HierarchyNodeData[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);

  const toggleExpand = useCallback(async () => {
    if (!expanded) {
      // Load children on demand
      setLoadingChildren(true);
      try {
        // In real implementation, fetch from service
        // For now, assume children are empty
        setChildren([]);
      } finally {
        setLoadingChildren(false);
      }
    }
    setExpanded(!expanded);
  }, [expanded]);

  const hasChildren = (node.metadata?.childCount || 0) > 0;
  const nextLevel = HIERARCHY_ORDER[HIERARCHY_ORDER.indexOf(node.type) + 1];
  const canAddChild = nextLevel !== undefined;

  return (
    <div key={node.id} className="space-y-1">
      {/* Node row */}
      <div
        className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-dark-700"
        style={{ marginLeft: `${level * 12}px` }}
      >
        {/* Expand button */}
        {hasChildren ? (
          <button
            type="button"
            onClick={toggleExpand}
            disabled={loadingChildren}
            className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-dark-600"
          >
            <FontAwesomeIcon
              icon={expanded ? faChevronDown : faChevronRight}
              size="sm"
            />
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* Status indicator */}
        <FontAwesomeIcon
          icon={faCircle}
          size="xs"
          className={node.isActive ? 'text-green-500' : 'text-gray-400'}
          title={node.isActive ? 'Active' : 'Inactive'}
        />

        {/* Node label */}
        <div className="flex-1 truncate">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {LEVEL_NAMES[node.type]}
          </span>
          <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
            {node.name}
          </div>
          {node.code && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              ({node.code})
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Add child */}
          {canAddChild && (
            <button
              type="button"
              onClick={() => onAddChild?.(node.id, node.type)}
              className="inline-flex h-6 w-6 items-center justify-center rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-dark-700"
              title={`Add ${LEVEL_NAMES[nextLevel] || 'child'}`}
            >
              <FontAwesomeIcon icon={faPlus} size="xs" />
            </button>
          )}

          {/* Edit */}
          <button
            type="button"
            onClick={() => onEdit?.(node)}
            className="inline-flex h-6 w-6 items-center justify-center rounded text-amber-600 hover:bg-amber-50 dark:hover:bg-dark-700"
            title="Edit node"
          >
            <FontAwesomeIcon icon={faPencil} size="xs" />
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => onDelete?.(node.id)}
            className="inline-flex h-6 w-6 items-center justify-center rounded text-red-600 hover:bg-red-50 dark:hover:bg-dark-700"
            title="Delete node"
          >
            <FontAwesomeIcon icon={faTrash} size="xs" />
          </button>
        </div>
      </div>

      {/* Children */}
      {expanded && children.length > 0 && (
        <div>
          {children.map((child) => (
            <HierarchyTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {expanded && loadingChildren && (
        <div className="px-2 py-1 text-xs text-gray-500">Loading...</div>
      )}
    </div>
  );
}

export function HierarchyTree({
  nodes,
  level = 0,
  onAddChild,
  onEdit,
  onDelete,
  loading,
}: HierarchyTreeProps) {
  if (loading) {
    return (
      <div className="space-y-2 px-2 py-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-dark-700" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-dark-700" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-dark-700" />
      </div>
    );
  }

  if (!nodes || nodes.length === 0) {
    return (
      <div className="space-y-2 px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>No hierarchy nodes yet</p>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onAddChild?.('', 'region')}
        >
          Create First Region
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1 overflow-y-auto px-2 py-2">
      {nodes.map((node) => (
        <HierarchyTreeNode
          key={node.id}
          node={node}
          level={level}
          onAddChild={onAddChild}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
