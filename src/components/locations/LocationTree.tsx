import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { LocationTreeNode } from '@/services/locations.service';

const TYPE_LABELS: Record<string, string> = {
  country: '🌍',
  region: '📍',
  city: '🏙️',
  town: '🏘️',
  area: '🗺️',
  sector: '📐',
  community: '👥',
  village: '🏡',
  rural: '🌾',
  other: '📌',
};

const TYPE_COLORS: Record<string, string> = {
  country: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  region: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  city: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  town: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  area: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  sector: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  community: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  village: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
  rural: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

interface TreeRowProps {
  node: LocationTreeNode;
  level: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function TreeRow({
  node,
  level,
  expandedIds,
  onToggle,
  selectedId,
  onSelect,
}: TreeRowProps) {
  const isExpanded = expandedIds.has(node._id);
  const isSelected = selectedId === node._id;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <>
      <tr
        className={`group cursor-pointer border-b border-dark-border dark:border-dark-border transition-colors ${
          isSelected
            ? 'bg-primary-50 dark:bg-primary-950'
            : 'hover:bg-gray-50 dark:hover:bg-dark-800'
        }`}
        style={{ paddingLeft: `${level * 24}px` }}
        onClick={() => onSelect(node._id)}
      >
        <td className="px-3 py-2.5 text-sm">
          <div
            className="flex items-center gap-2"
            style={{ paddingLeft: `${level * 20}px` }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (hasChildren) onToggle(node._id);
              }}
              className={`flex h-5 w-5 items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-dark-600 ${
                hasChildren ? 'text-gray-600 dark:text-gray-300' : 'text-transparent'
              }`}
            >
              {hasChildren ? (
                <svg
                  className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              ) : (
                <span className="text-xs">•</span>
              )}
            </button>

            <span className="text-base" title={node.type}>
              {TYPE_LABELS[node.type] || '📌'}
            </span>

            <Link
              to={`/locations/${node._id}`}
              className="font-medium text-dark-900 hover:text-primary-dark dark:text-gray-100 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {node.name}
            </Link>

            {node.code && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                ({node.code})
              </span>
            )}

            {!node.isActive && (
              <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-200">
                Inactive
              </span>
            )}
          </div>
        </td>

        <td className="px-3 py-2.5">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${TYPE_COLORS[node.type] || TYPE_COLORS.other}`}
          >
            {node.type}
          </span>
        </td>

        <td className="px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400">
          {hasChildren ? `${node.children.length} child${node.children.length === 1 ? '' : 'en'}` : '—'}
        </td>

        <td className="px-3 py-2.5 text-right">
          <Link
            to={`/locations/${node._id}`}
            className="text-primary-dark hover:underline text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            View
          </Link>
        </td>
      </tr>

      {isExpanded &&
        node.children.map((child) => (
          <TreeRow
            key={child._id}
            node={child}
            level={level + 1}
            expandedIds={expandedIds}
            onToggle={onToggle}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
    </>
  );
}

interface LocationTreeProps {
  nodes: LocationTreeNode[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

export function LocationTree({
  nodes,
  selectedId = null,
  onSelect,
}: LocationTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // Expand top-level nodes by default
    return new Set(nodes.map((n) => n._id));
  });

  const toggleNode = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    const collectAll = (nodes: LocationTreeNode[]): string[] =>
      nodes.flatMap((n) => [n._id, ...collectAll(n.children)]);
    setExpandedIds(new Set(collectAll(nodes)));
  };

  const collapseAll = () => setExpandedIds(new Set());

  if (!nodes || nodes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 px-6 py-12 text-center dark:border-dark-600">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No locations found. Create the first one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-dark-border dark:border-dark-border">
      <div className="flex items-center justify-between border-b border-dark-border px-3 py-2 dark:border-dark-border">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {nodes.length} root location{nodes.length === 1 ? '' : 's'}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={expandAll}
            className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-800"
          >
            Expand all
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-800"
          >
            Collapse all
          </button>
        </div>
      </div>

      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-dark-800">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Name
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Type
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Children
            </th>
            <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
          {nodes.map((node) => (
            <TreeRow
              key={node._id}
              node={node}
              level={0}
              expandedIds={expandedIds}
              onToggle={toggleNode}
              selectedId={selectedId}
              onSelect={onSelect || (() => {})}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
