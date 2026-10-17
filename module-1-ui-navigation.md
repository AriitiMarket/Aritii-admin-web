# Administration Frontend Module — UI and Navigation

**Audit and implementation date:** 2026-10-17  
**Status:** PARTIALLY COMPLETED — REMAINING ITEMS DOCUMENTED

## 1. Purpose and responsibilities

This module provides the authenticated Administration Frontend shell: application providers, protected routing, role-filtered navigation, responsive desktop/mobile layouts, page loading, and user-facing unavailable/error states.

### Team B frontend responsibilities

- Maintain the React application shell and provider composition.
- Define frontend routes and backward-compatible redirects.
- Filter navigation and route access using the approved frontend role catalogue.
- Prevent unsupported frontend actions from presenting misleading success paths.
- Display only data backed by a verified frontend API consumer.

### Backend responsibilities

- Identity owns authentication, effective administrator roles, permissions, and administrator provisioning policy.
- The API Gateway owns request routing, token validation, permission checks, and service dispatch.
- Commerce owns shop and analytics records and their DTOs.
- Team ownership of Identity, Gateway, and Commerce is not formally identified in this repository.
- Frontend route guards are not the final authorization boundary.

## 2. Actual routes, layouts, navigation, and source files

### Application composition

- `src/app/App.tsx:1-18` mounts `ErrorBoundary`, `AppProviders`, and `AppRoutes`.
- `src/app/providers/AppProviders.tsx:1-27` composes theme, localization, toast, authentication, configuration, and sector providers.
- `src/layouts/DashboardLayout.tsx:1-42` provides the authenticated header, sidebar, mobile navigation, breadcrumbs, and route outlet.

### Route protection

- `src/routes/ProtectedRoute.tsx:1-31` waits for session bootstrap and redirects to `/login` when no access token exists.
- `src/routes/RoleRoute.tsx:1-32` renders `ForbiddenPage` for a recognized role not included in the route's allowed role list.
- `src/routes/AppRoutes.tsx:198-204` defines the current role groups:
  - `SUPER_ADMIN`
  - `SELLER_ADMIN`
  - `RIDER_ADMIN`
  - `CUSTOMER_ADMIN`
- `src/routes/AppRoutes.tsx:243-316` defines the protected feature routes and legacy redirects.

### Navigation

- `src/routes/navigation.ts:21-29` defines the four supported roles for common dashboard access.
- `src/routes/navigation.ts:31-226` defines role-filtered navigation groups.
- `src/routes/navigation.ts:232-242` filters groups and items against the signed-in user's normalized role.
- `src/components/layout/Sidebar.tsx:1-32` renders the desktop navigation.
- `src/components/layout/NavList.tsx:1-108` renders localized navigation links and active states.

### Reviewed feature files

- `src/pages/admins/AdminNewPage.tsx`
- `src/services/admins.service.ts`
- `src/pages/stores/ShopsAnalyticsPage.tsx`
- `src/services/analytics.service.ts`
- `src/api/admin.ts:1409-1510`
- `src/types/analytics.ts:1-91`

## 3. Inspection findings and current status

| Finding | Status | Evidence |
|---|---|---|
| Application shell and provider composition exist | PASS | `src/app/App.tsx:1-18`; `src/app/providers/AppProviders.tsx:1-27` |
| Protected routes and role guards exist | PASS | `src/routes/ProtectedRoute.tsx:1-31`; `src/routes/RoleRoute.tsx:1-32` |
| Route and navigation paths are aligned for reviewed entries | PASS | `src/routes/AppRoutes.tsx:243-316`; `src/routes/navigation.ts:31-226` |
| `OPERATIONS_ADMIN` is absent | PASS / policy preserved | `src/types/auth.ts:8-13`; `src/utils/auth-roles.ts:4-15` |
| Administrator creation was submit-capable despite a known unsupported service | PARTIAL before fix; PASS after fix | `src/services/admins.service.ts:30-37`; `src/pages/admins/AdminNewPage.tsx:1-38` |
| Shop analytics used hard-coded metrics | PARTIAL before fix; PASS after fix for supported aggregate data | Previous mock removed; `src/pages/stores/ShopsAnalyticsPage.tsx:1-95` |
| Location/sector/GMV/rating/top-shop analytics DTO | NOT VERIFIED | No matching verified DTO in the available repository |

## 4. Fixes implemented

### 4.1 Unsupported administrator creation

**Root cause:** `AdminNewPage` displayed editable name, email, role, and sector fields and attempted `adminsService.create()`, while `adminsService.create()` always throws `ApiError(501, ..., 'NOT_IMPLEMENTED')`.

**Fix:** Replaced the form with an explicit unavailable state. The page:

- states that administrator creation is unavailable;
- explains that no account was created;
- does not render a submit-capable form;
- provides a safe return link to `/users?tab=admins`.

**Files changed:**

- `src/pages/admins/AdminNewPage.tsx`

**Backend dependency:** An approved Identity administrator-provisioning endpoint and policy are still required before this page can become actionable. `src/services/admins.service.ts` remains intentionally unsupported and was not changed.

### 4.2 Shop analytics

**Root cause:** `ShopsAnalyticsPage` rendered hard-coded location rows, GMV, ratings, and top-shop names rather than a service response.

**Verified frontend contract used:** The repository already exposes `analyticsService.getShopStats(startDate, endDate)`, which calls `GET /analytics/shop-stats` through `reportsAdmin` and returns the local `ShopStats` shape:

- `src/services/analytics.service.ts:113-115`
- `src/api/admin.ts:1482-1488`
- `src/types/analytics.ts:72-80`

**Fix:** Replaced fabricated location-level data with the verified aggregate consumer. The page now:

- requests shop statistics for the selected date range;
- shows loading and error states;
- displays total, new, approved, pending, suspended, and inactive counts;
- explicitly states that location, sector, GMV, rating, and top-shop breakdowns are not shown because no matching DTO was verified.

**Files changed:**

- `src/pages/stores/ShopsAnalyticsPage.tsx`

**Backend dependency:** The actual Gateway/backend route and response shape could not be independently verified from this checkout. The page uses only the existing frontend service/type boundary and does not claim backend verification.

### 4.3 Route and role policy

No route or role policy change was made because the current reviewed route/navigation relationships are internally consistent and `OPERATIONS_ADMIN` requires owner approval. Existing role definitions remain unchanged.

## 5. Backend APIs consumed and verification status

| Consumer | Frontend route/consumer | Backend verification |
|---|---|---|
| Current session and authorization | `ProtectedRoute`, `RoleRoute`, `AuthContext` | NOT VERIFIED in this checkout |
| Administrator list/details and role APIs | `src/services/admins.service.ts`, `src/api/admin.ts` | Frontend consumer present; backend contract NOT VERIFIED |
| Administrator creation | `src/services/admins.service.ts:30-37` | Explicitly unsupported; no verified provisioning endpoint |
| Aggregate shop analytics | `src/services/analytics.service.ts:113-115`, `src/api/admin.ts:1482-1488` | Frontend endpoint/DTO boundary present; running backend route NOT VERIFIED |

## 6. Prioritized remaining issues

### P0 — Security-critical

1. **Role and privilege policy approval is still required.** Do not add `OPERATIONS_ADMIN`, change `ADMIN`/`STAFF` mappings, or widen route access without Identity/security approval.
2. **Backend authorization remains unverified.** Frontend guards must not be treated as the security boundary.

### P1 — Broken or misleading functionality

1. **Administrator provisioning remains unavailable.** The Identity owner must provide an approved endpoint and policy before enabling creation.
2. **Aggregate shop analytics depends on an unverified backend route/DTO at runtime.** The current UI is honest about the limitation and avoids unsupported breakdowns.
3. **Gateway/environment contract requires owner verification.** `.env.production` requires deployment injection, and local URL examples differ.

### P2 — Testing and maintainability

1. Add focused route/navigation tests for supported roles and redirects.
2. Add a component/integration test for the unavailable administrator state.
3. Add a shop analytics test for loading, aggregate success, and API error states.
4. Reduce unsafe response typing in `src/api/admin.ts` and related services.

### P3 — Optional polish

1. Add approved localized translation keys for the new unavailable-state messages.
2. Add explicit active-state tests for nested navigation links.

## 7. Tests and actual results

### Executed

| Command | Result | Details |
|---|---|---|
| `npm run typecheck` | PASS | `tsc --noEmit` exited with code 0 after the changes |
| `npx eslint src\pages\admins\AdminNewPage.tsx src\pages\stores\ShopsAnalyticsPage.tsx` | PASS | Both changed files passed targeted ESLint |
| `npx vite build` | PASS | Production Vite build completed successfully |
| `git diff --check` | PASS | No whitespace errors |

### Route/navigation verification

**PASS by source inspection.** Reviewed route and navigation pairs include:

- `/home` - `src/routes/AppRoutes.tsx:243`, `src/routes/navigation.ts:33`
- `/users` - `src/routes/AppRoutes.tsx:247`, `src/routes/navigation.ts:42-48`
- `/stores/analytics` - `src/routes/AppRoutes.tsx:257`, `src/routes/navigation.ts:175-179`
- `/delivery` - `src/routes/AppRoutes.tsx:293`, `src/routes/navigation.ts:129`
- `/locations` - `src/routes/AppRoutes.tsx:310`, `src/routes/navigation.ts:130`
- `/admin-roles` - `src/routes/AppRoutes.tsx:275`, `src/routes/navigation.ts:222-226`

The route role sets were not widened. No automated route test file exists in the repository.

### Not run or blocked

| Command/check | Result | Reason |
|---|---|---|
| `npm run test:lifecycle` | BLOCKED / existing failure | Script references missing `..\backend-services\delivery-service\src\shared\constants\index.js` |
| `npm run cy:run` | NOT VERIFIED | Cypress configuration exists, but no Cypress E2E specs were found |
| Unit tests | NOT VERIFIED | No `test` script or `*.test.*`/`*.spec.*` files were found |
| Live route/API smoke test | NOT VERIFIED | No running backend/Gateway and no verified backend repository in this checkout |

## 8. Acceptance criteria

- [x] The authenticated shell is composed through `AppProviders` and `DashboardLayout`.
- [x] Protected routes redirect unauthenticated users.
- [x] Role routes deny unsupported access without widening policy.
- [x] Reviewed navigation paths correspond to current routes or intentional redirects.
- [x] `OPERATIONS_ADMIN` was not added without approval.
- [x] Administrator creation no longer presents a misleading submit form.
- [x] Shop analytics no longer displays fabricated location-level metrics.
- [x] Shop analytics uses the existing aggregate shop-statistics consumer and honest unsupported-breakdown messaging.
- [x] Typecheck, targeted lint, build, and diff checks pass.
- [ ] Backend Gateway/API route and DTO behavior is verified against a running service.
- [ ] Automated route/navigation and component tests are added.
- [ ] Administrator provisioning policy and endpoint are approved.

## 9. Definition of Done

Module 1 is fully complete when:

1. Identity, Gateway, and Commerce owners approve the role, route, permission, and analytics contracts.
2. Administrator provisioning is either backed by an approved endpoint or remains explicitly disabled.
3. Shop analytics has a backend-verified DTO for every displayed breakdown, or the UI remains aggregate-only.
4. Automated route/navigation and component coverage exists.
5. Live-service acceptance passes for login, protected routing, role denial, administrator navigation, and shop analytics.

## Final module status

**PARTIALLY COMPLETED — REMAINING ITEMS DOCUMENTED**

The verified frontend fixes are implemented and pass typecheck, targeted lint, build, and diff checks. Backend contract verification, automated route/component tests, administrator provisioning approval, and live-service acceptance remain external dependencies.
