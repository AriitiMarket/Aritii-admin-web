# Admin Dashboard Hierarchy Context — Quick Start Guide

## What Changed

The Admin Dashboard now displays a **persistent hierarchy selector bar** below the main header on all admin pages. This allows admins to scope all data to a specific geographic/organizational context.

---

## Visual Layout

### Desktop View
```
┌─────────────────────────────────────────────────────────────────┐
│  [Menu] Search...          [Theme] [Lang] [Bell] [User]         │
├─────────────────────────────────────────────────────────────────┤
│ 📍 Region ▾ / City ▾ / Area ▾ / Sector ▾ / Business ▾ / Shop ▾  │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile View
```
┌──────────────────────────────┐
│ [Menu] Search...    [⋯]      │
├──────────────────────────────┤
│ Platform / Region / City     │
│         [X] Clear            │
└──────────────────────────────┘
```

---

## How to Use (Admin)

### 1. Select a Region
Click the **Region ▾** dropdown → choose a region (e.g., "East Africa")
- All other fields auto-activate
- Dashboard auto-updates to show only data from that region

### 2. Drill Down (Optional)
Click **City ▾** → select a city (e.g., "Nairobi")
- Area selector appears
- All data re-filters to Nairobi

Continue drilling: City → Area → Sector → Business → Shop

### 3. View Filtered Data
All pages now show only data within your selected hierarchy:
- **Dashboard**: KPIs, charts, growth metrics filtered to scope
- **Orders**: Orders from selected region/city/sector/business
- **Businesses**: Businesses in selected sector/area/city/region
- **Shops**: Shops from selected business/sector
- **Analytics**: Growth/revenue trends for selected scope

### 4. Switch Pages
Selection persists as you navigate between admin modules:
- Go to Businesses → Orders → Analytics → back to Dashboard
- Your Region/City/Sector selection stays active
- All pages show filtered data instantly

### 5. Clear Selection
Click **Clear** button (red button) to reset to "All Regions"
- Reverts to platform-wide view
- All filters removed

---

## Use Cases

### Case 1: Monitor Lagos Operations
1. Select Region: "West Africa"
2. Select City: "Lagos"
3. View all orders, shops, businesses, disputes in Lagos
4. Compare analytics to other cities in West Africa

### Case 2: Audit a Specific Seller's Shops
1. Select Sector: "Quick Commerce"
2. Select Business: "FreshMart Ltd"
3. View all shops, orders, and fulfillment for FreshMart's quick commerce ops
4. Check analytics by individual shop

### Case 3: Check Delivery Coverage
1. Select Area: "Westlands"
2. Navigate to Delivery Riders → Assignments
3. View only riders and deliveries in Westlands
4. See delivery zones and coverage for Westlands

---

## Technical Details for Developers

### Location
The hierarchy selector is rendered in `DashboardLayout` immediately below the top header:

```tsx
<Header ... />
<HierarchySelector />  {/* ← New, always visible */}
<Sidebar />
<main>...</main>
```

### Integration
Any page can access the current selection:

```tsx
import { useHierarchy } from '@/hooks/useHierarchy';

export function SomePage() {
  const { selection, getPathString } = useHierarchy();

  // selection.region, selection.city, selection.sector, etc.
  // getPathString() → "Platform / West Africa / Lagos / Lindi / Quick Commerce"

  // Pass to API:
  const data = await apiService.getStatsByHierarchy({
    regionId: selection.region?.id,
    cityId: selection.city?.id,
    sectorId: selection.sector?.id,
  });

  return (
    <div>
      <h2>Orders in {getPathString()}</h2>
      {/* Render filtered data */}
    </div>
  );
}
```

### Data Flow
1. Admin clicks dropdown → selects region
2. HierarchyContext updates state
3. State persists to localStorage
4. All pages subscribed to context re-render
5. Pages call hierarchy-aware API methods
6. Backend filters data server-side
7. Pages display filtered results

---

## Key Features

✅ **Persistent** — Selection survives page reloads  
✅ **Cascading** — Selecting region auto-clears city/area/sector  
✅ **Responsive** — Desktop bar, mobile breadcrumb  
✅ **Fast** — No full page reloads, local state updates  
✅ **Intuitive** — Dropdowns only show valid options  
✅ **Flexible** — Can drill to region OR jump to sector directly  

---

## Troubleshooting

### Selection not persisting across pages?
- Check browser localStorage is enabled
- Clear cache if corrupted
- Refresh page

### Dropdown shows "Loading..."?
- Backend may be slow loading hierarchy options
- Check network tab for API delays

### Data doesn't filter after selection?
- Confirm page developer integrated `useHierarchy()` hook
- Check page passes hierarchy params to API calls
- See `src/HIERARCHY_INTEGRATION.md` for integration patterns

### Mobile breadcrumb not showing?
- Expected behavior — breadcrumb only shows if hierarchy is selected
- Click any dropdown to select a level

---

## Examples in Code

### Example 1: Dashboard KPIs
```tsx
const { selection, isAnySelected } = useHierarchy();

const stats = await (isAnySelected()
  ? platformAdminService.getStatsByHierarchy({
      sectorId: selection.sector?.id,
      businessId: selection.business?.id,
    })
  : platformAdminService.getPlatformStats());

// stats now contains only data from selected hierarchy
<StatCard title="Orders" value={stats.orders.total} />
```

### Example 2: Table Filtering
```tsx
const { selection } = useHierarchy();

const orders = await platformAdminService.listOrdersByHierarchy({
  regionId: selection.region?.id,
  cityId: selection.city?.id,
  shopId: selection.shop?.id,
});

return <DataTable columns={columns} data={orders.items} />;
```

### Example 3: Analytics
```tsx
const { selection, getPathString } = useHierarchy();

const analytics = await platformAdminService.getGrowthAnalyticsByHierarchy({
  sectorId: selection.sector?.id,
  businessId: selection.business?.id,
});

return (
  <div>
    <h2>Growth in {getPathString()}</h2>
    <LineChart data={analytics.series} />
  </div>
);
```

---

## Next Steps

### For Admins
- Use the hierarchy selector to scope your view
- Notice how pages filter automatically
- Report any issues with filtering accuracy

### For Developers
- Integrate `useHierarchy()` hook into remaining pages (Businesses, Orders, Analytics, etc.)
- See `src/HIERARCHY_INTEGRATION.md` for detailed integration patterns
- Each page takes ~30 minutes to integrate
- Start with high-value pages (Dashboard, Orders, Businesses)

---

## Questions?

- **How to add a new hierarchy level?** Edit `HierarchyContext.tsx` and `HierarchySelector.tsx`
- **How to customize which pages show hierarchy?** Each page independently calls `useHierarchy()` — no global setting
- **Can I disable the selector?** Remove `<HierarchySelector />` from `DashboardLayout.tsx`
- **Does this affect the backend?** No — it's optional frontend filtering. Backend APIs unchanged.
