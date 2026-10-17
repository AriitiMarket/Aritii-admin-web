# Aritii Market Admin Web — Technical Documentation

**Audience:** Frontend Admin Developer
**App:** `Aritii-admin-web` — React 18 + Vite + TypeScript + React Router + Tailwind
**Repository:** `https://github.com/AriitiMarket/Aritii-admin-web.git`
**Branch:** `feature/payment-transaction-management`
**Date:** 2026-10-17

Single technical reference for the admin portal: module map, role/permission rules, API contract (Swagger/OpenAPI alignment), and push/release notes.

## 1. Architecture & Conventions

| Layer | Location | Responsibility |
|---|---|---|
| Build tool | `vite.config.ts` | Vite dev server (port 4000), TS build, `@` alias → `src` |
| Router | `src/routes/AppRoutes.tsx` | `createBrowserRouter`; lazy-loaded feature pages; `DashboardLayout` / `AuthLayout` |
| Route guards | `src/routes/ProtectedRoute.tsx`, `src/routes/RoleRoute.tsx` | Session guard + role-based 403 |
| Navigation | `src/routes/navigation.ts` | Sidebar groups, role-filtered via `useNavigationGroups()` |
| API client | `src/services/client/httpClient.ts` | Single shared `http` (axios) client; talks ONLY to API Gateway |
| API module | `src/api/admin.ts` | Centralized typed service namespaces |
| Types | `src/types/*.ts` | Shared TS interfaces (`AdminUser`, `Order`, `Review`, `Seller`, `Store`, …) |
| Components | `src/components/{common,layout,workspaces,locations,forms,feedback,tables}` | Reusable UI |
| Pages | `src/pages/<module>/` | Route-level feature pages |

**Golden rule:** The admin portal talks to the **API Gateway only** (via `httpClient`). It never calls Identity/Commerce/Delivery directly. The gateway is the single public entry point (port 8000 in Docker; `VITE_API_BASE_URL` in dev).

## 2. Module Map (Navigation Groups)

Defined in `src/routes/navigation.ts` (`NAV_GROUPS`). Each group lists items with `labelKey` (i18n), `path`, and optional `roles`. The hook `useNavigationGroups()` filters out items the signed-in admin's role cannot see.

| Group | Path(s) | Roles | Notes |
|---|---|---|---|
| Dashboard | `/home` | all | Admin home |
| Users | `/users` | `USERS_TAB_ROLES` | One entry; tabs = All Users / Buyers / Sellers / Customers / Admins (`src/pages/users/usersTabs.ts`) |
| Businesses & Shops | `/businesses`, `/stores` | `SUPER_ADMIN`, `SELLER_ADMIN` | Pending shops are `/stores?status=PENDING_APPROVAL` (filtered view of Shops, not a separate page) |
| Commerce | `/commerce`, `/commerce/products`, `/categories`, `/reviews/pending`, `/orders`, `/requests`, `/commerce/transactions`, `/commerce/promotions` | `SUPER_ADMIN` / `SELLER_ADMIN` / `CUSTOMER_ADMIN` | Review moderation queue is `/reviews/pending` |
| Delivery & Logistics | `/delivery`, `/delivery/deliveries`, `/delivery/providers`, `/delivery/requests`, `/locations` | `SUPER_ADMIN`, `RIDER_ADMIN` | Deliveries is the single operational screen; assignment happens inside each delivery |
| Disputes | `/disputes?status=open\|in_progress\|resolved`, `/disputes` | `SUPER_ADMIN`, `CUSTOMER_ADMIN` | Open / active / resolved / complaints |
| Reports & Analytics | `/analytics`, `/stores/analytics` | `SUPER_ADMIN`, `CUSTOMER_ADMIN` / `SELLER_ADMIN` | |
| Audit Logs | `/audit-logs` | `SUPER_ADMIN` | |
| Platform Settings | `/settings/platform`, `/settings/notifications`, `/settings/system` | `SUPER_ADMIN` | |
| Admin Roles & Permissions | `/admin-roles` | `SUPER_ADMIN` | Role lifecycle (CRUD) + permission matrix |

**Rule:** Adding a sidebar entry means (a) add to `NAV_GROUPS`, (b) add lazy route in `AppRoutes.tsx`, (c) assign roles. Never add a path that is unreachable from navigation without also registering the route.


## 3. Rules — Authentication & Authorization

### 3.1 Roles (`src/types/auth.ts`)

```ts
export type AdminRole =
  | 'SUPER_ADMIN'
  | 'RIDER_ADMIN'
  | 'SELLER_ADMIN'
  | 'CUSTOMER_ADMIN';
```

`AdminUser` carries `role`, `permissions: string[]`, `sectors: string[]`, `userType` (legacy). The backend remains the source of truth for roles/permissions; the frontend enforces UI-level guards only.

### 3.2 Guards

| Guard | File | Behavior |
|---|---|---|
| `ProtectedRoute` | `src/routes/ProtectedRoute.tsx` | Loader while session bootstraps; redirects to `/login` when no access token |
| `RoleRoute` | `src/routes/RoleRoute.tsx` | 403 (`ForbiddenPage`) when `user.role` not in allowed list |

### 3.3 Role-Based API (`adminRolesApi` in `src/api/admin.ts`)

| Method | Endpoint | Purpose |
|---|---|---|
| `listPermissions()` | `GET /admin/permissions` | All permissions |
| `listPermissionsByModule()` | `GET /admin/permissions/by-module` | Permissions grouped by module |
| `listRoles()` | `GET /admin/roles` | All roles |
| `getRole(id)` | `GET /admin/roles/:id` | Single role |
| `createRole(data)` | `POST /admin/roles` | Create role (name, displayName, description, permissions) |
| `updateRole(id, data)` | `PUT /admin/roles/:id` | Update role |
| `deleteRole(id)` | `DELETE /admin/roles/:id` | Delete role |
| `getAllUserRoles()` | `GET /admin/user-roles` | All user→role assignments |
| `getUserRoles(userId)` | `GET /admin/users/:userId/roles` | User's roles + permissions |
| `getUserPermissions(userId)` | `GET /admin/users/:userId/permissions` | User's permission strings |
| `assignRole(userId, roleId)` | `POST /admin/users/:userId/roles/:roleId` | Grant role |
| `removeRole(userId, roleId)` | `DELETE /admin/users/:userId/roles/:roleId` | Revoke role |

**Rule:** Role assignment/removal and role CRUD are `SUPER_ADMIN` only (enforced by `RoleRoute` on `/admin-roles` and backend). Frontend must never expose role mutation to non-SUPER_ADMIN even if a route is guessed.


## 4. API Contract — Swagger / OpenAPI Alignment

### 4.1 Where the spec lives

The **authoritative OpenAPI 3.0 spec is generated by the API Gateway** (backend), not the admin frontend:

- `backend-services/api-gateway/src/swagger/swagger.js` — `swagger-jsdoc` spec (`openapi: '3.0.0'`, title `Aritii Market API Gateway`, version `1.0.0`)
- Served at `GET /api/docs` (Swagger UI) and `GET /api/docs.json` (raw spec) on the gateway

Security scheme: `bearerAuth` (HTTP Bearer, JWT RS256, issued via OAuth 2.1 authorization-code + PKCE). **No cookies anywhere.**

### 4.2 How the admin frontend consumes it

The admin frontend does **not** fetch Swagger at runtime. It consumes the gateway's REST contract through a typed, hand-maintained client:

- `src/services/client/httpClient.ts` — single axios instance (`http`) with base URL from env and bearer-token interceptor
- `src/api/admin.ts` — typed namespaces mapping gateway endpoints → TS functions

| Admin namespace | Gateway-backed domain | Example endpoints |
|---|---|---|
| `identityAdmin` | Identity (users, sellers, admins) | `GET /admin/users`, `POST /admin/users` |
| `commerceAdmin` | Commerce (orders, products, reviews) | `GET /admin/orders`, `POST /admin/reviews/:id/approve` |
| `deliveryAdmin` | Delivery (deliveries, providers, zones) | `GET /delivery/deliveries`, `POST /delivery/assignment` |
| `adminRolesApi` | RBAC | `GET /admin/roles`, `POST /admin/roles` |
| `auditAdmin` | Audit | `GET /admin/audit-logs` |
| `analyticsAdmin` | Analytics | `GET /admin/analytics/*` |
| `reportsAdmin`, `disputesAdmin`, `requestsAdmin` | Reports / Disputes / Requests | |

### 4.3 Swagger clarity — what a frontend developer should verify

When the gateway spec changes, check these admin touchpoints:

1. **Endpoint paths** in `src/api/admin.ts` match `swagger.js` `paths`.
2. **Auth header** — every mutating/admin request sends `Authorization: Bearer <accessToken>` (handled by `httpClient` interceptor).
3. **Response envelope** — gateway wraps responses as `{ success, data, message, errors }`; admin code unwraps `res.data` / `res.permissions` / `res.roles` accordingly.
4. **Error shape** — `{ success: false, code, message, errors: [] }`; admin `ForbiddenPage`/toast handles 401/403/404.

**Rule:** Do not generate admin TS types from Swagger automatically unless the team adopts a codegen step. Hand-maintained types in `src/types/` must be kept in sync with the gateway spec manually on contract changes.


## 5. Key Pages & Ownership Summary

| Page | File | Module | Primary role |
|---|---|---|---|
| Users management (+ tabs) | `src/pages/users/UsersPage.tsx` + `usersTabs.ts` | Users | `SELLER_ADMIN` / `SUPER_ADMIN` |
| Businesses | `src/pages/businesses/BusinessesPage.tsx` | Businesses & Shops | `SELLER_ADMIN` |
| Shops (incl. pending) | `src/pages/stores/StoresPage.tsx` | Businesses & Shops | `SELLER_ADMIN` |
| Categories | `src/pages/catalog/CategoriesPage.tsx` | Commerce | `SELLER_ADMIN` |
| Pending reviews | `src/pages/catalog/PendingReviewsPage.tsx` | Commerce | `SELLER_ADMIN` |
| Orders | `src/pages/orders/OrdersPage.tsx` | Commerce | `SUPER_ADMIN` |
| Products | `src/pages/commerce/ProductsPage.tsx` | Commerce | `SUPER_ADMIN` |
| Promotions | `src/pages/commerce/PromotionsPage.tsx` | Commerce | `SUPER_ADMIN` |
| Deliveries | `src/pages/delivery/DeliveriesPage.tsx` | Delivery | `RIDER_ADMIN` |
| Delivery requests | `src/pages/delivery/DeliveryRequestsPage.tsx` | Delivery | `RIDER_ADMIN` |
| Locations / Zones / Ports | `src/pages/locations/LocationsPage.tsx` + workspace tabs | Delivery | `SUPER_ADMIN` |
| Providers | `src/pages/providers/ProvidersPage.tsx` | Delivery | `RIDER_ADMIN` |
| Analytics | `src/pages/analytics/AnalyticsPage.tsx` | Reports | `CUSTOMER_ADMIN` |
| Audit logs | `src/pages/audit/AuditLogsPage.tsx` | Audit | `SUPER_ADMIN` |
| Roles & permissions | `src/pages/admins/AdminRolesPage.tsx` | Admin Roles | `SUPER_ADMIN` |
| Platform settings | `src/pages/settings/PlatformSettingsPage.tsx` | Settings | `SUPER_ADMIN` |

## 6. Developer Workflow

```bash
# Install
npm install

# Dev server (port 4000)
npm run dev

# Type check
npm run typecheck        # tsc --noEmit

# Lint
npm run lint             # eslint src --ext .ts,.tsx

# Format
npm run prettier         # prettier --write src

# Production build (runs lifecycle test + typecheck + vite build)
npm run build

# Preview build
npm run preview          # port 4173

# E2E (Cypress)
npm run cy:run
```

**Required env:** `VITE_API_BASE_URL` pointing at the API Gateway (see `.env.example`). Without it, all API calls fail.


## 7. Release / Push Notes

Current branch: `feature/payment-transaction-management`
Remote: `https://github.com/AriitiMarket/Aritii-admin-web.git`

To push changes:

```bash
git add <your files>
git commit -m "feat(admin): <concise description>"
git push origin feature/payment-transaction-management
```

**Rules:**
- Fast-forward only; never force-push shared branches.
- Stage only your intended files; other developers' uncommitted work is left untouched.
- Run `npm run build` (typecheck + build) before pushing to avoid breaking CI.
- No secrets in commits; `.env` is git-ignored.

## 8. Remaining Items for the Admin Frontend

- **Swagger codegen:** The admin TS types are hand-maintained; consider adding OpenAPI codegen so `src/types/` stays in sync with `backend-services/api-gateway/src/swagger/swagger.js`.
- **Role/permission drift:** `navigation.ts` `roles` arrays and `RoleRoute` guards must be re-verified whenever the backend RBAC contract changes (they are UI controls only; backend is source of truth).
- **Pending-shops duplication:** The pending-shops queue is intentionally a filtered view of `/stores`, not a separate page — keep it that way to avoid duplicate sidebar entries.

