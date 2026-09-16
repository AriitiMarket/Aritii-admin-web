# Unified Hierarchy System — Quick Reference

## CORE RULE
**ONE hierarchy. ZERO duplicates. ALL modules use the same context.**

---

## Three Things Every Module Needs

### 1️⃣ Import the Hook
```tsx
import { useHierarchy } from '@/hooks/useHierarchy';
```

### 2️⃣ Get Query Params
```tsx
import { buildHierarchyQueryParams } from '@/utils/hierarchyQueryBuilder';

const { selection } = useHierarchy();
const params = buildHierarchyQueryParams(selection);
```

### 3️⃣ Pass to Backend
```tsx
const data = await api.fetch({
  ...params,  // ← This is ALWAYS how hierarchy filtering is done
  page: 1,
  limit: 50,
});
```

---

## Five-Line Integration Template

```tsx
import { useHierarchy } from '@/hooks/useHierarchy';
import { buildHierarchyQueryParams } from '@/utils/hierarchyQueryBuilder';

export function MyModulePage() {
  const { selection } = useHierarchy();
  const params = buildHierarchyQueryParams(selection);
  
  // Use params when fetching data
  // Data is now automatically scoped to selection
}
```

---

## What buildHierarchyQueryParams() Returns

```tsx
{
  regionId: "region-123" | undefined,
  cityId: "city-456" | undefined,
  areaId: "area-789" | undefined,
  sectorId: "sector-101" | undefined,
  businessId: "business-202" | undefined,
  shopId: "shop-303" | undefined,
}
```

Pass this directly to your API. Backend filters.

---

## Backend API Pattern

```
GET /api/orders?regionId=X&cityId=Y&sectorId=Z
GET /api/commerce?businessId=X&shopId=Y
GET /api/delivery?areaId=X&sectorId=Y
GET /api/analytics?regionId=X&cityId=Y
```

**All params optional.**
- No params = all platform data
- Some params = filtered data
- All params = deepest scope

---

## AdminScopeBar Display

**Shown automatically on every page:**

```
Scope: Entire Platform

(or)

Scope: Oromia / Harar / Food        [Change Scope] [Clear]
📊 All data on this page is scoped to: Food
```

No need to add scope display — it's there automatically.

---

## Use Cases

### Dashboard
```tsx
const stats = await api.getStats(buildHierarchyQueryParams(selection));
// Shows KPIs for selected scope (all-platform by default)
```

### Businesses
```tsx
const businesses = await api.listBusinesses(buildHierarchyQueryParams(selection));
// Shows businesses in selected scope
```

### Orders
```tsx
const orders = await api.listOrders(buildHierarchyQueryParams(selection));
// Shows orders in selected scope
```

### Commerce
```tsx
const commerce = await api.getCommerce(buildHierarchyQueryParams(selection));
// Shows commerce data in selected scope
```

### Delivery
```tsx
const deliveries = await api.listDeliveries(buildHierarchyQueryParams(selection));
// Shows deliveries in selected scope
```

---

## DO ✅

- ✅ Use `buildHierarchyQueryParams(selection)` for filtering
- ✅ Pass params to backend
- ✅ Re-fetch when hierarchy changes
- ✅ Show `buildHierarchyScopeLabel(selection)` in headers
- ✅ Keep scope consistent across pages

---

## DON'T ❌

- ❌ Create separate region/city/sector selectors
- ❌ Implement module-specific hierarchy logic
- ❌ Fetch all data then filter locally
- ❌ Duplicate Location state
- ❌ Use different hierarchy parameters

---

## File Reference

| Use For | Import From |
|---------|-----------|
| Access hierarchy | `@/hooks/useHierarchy` |
| Convert to params | `@/utils/hierarchyQueryBuilder` |
| Current scope | `buildHierarchyScopeLabel()` |
| Query params | `buildHierarchyQueryParams()` |

---

## Common Mistake

```tsx
// ❌ WRONG
const [selectedRegion, setSelectedRegion] = useState('');
const [selectedCity, setSelectedCity] = useState('');
```

```tsx
// ✅ RIGHT
const { selection } = useHierarchy();
const params = buildHierarchyQueryParams(selection);
```

---

## Dependency Array

**IMPORTANT: Re-fetch when hierarchy changes**

```tsx
const data = useAsync(
  () => api.fetch(params),
  [params]  // ← Add this to dependency array
);
```

When admin changes scope → params change → data re-fetches → page updates.

---

## Integration Checklist

- [ ] Import `useHierarchy`
- [ ] Import `buildHierarchyQueryParams`
- [ ] Get `selection` from hook
- [ ] Call `buildHierarchyQueryParams(selection)`
- [ ] Pass `params` to API
- [ ] Add `params` to dependency array
- [ ] Display `buildHierarchyScopeLabel(selection)` (optional, AdminScopeBar shows it)
- [ ] Remove any module-specific filters
- [ ] Test with different hierarchy selections

---

## Result

One line of code per page:
```tsx
const params = buildHierarchyQueryParams(selection);
```

That's it. Everything else is automatic.

- Hierarchy selection persists ✓
- Scope displays everywhere ✓
- Data filters automatically ✓
- Modules stay in sync ✓
