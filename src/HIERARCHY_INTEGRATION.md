/**
 * HIERARCHY CONTEXT INTEGRATION GUIDE
 *
 * How to integrate the persistent hierarchy/context system into existing Admin pages.
 * The HierarchyContext + HierarchySelector are now available in DashboardLayout.
 *
 * All admin pages can now:
 * 1. Access current hierarchy selection via useHierarchy() hook
 * 2. Pass hierarchy context to API calls for server-side filtering
 * 3. Display hierarchy breadcrumb/path to users
 * 4. Update page data reactively when hierarchy selection changes
 */

// ────────────────────────────────────────────────────────────────────────────────

// PATTERN 1: Simple hierarchy-aware data fetch
// ────────────────────────────────────────────────────────────────────────────────

import { useHierarchy } from '@/hooks/useHierarchy';
import { platformAdminService } from '@/services/platformAdmin.service';
import { useAsync } from '@/hooks/useAsync';

export function BusinessesPage() {
  const { selection } = useHierarchy();

  // Automatically re-fetch when hierarchy changes
  const businesses = useAsync(
    () =>
      platformAdminService.listBusinessesByHierarchy(
        selection.sector?.id || 'all',
        'sector'
      ),
    [selection.sector?.id]
  );

  return (
    <div>
      {/* Your page JSX */}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────

// PATTERN 2: Multiple hierarchy context parameters
// ────────────────────────────────────────────────────────────────────────────────

export function OrdersPage() {
  const { selection, getPath, getPathString } = useHierarchy();

  const orders = useAsync(
    () =>
      platformAdminService.listOrdersByHierarchy({
        regionId: selection.region?.id,
        cityId: selection.city?.id,
        sectorId: selection.sector?.id,
        businessId: selection.business?.id,
        shopId: selection.shop?.id,
      }),
    [selection.region?.id, selection.city?.id, selection.sector?.id, selection.business?.id, selection.shop?.id]
  );

  return (
    <div>
      {/* Show hierarchy breadcrumb */}
      <div>Current Scope: {getPathString()}</div>

      {/* Render orders table with hierarchy-filtered data */}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────

// PATTERN 3: Analytics filtered by hierarchy
// ────────────────────────────────────────────────────────────────────────────────

export function AnalyticsPage() {
  const { selection } = useHierarchy();

  const analytics = useAsync(
    () =>
      platformAdminService.getGrowthAnalyticsByHierarchy({
        sectorId: selection.sector?.id,
        businessId: selection.business?.id,
        shopId: selection.shop?.id,
      }),
    [selection.sector?.id, selection.business?.id, selection.shop?.id]
  );

  return (
    <div>
      {/* Charts and reports filtered by selected hierarchy */}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────

// PATTERN 4: Dashboard KPIs respect hierarchy
// ────────────────────────────────────────────────────────────────────────────────

export function HomePage() {
  const { selection, isAnySelected } = useHierarchy();

  const stats = useAsync(
    () =>
      isAnySelected()
        ? platformAdminService.getStatsByHierarchy({
            regionId: selection.region?.id,
            cityId: selection.city?.id,
            sectorId: selection.sector?.id,
            businessId: selection.business?.id,
            shopId: selection.shop?.id,
          })
        : platformAdminService.getPlatformStats(),
    [selection.region?.id, selection.city?.id, selection.sector?.id, selection.business?.id, selection.shop?.id]
  );

  return (
    <div>
      {/* KPI Cards automatically show filtered data */}
      {/* e.g., Orders card shows only orders in the selected region/city/sector/business/shop */}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────

// HELPER: Build filter params dynamically
// ────────────────────────────────────────────────────────────────────────────────

export function useHierarchyParams() {
  const { selection } = useHierarchy();

  return {
    regionId: selection.region?.id,
    cityId: selection.city?.id,
    areaId: selection.area?.id,
    sectorId: selection.sector?.id,
    businessId: selection.business?.id,
    shopId: selection.shop?.id,
  };
}

// Usage in any component:
// const hierarchyParams = useHierarchyParams();
// const data = await someService.fetchFiltered(hierarchyParams);

// ────────────────────────────────────────────────────────────────────────────────

// PATTERN 5: Render hierarchy path in page header
// ────────────────────────────────────────────────────────────────────────────────

import { PageHeader } from '@/components/common/PageHeader';

export function SomePage() {
  const { getPathString } = useHierarchy();

  return (
    <div>
      <PageHeader 
        title="Businesses"
        subtitle={getPathString() || 'All Regions'}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────

// CONTEXT API REFERENCE
// ────────────────────────────────────────────────────────────────────────────────

/**
 * useHierarchy() returns:
 *
 * selection: HierarchySelection
 *   - platform: HierarchyNode (always present)
 *   - region: HierarchyNode | null
 *   - city: HierarchyNode | null
 *   - area: HierarchyNode | null
 *   - sector: HierarchyNode | null
 *   - business: HierarchyNode | null
 *   - shop: HierarchyNode | null
 *
 * setRegion(node | null): void
 *   - Sets the selected region, clears city, area, sector, business, shop
 *
 * setCity(node | null): void
 *   - Sets the selected city, clears area, sector, business, shop
 *
 * setArea(node | null): void
 *   - Sets the selected area, clears sector, business, shop
 *
 * setSector(node | null): void
 *   - Sets the selected sector, clears business, shop
 *
 * setBusiness(node | null): void
 *   - Sets the selected business, clears shop
 *
 * setShop(node | null): void
 *   - Sets the selected shop
 *
 * clearBelow(level: keyof HierarchySelection): void
 *   - Clears all selections below the given level
 *
 * clearAll(): void
 *   - Resets all selections (returns to "All Regions")
 *
 * getPath(): HierarchyNode[]
 *   - Returns array of selected nodes in order: [platform, region?, city?, area?, sector?, business?, shop?]
 *
 * getPathString(): string
 *   - Returns human-readable path: "Platform / Region / City / Sector / Business / Shop"
 *
 * isAnySelected(): boolean
 *   - Returns true if any level below platform is selected
 *
 */

// ────────────────────────────────────────────────────────────────────────────────

// SERVICE API REFERENCE
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Hierarchy-aware API methods in platformAdminService:
 *
 * listBusinessesByHierarchy(parentId, level, params?)
 *   - Lists businesses filtered by geographic/organizational context
 *   - level: 'region' | 'city' | 'area' | 'sector'
 *
 * listShopsByHierarchy(parentId, level, params?)
 *   - Lists shops filtered by hierarchy context
 *   - level: 'sector' | 'business' | 'region' | 'city' | 'area'
 *
 * listOrdersByHierarchy(hierarchyContext, params?)
 *   - Lists orders filtered by hierarchy
 *   - hierarchyContext: { regionId?, cityId?, areaId?, sectorId?, businessId?, shopId? }
 *
 * getStatsByHierarchy(hierarchyContext)
 *   - Dashboard stats filtered by hierarchy
 *   - Returns platform-wide stats if no context selected
 *
 * getGrowthAnalyticsByHierarchy(hierarchyContext, params?)
 *   - Analytics/growth data filtered by hierarchy
 *   - Includes order trends, revenue, shop/business growth
 *
 */

// ────────────────────────────────────────────────────────────────────────────────

// PERSISTENCE
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Hierarchy selection persists to localStorage under key: 'adminHierarchySelection'
 *
 * Structure:
 * {
 *   "region": "region-id" | null,
 *   "city": "city-id" | null,
 *   "area": "area-id" | null,
 *   "sector": "sector-id" | null,
 *   "business": "business-id" | null,
 *   "shop": "shop-id" | null
 * }
 *
 * Automatically restored on page load/refresh.
 * Changes persist immediately as user navigates between admin modules.
 */

// ────────────────────────────────────────────────────────────────────────────────
