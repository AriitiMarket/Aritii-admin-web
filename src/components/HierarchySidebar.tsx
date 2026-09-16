/**
 * HierarchySidebar — Expandable hierarchy management section in the sidebar.
 *
 * Features:
 * - Expandable/collapsible section
 * - Shows hierarchy tree
 * - Quick actions: create, edit, delete nodes
 * - Integrated modals for operations
 * - Search/filter nodes
 */

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronDown,
  faChevronRight,
  faPlus,
  faBuildingColumns,
} from '@fortawesome/free-solid-svg-icons';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { HierarchyTree } from '@/components/HierarchyTree';
import { HierarchyNodeModal } from '@/components/HierarchyNodeModal';
import { Button } from '@/components/common/Button';
import { SearchInput } from '@/components/common/SearchInput';
import { Spinner } from '@/components/common/Spinner';
import {
  hierarchyManagerService,
  type HierarchyNodeData,
} from '@/services/hierarchyManager.service';

export function HierarchySidebar() {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedNode, setSelectedNode] = useState<HierarchyNodeData | undefined>();
  const [parentNode, setParentNode] = useState<HierarchyNodeData | undefined>();
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // Fetch hierarchy
  const hierarchy = useAsync(
    () => hierarchyManagerService.getHierarchy().then((res) => res.hierarchy),
    [expanded]
  );

  // Filter nodes by search
  const filteredNodes = search
    ? (hierarchy.data || []).filter(
        (node) =>
          node.name.toLowerCase().includes(search.toLowerCase()) ||
          (node.code && node.code.toLowerCase().includes(search.toLowerCase()))
      )
    : hierarchy.data;

  // Check permission
  const canManageHierarchy = user?.role === 'SUPER_ADMIN';

  const handleAddChild = (parentId: string) => {
    if (!canManageHierarchy) {
      showToast({ type: 'error', message: 'Only super admins can manage hierarchy' });
      return;
    }

    const parent = hierarchy.data?.find((n) => n.id === parentId);
    setParentNode(parent);
    setSelectedNode(undefined);
    setModalMode('create');
    setModalError('');
    setModalOpen(true);
  };

  const handleEdit = (node: HierarchyNodeData) => {
    if (!canManageHierarchy) {
      showToast({ type: 'error', message: 'Only super admins can manage hierarchy' });
      return;
    }

    setSelectedNode(node);
    setParentNode(undefined);
    setModalMode('edit');
    setModalError('');
    setModalOpen(true);
  };

  const handleDelete = async (nodeId: string) => {
    if (!canManageHierarchy) {
      showToast({ type: 'error', message: 'Only super admins can manage hierarchy' });
      return;
    }

    if (!confirm('Are you sure? This may cascade to child nodes.')) {
      return;
    }

    try {
      await hierarchyManagerService.deleteNode(nodeId, { cascade: true });
      showToast({ type: 'success', message: 'Node deleted' });
      // Refresh hierarchy
      hierarchy.refetch?.();
    } catch (err) {
      showToast({ type: 'error', message: `Failed to delete node: ${err}` });
    }
  };

  const handleModalSave = async (payload: any) => {
    if (!canManageHierarchy) {
      setModalError('Only super admins can manage hierarchy');
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      if (modalMode === 'create') {
        // Validate before creating
        const validation = await hierarchyManagerService.validateNodeCreation(
          payload
        );
        if (!validation.valid) {
          setModalError(validation.errors.join('; '));
          return;
        }

        await hierarchyManagerService.createNode(payload);
        showToast({ type: 'success', message: `${payload.type} created successfully` });
      } else if (modalMode === 'edit' && selectedNode) {
        await hierarchyManagerService.updateNode(selectedNode.id, payload);
        showToast({ type: 'success', message: 'Node updated successfully' });
      }

      // Refresh hierarchy
      hierarchy.refetch?.();
    } catch (err: any) {
      setModalError(err.message || 'Operation failed');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <>
      {/* Section header */}
      <div className="border-t border-gray-200 px-4 py-2 dark:border-dark-700">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center gap-2 rounded px-2 py-2 hover:bg-gray-100 dark:hover:bg-dark-800"
        >
          <FontAwesomeIcon
            icon={expanded ? faChevronDown : faChevronRight}
            size="sm"
          />
          <FontAwesomeIcon icon={faBuildingColumns} size="sm" />
          <span className="flex-1 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
            Platform Hierarchy
          </span>
          {canManageHierarchy && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleAddChild('');
              }}
              title="Add region"
              className="inline-flex h-6 w-6 items-center justify-center rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-dark-700"
            >
              <FontAwesomeIcon icon={faPlus} size="xs" />
            </button>
          )}
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="space-y-2 border-t border-gray-200 px-2 py-2 dark:border-dark-700">
          {/* Search */}
          {hierarchy.data && hierarchy.data.length > 5 && (
            <div className="px-2">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search hierarchy..."
              />
            </div>
          )}

          {/* Hierarchy tree or loading/error */}
          {hierarchy.loading ? (
            <div className="flex items-center justify-center py-4">
              <Spinner />
            </div>
          ) : hierarchy.error ? (
            <div className="px-4 py-2 text-sm text-red-600 dark:text-red-400">
              Failed to load hierarchy
            </div>
          ) : (
            <HierarchyTree
              nodes={filteredNodes || []}
              onAddChild={handleAddChild}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}

          {/* Empty state */}
          {!hierarchy.loading &&
            !hierarchy.error &&
            (!filteredNodes || filteredNodes.length === 0) &&
            canManageHierarchy && (
              <div className="px-4 py-4 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  No hierarchy nodes yet
                </p>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleAddChild('')}
                >
                  Create First Region
                </Button>
              </div>
            )}
        </div>
      )}

      {/* Node modal */}
      <HierarchyNodeModal
        open={modalOpen}
        mode={modalMode}
        node={selectedNode}
        parentNode={parentNode}
        onSave={handleModalSave}
        onClose={() => {
          setModalOpen(false);
          setSelectedNode(undefined);
          setParentNode(undefined);
          setModalError('');
        }}
        loading={modalLoading}
        error={modalError}
      />
    </>
  );
}
