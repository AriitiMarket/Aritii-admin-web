/**
 * Hierarchy Query Builder — Converts HierarchySelection to API query parameters.
 *
 * CORE RULE: All Admin modules use this ONE function to convert the selected hierarchy
 * into query parameters. This ensures consistent filtering across the entire platform.
 *
 * No module creates its own hierarchy filter.
 * No module duplicates location/region/city/sector logic.
 * ONE source of truth: HierarchySelection → Query Params
 */

import type { HierarchySelection } from '@/context/HierarchyContext';

/**
 * Query parameters for hierarchy-aware API calls.
 * Maps directly to backend filter params.
 */
export interface HierarchyQueryParams {
  regionId?: string;
  cityId?: string;
  areaId?: string;
  sectorId?: string;
  businessId?: string;
  shopId?: string;
}

/**
 * Build query params from hierarchy selection.
 * This is the ONLY place where HierarchySelection → API params conversion happens.
 *
 * @param selection Current hierarchy selection
 * @returns Query params object for API calls
 */
export function buildHierarchyQueryParams(
  selection: HierarchySelection
): HierarchyQueryParams {
  return {
    regionId: selection.region?.id,
    cityId: selection.city?.id,
    areaId: selection.area?.id,
    sectorId: selection.sector?.id,
    businessId: selection.business?.id,
    shopId: selection.shop?.id,
  };
}

/**
 * Build display label for current hierarchy scope.
 * Shows "Entire Platform" or the selected path.
 */
export function buildHierarchyScopeLabel(selection: HierarchySelection): string {
  const path: string[] = [];

  if (selection.region) path.push(selection.region.name);
  if (selection.city) path.push(selection.city.name);
  if (selection.area) path.push(selection.area.name);
  if (selection.sector) path.push(selection.sector.name);
  if (selection.business) path.push(selection.business.name);
  if (selection.shop) path.push(selection.shop.name);

  if (path.length === 0) {
    return 'Entire Platform';
  }

  return `Scope: ${path.join(' / ')}`;
}

/**
 * Check if any hierarchy level is selected.
 */
export function hasHierarchySelection(selection: HierarchySelection): boolean {
  return !!(
    selection.region ||
    selection.city ||
    selection.area ||
    selection.sector ||
    selection.business ||
    selection.shop
  );
}

/**
 * Get the deepest selected level name.
 * Used for breadcrumb/context display.
 */
export function getSelectedLevelName(selection: HierarchySelection): string {
  if (selection.shop) return selection.shop.name;
  if (selection.business) return selection.business.name;
  if (selection.sector) return selection.sector.name;
  if (selection.area) return selection.area.name;
  if (selection.city) return selection.city.name;
  if (selection.region) return selection.region.name;
  return 'Platform';
}

/**
 * IMPORTANT: Any new Admin module that needs hierarchy filtering MUST:
 *
 * 1. Import useHierarchy from @/hooks/useHierarchy
 * 2. Call buildHierarchyQueryParams(selection) to get query params
 * 3. Pass params to backend API call
 * 4. Display buildHierarchyScopeLabel(selection) in page header
 *
 * Example usage pattern:
 * - const { selection } = useHierarchy();
 * - const params = buildHierarchyQueryParams(selection);
 * - const data = await api.fetch(params);
 * - return <h2>{buildHierarchyScopeLabel(selection)}</h2>;
 *
 * DO NOT:
 * - Create a separate Commerce hierarchy selector
 * - Implement Delivery-specific location filtering
 * - Duplicate Region/City/Sector lists in different modules
 * - Fetch all data then filter locally
 *
 * ALWAYS:
 * - Use the shared HierarchyContext (useHierarchy hook)
 * - Use buildHierarchyQueryParams() to create filter params
 * - Pass params server-side to backend
 * - Display scope using buildHierarchyScopeLabel()
 */
