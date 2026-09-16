/**
 * HierarchyManager Service — CRUD operations for managing the platform hierarchy.
 *
 * Handles creation, editing, deletion, and reordering of hierarchy nodes across:
 * Region → City → Area → Sector → Business → Shop
 */

import { http } from '@/services/client/httpClient';

export interface HierarchyNodeData {
  id: string;
  name: string;
  type: 'region' | 'city' | 'area' | 'sector' | 'business' | 'shop';
  parentId?: string;
  code?: string;
  description?: string;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface HierarchyNodeDetail extends HierarchyNodeData {
  children?: HierarchyNodeData[];
  childCount: number;
  descendantCount: number;
  shops?: number;
  orders?: number;
  businesses?: number;
}

export interface CreateNodePayload {
  name: string;
  type: 'region' | 'city' | 'area' | 'sector' | 'business' | 'shop';
  parentId?: string;
  code?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface UpdateNodePayload {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface MoveNodePayload {
  newParentId?: string;
  position?: number;
}

export const hierarchyManagerService = {
  /**
   * Get full hierarchy tree.
   */
  getHierarchy(): Promise<{
    success: boolean;
    hierarchy: HierarchyNodeData[];
  }> {
    return http
      .get<{ success: boolean; hierarchy: HierarchyNodeData[] }>(
        '/admin/platform/hierarchy'
      )
      .then((res) => res);
  },

  /**
   * Get node details including children.
   */
  getNodeDetail(nodeId: string): Promise<HierarchyNodeDetail> {
    return http
      .get<{ success: boolean; node: HierarchyNodeDetail }>(
        `/admin/platform/hierarchy/${nodeId}`
      )
      .then((res) => res.node);
  },

  /**
   * Create a new hierarchy node.
   */
  createNode(payload: CreateNodePayload): Promise<HierarchyNodeData> {
    return http
      .post<{ success: boolean; node: HierarchyNodeData }>(
        '/admin/platform/hierarchy',
        payload
      )
      .then((res) => res.node);
  },

  /**
   * Update an existing node.
   */
  updateNode(nodeId: string, payload: UpdateNodePayload): Promise<HierarchyNodeData> {
    return http
      .put<{ success: boolean; node: HierarchyNodeData }>(
        `/admin/platform/hierarchy/${nodeId}`,
        payload
      )
      .then((res) => res.node);
  },

  /**
   * Delete a node (optionally cascade to children).
   */
  deleteNode(
    nodeId: string,
    options: { cascade?: boolean } = {}
  ): Promise<{ success: boolean; deletedCount: number }> {
    return http
      .delete<{ success: boolean; deletedCount: number }>(
        `/admin/platform/hierarchy/${nodeId}`,
        { params: options as never }
      )
      .then((res) => res);
  },

  /**
   * Move a node to a new parent.
   */
  moveNode(nodeId: string, payload: MoveNodePayload): Promise<HierarchyNodeData> {
    return http
      .patch<{ success: boolean; node: HierarchyNodeData }>(
        `/admin/platform/hierarchy/${nodeId}/move`,
        payload
      )
      .then((res) => res.node);
  },

  /**
   * Reorder children of a parent node.
   */
  reorderChildren(
    parentId: string,
    childIds: string[]
  ): Promise<{ success: boolean }> {
    return http
      .patch<{ success: boolean }>(
        `/admin/platform/hierarchy/${parentId}/reorder`,
        { childIds }
      )
      .then((res) => res);
  },

  /**
   * Bulk operations: activate/deactivate multiple nodes.
   */
  bulkSetActive(
    nodeIds: string[],
    isActive: boolean
  ): Promise<{ success: boolean; updated: number }> {
    return http
      .patch<{ success: boolean; updated: number }>(
        '/admin/platform/hierarchy/bulk/active',
        { nodeIds, isActive }
      )
      .then((res) => res);
  },

  /**
   * Get valid child types for a given parent type.
   */
  getValidChildTypes(
    parentType?: 'region' | 'city' | 'area' | 'sector' | 'business'
  ): string[] {
    const childTypeMap: Record<string, string[]> = {
      region: ['city'],
      city: ['area'],
      area: ['sector'],
      sector: ['business'],
      business: ['shop'],
      shop: [],
    };
    return childTypeMap[parentType || 'region'] || [];
  },

  /**
   * Validate node creation (check parent exists, type valid, etc.)
   */
  async validateNodeCreation(payload: CreateNodePayload): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    if (!payload.name || payload.name.trim().length === 0) {
      errors.push('Node name is required');
    }

    if (!payload.type) {
      errors.push('Node type is required');
    }

    const validTypes = [
      'region',
      'city',
      'area',
      'sector',
      'business',
      'shop',
    ];
    if (payload.type && !validTypes.includes(payload.type)) {
      errors.push(`Invalid node type: ${payload.type}`);
    }

    if (payload.parentId) {
      try {
        await this.getNodeDetail(payload.parentId);
      } catch {
        errors.push(`Parent node not found: ${payload.parentId}`);
      }
    }

    return { valid: errors.length === 0, errors };
  },
};
