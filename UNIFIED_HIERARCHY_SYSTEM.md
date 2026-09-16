# Unified Platform Hierarchy System — Implementation Guide

## CORE CONCEPT

**ONE hierarchy system** used by all Admin modules.

**Locations & Expansion** = CREATE/MANAGE hierarchy  
**Platform Explorer** = NAVIGATE hierarchy  
**All other modules** = USE hierarchy for scoping data  

No duplicates. No separate filters. ONE source of truth.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Admin Header                         │
├─────────────────────────────────────────────────────────┤
│          Hierarchy Selector (Sidebar)                   │
│  Platform / Region / City / Area / Sector / Business    │
├─────────────────────────────────────────────────────────┤
│         Admin Scope Bar (UNIFIED - shows on ALL pages)  │
│    Scope: Entire Platform                               │
│    or                                                    │
│    Scope: Oromia / Harar / Food        [Change] [Clear] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │  Page Specific Content                              ││
│  │  (Dashboard, Businesses, Commerce, Delivery, etc.)  ││
│  │                                                      ││
│  │  All data automatically scoped to selected          ││
│  │  hierarchy via buildHierarchyQueryParams()          ││
│  │                                                      ││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## The THREE Files Every Module Needs

### 1. Import the Hierarchy Hook
```tsx
import { useHierarchy } from '@/hooks/useHierarchy';
```

### 2. Build Query Params
```tsx
import { buildHierarchyQueryParams } from '@/utils/hierarchyQueryBuilder';
```

### 3. Display Scope
```tsx
import { buildHierarchyScopeLabel } from '@/utils/hierarchyQueryBuilder';
```

---

## Integration Pattern for Every Admin Module

### Example: Commerce Module

```tsx
import { useHierarchy } from '@/hooks/useHierarchy';
import { buildHierarchyQueryParams } from '@/utils/hierarchyQueryBuilder';
import { useAsync } from '@/hooks/useAsync';
import { commerceApi } from '@/api/commerce';

export function CommerceOverviewPage() {
  // STEP 1: Get current hierarchy selection
  const { selection } = useHierarchy();

  // STEP 2: Convert to query params
  const hierarchyParams = buildHierarchyQueryParams(selection);

  // STEP 3: Fetch data with hierarchy filter
  const stats = useAsync(
    () =>
      commerceApi.getStats({
        ...hierarchyParams,  // ← This is the ONLY place hierarchy filtering happens
        // No manual if/else for region/city/sector
        // No duplicating location logic
      }),
    [hierarchyParams] // Re-fetch when hierarchy changes
  );

  return (
    <div>
      {/* Data is automatically scoped to selected hierarchy */}
      <StatCard title="Total Orders" value={stats.data?.orders || 0} />
      <StatCard title="Total Revenue" value={stats.data?.revenue || 0} />
      {/* etc. */}
    </div>
  );
}
```

### Example: Businesses Module

```tsx
import { useHierarchy } from '@/hooks/useHierarchy';
import { buildHierarchyQueryParams } from '@/utils/hierarchyQueryBuilder';
import { useAsync } from '@/hooks/useAsync';
import { businessApi } from '@/api/business';

export function BusinessesPage() {
  const { selection } = useHierarchy();
  const hierarchyParams = buildHierarchyQueryParams(selection);

  const businesses = useAsync(
    () =>
      businessApi.list({
        ...hierarchyParams,  // ← Scoped query
        page: 1,
        limit: 50,
      }),
    [hierarchyParams]
  );

  return (
    <div>
      {/* Table shows only businesses in selected scope */}
      <DataTable
        columns={columns}
        data={businesses.data?.items || []}
      />
    </div>
  );
}
```

### Example: Orders Module

```tsx
import { useHierarchy } from '@/hooks/useHierarchy';
import { buildHierarchyQueryParams } from '@/utils/hierarchyQueryBuilder';
import { useAsync } from '@/hooks/useAsync';
import { ordersApi } from '@/api/orders';

export function OrdersPage() {
  const { selection } = useHierarchy();
  const hierarchyParams = buildHierarchyQueryParams(selection);

  const orders = useAsync(
    () =>
      ordersApi.list({
        ...hierarchyParams,  // ← Scoped query
        status: 'all',
        page: 1,
      }),
    [hierarchyParams]
  );

  return (
    <div>
      {/* Orders table shows only orders in selected scope */}
      <DataTable
        columns={columns}
        data={orders.data?.items || []}
      />
    </div>
  );
}
```

---

## What Each Module Should Do

| Module | Behavior |
|--------|----------|
| **Dashboard** | Show KPIs scoped to hierarchy (all-platform by default) |
| **Locations & Expansion** | CREATE, EDIT, DELETE hierarchy nodes ← **ONLY MODULE THAT MODIFIES HIERARCHY** |
| **Platform Explorer** | BROWSE/NAVIGATE the hierarchy tree |
| **Businesses** | List businesses in selected scope |
| **Shops** | List shops in selected scope |
| **Commerce** | Show commerce data (products, transactions, promotions) in selected scope |
| **Orders** | Show orders in selected scope |
| **Delivery** | Show delivery operations in selected scope |
| **Riders** | Show riders/delivery actors available in selected scope |
| **Analytics** | Show metrics/growth for selected scope |
| **Reports** | Generate reports for selected scope |
| **Users** | Show users relevant to selected scope |
| **Audit Logs** | Show actions on entities in selected scope |

---

## What NOT to Do

### ❌ WRONG: Commerce creates its own hierarchy

```tsx
// DO NOT DO THIS
const [commerceHierarchy, setCommerceHierarchy] = useState<Location[]>([]);
const [selectedRegion, setSelectedRegion] = useState<string>('');
const [selectedCity, setSelectedCity] = useState<string>('');
// ... duplicate state for every module
```

### ❌ WRONG: Delivery implements location filtering

```tsx
// DO NOT DO THIS
export function DeliveryModule() {
  const [locationFilter, setLocationFilter] = useState<Location | null>(null);
  const zones = fetchZonesForLocation(locationFilter);
  // Different from hierarchy system
}
```

### ❌ WRONG: Analytics creates hierarchy selectors

```tsx
// DO NOT DO THIS
export function AnalyticsPage() {
  const [hierarchyPath, setHierarchyPath] = useState<string[]>([]);
  // Separate from main hierarchy system
  // Confuses admins with duplicate selectors
}
```

### ✅ RIGHT: All modules use ONE hierarchy

```tsx
// DO THIS for every module
export function CommerceOverviewPage() {
  const { selection } = useHierarchy();  // ← Use shared hierarchy
  const params = buildHierarchyQueryParams(selection);  // ← Standard builder
  
  const data = await api.fetch({
    ...params,  // ← Pass to backend
  });
}
```

---

## Backend Integration

Every backend API should accept hierarchy filter params:

```
GET /api/commerce/stats?regionId=...&cityId=...&sectorId=...
GET /api/orders/list?regionId=...&businessId=...
GET /api/shops/list?sectorId=...
GET /api/delivery/assignments?areaId=...&sectorId=...
GET /api/analytics?regionId=...&cityId=...
```

**No module has its own hierarchy parameter structure.**

All use the standard:
- `regionId`
- `cityId`
- `areaId`
- `sectorId`
- `businessId`
- `shopId`

---

## Admin Experience

### Scenario 1: View All Platform Data

1. Admin opens Businesses page
2. Sees "Scope: Entire Platform" at top
3. Sees all businesses worldwide
4. All data unfiltered

### Scenario 2: Scope to One Sector

1. Admin opens sidebar → clicks "📍 Platform Hierarchy" [+]
2. Creates Hierarchy: Oromia → Harar → Food
3. Selects in hierarchy selector: Oromia → Harar → Food
4. Navigates to Businesses page
5. Sees "Scope: Oromia / Harar / Food"
6. Sees ONLY Food businesses in Harar
7. Navigates to Commerce
8. Sees ONLY Food commerce in Harar
9. Navigates to Orders
10. Sees ONLY orders from Food businesses in Harar
11. Navigates to Delivery
12. Sees ONLY delivery operations in Harar
13. **All data filtered automatically — same scope everywhere**

### Scenario 3: Change Scope

1. Admin clicks "Change Scope" on AdminScopeBar
2. Hierarchy selector appears
3. Selects different scope: West Africa → Lagos → Pharmacy
4. All pages automatically re-scope to Lagos Pharmacy
5. NO page refresh needed

### Scenario 4: Clear Scope

1. Admin clicks "Clear" on AdminScopeBar
2. Scope resets to "Entire Platform"
3. All pages show all-platform data again

---

## Files to Check/Update

### Core System (Already implemented):
- ✅ `src/context/HierarchyContext.tsx` — State management
- ✅ `src/components/HierarchySelector.tsx` — Selector UI
- ✅ `src/hooks/useHierarchy.ts` — Hook
- ✅ `src/utils/hierarchyQueryBuilder.ts` — Query builder (NEW)
- ✅ `src/components/AdminScopeBar.tsx` — Scope display (NEW)
- ✅ `src/layouts/DashboardLayout.tsx` — Layout integration (UPDATED)

### Modules to Update (use pattern above):
- `src/pages/dashboard/HomePage.tsx`
- `src/pages/businesses/BusinessesPage.tsx`
- `src/pages/stores/StoresPage.tsx`
- `src/pages/orders/OrdersPage.tsx`
- `src/pages/commerce/CommerceOverviewPage.tsx`
- `src/pages/delivery/DeliveryOverviewPage.tsx`
- `src/pages/riders/RidersPage.tsx`
- `src/pages/analytics/AnalyticsPage.tsx`
- `src/pages/users/UsersPage.tsx`
- `src/pages/audit/AuditLogsPage.tsx`
- etc.

### NEVER UPDATE:
- Don't create separate hierarchy selectors in modules
- Don't create separate location/region/city/sector state
- Don't implement module-specific hierarchy logic
- Don't filter data locally (filter server-side)

---

## Summary

**The hierarchy is a SHARED ADMIN CONTEXT, not a module feature.**

1. **Admin selects scope** via HierarchySelector (sidebar)
2. **AdminScopeBar shows scope** on every page
3. **Each module calls `buildHierarchyQueryParams(selection)`**
4. **Backend filters data** server-side
5. **Results scoped to selection** automatically
6. **Change scope** → all pages re-scope immediately
7. **Clear scope** → all pages show all-platform data

**Result:** Admins see a cohesive, unified admin dashboard where data and scope are consistent everywhere.
