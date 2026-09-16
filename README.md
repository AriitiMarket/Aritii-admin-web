# Ariiti Admin Web

The operator console for the **Ariiti Market** multi-seller marketplace: a
React + Vite + TypeScript single-page application used by platform admins to
manage users, sellers, businesses, shops, locations, orders, delivery, riders,
disputes, catalog, analytics, audit logs and platform settings.

The admin web talks to exactly **one** backend entry point — the Ariiti **API
Gateway** (`VITE_API_GATEWAY_URL`). It never calls the Identity, Commerce or
Delivery services directly.

```text
Browser (this SPA, dev :4000)
        |
        v
Ariiti API Gateway (:8000, /api/*)   <- the only published port
        |             |            |
        v             v            v
   Identity       Commerce      Delivery
   (:8001)        (:8002)       (:8003)
```

---

## Tech stack

| Area | Choice |
| --- | --- |
| UI | React 18, `react-router-dom` 6 (`createBrowserRouter`), lazy-loaded routes |
| Language | TypeScript 5.6 (`strict`, `noUnusedLocals`, `noUnusedParameters`) |
| Build tool | Vite 5 with the React plugin (`@` → `src` alias) |
| Styling | Tailwind CSS 3 (class-based dark mode) + CSS variables + CSS modules |
| Charts | Chart.js 4 (`src/components/charts`) |
| Icons | FontAwesome 6 |
| i18n | In-house provider over `locales/*.json` (`en`, `om`, `am`) |
| Quality | ESLint 8 (`@typescript-eslint`, `react-hooks`, `unused-imports`), Prettier 3 |
| E2E | Cypress config + support files (no specs committed yet) |

## Requirements

- Node `v20.16.0` — pinned by [`.nvmrc`](./.nvmrc)
- npm `>=10` — `package.json` `engines` requires Node `>=20.0.0`
- `.npmrc` sets `engine-strict=true`, so a wrong Node version fails `npm install`

## Quick start

```bash
nvm use
npm install          # or: npm ci (package-lock.json is committed)
cp .env.example .env.local
npm run dev          # http://localhost:4000
```

Sign in with an admin account that exists in your backend
(for the local Docker stack see `../ADMIN_WEB_COMPLETE.md` → seeded accounts).

Pointing at the local backend stack:

```bash
# from the repository root
docker compose up -d --build      # gateway listens on http://localhost:8000
```

## Environment variables

Only `VITE_*` variables are inlined into the browser bundle — never put
database credentials, private keys or service secrets in these files.

| Variable | Example | Purpose |
| --- | --- | --- |
| `VITE_API_GATEWAY_URL` | `http://localhost:8000/api` | Base URL of the API Gateway. Every request is `POST {VITE_API_GATEWAY_URL}/auth/token`, `GET {VITE_API_GATEWAY_URL}/admin/users`, … |
| `VITE_APP_NAME` | `Ariiti Admin` | UI display name. Also derives the session storage key `user-<VITE_APP_NAME>`, so changing it logs everyone out |
| `VITE_DEFAULT_LOCALE` | `en` | Declared in `src/utils/env.ts`; UI locales are `en`, `om`, `am` |

Committed files: [`.env.example`](./.env.example) (template),
[`.env.development`](./.env.development) (local gateway defaults) and
[`.env.production`](./.env.production) (intentionally keeps
`VITE_API_GATEWAY_URL` empty so CI/CD supplies the real URL at build time).
`.env.local` and all other `.env.*` files are git-ignored.

Vite inlines these values at **build/serve time** — restart `npm run dev` (and
rebuild for production) after changing them.

## Scripts

| Script | Command | Notes |
| --- | --- | --- |
| `npm run dev` | `vite` | Dev server on `http://localhost:4000` (`host: true`) |
| `npm run build` | `tsc --noEmit && vite build` | Type-check gate **then** bundle to `dist/` — see [Known gaps](#known-gaps) |
| `npm run typecheck` | `tsc --noEmit` | Type-check only |
| `npm run lint` | `eslint src --ext .ts,.tsx` | `legacy/`, `cypress/`, `mock-backend/` are ignored |
| `npm run preview` | `vite preview` | Serves the production build on `http://localhost:4173` |
| `npm run prettier` | `prettier --write src` | Uses [`.prettierrc`](./.prettierrc) (`singleQuote`, `semi`, `es5` commas) |
| `npm run mock` | `node mock-backend/server.cjs` | ⚠️ `mock-backend/` is not present in this checkout |
| `npm run cy:open` / `npm run cy:run` | `cypress open` / `cypress run` | Cypress is not in `devDependencies` and no specs exist yet |

## Project structure

```text
Aritii-admin-web/
├── index.html                  # Vite entry document (#root)
├── vite.config.ts              # dev :4000, preview :4173, "@" -> src
├── tailwind.config.ts          # class dark mode, Ariiti colour tokens
├── tsconfig.json               # strict TS, path alias, excludes legacy/dist
├── .env.example|.development|.production
├── cypress/                    # support/e2e.ts, support/commands.ts (no specs)
├── locales/                    # 33 translation files from the legacy app
├── legacy/                     # previous Next.js 13 + PrimeReact app (reference only)
├── public/                     # favicon, sw.js, static assets
└── src/
    ├── main.tsx                # createRoot -> <App />
    ├── app/
    │   ├── App.tsx             # ErrorBoundary > AppProviders > AppRoutes
    │   └── providers/AppProviders.tsx   # Theme, i18n, Toast, Configuration, Sector, Hierarchy, Auth
    ├── routes/
    │   ├── AppRoutes.tsx       # 52 route entries, 47 lazy page modules
    │   ├── navigation.ts       # sidebar groups + role visibility (NAV_GROUPS)
    │   ├── ProtectedRoute.tsx  # requires a session token
    │   └── RoleRoute.tsx       # role gate -> ForbiddenPage (403)
    ├── layouts/                # AuthLayout, DashboardLayout (header + selector + sidebar + outlet)
    ├── pages/                  # one folder per feature module
    ├── components/
    │   ├── common/             # Button, Card, Modal, DataTable… (design system)
    │   ├── charts/             # BarChart, LineChart, DonutChart (Chart.js)
    │   ├── forms/              # TextField, PasswordField, SelectField
    │   ├── layout/             # Header, Sidebar, MobileNav, NavList, UserMenu…
    │   ├── feedback/           # ToastViewport
    │   └── tables/DataTable.tsx
    ├── context/                # Auth, Configuration, Hierarchy, Sector, Theme, Toast
    ├── hooks/                  # useAsync, useAuth, useHierarchy, useSector, useTheme…
    ├── i18n/                   # I18nProvider + locale registry
    ├── services/               # feature facades, HTTP client, real/ implementations
    ├── api/admin.ts            # aggregate admin client (identity/commerce/delivery/…)
    ├── types/                  # domain + API envelope types
    ├── utils/                  # env, auth-storage, pkce, permissions, format, validation
    └── lib/                    # aritii-shared-utils integration boundary
```

## Architecture

```text
pages/ (**/*.tsx)
    │  typed calls only
    ▼
services/*.service.ts          feature facades, response-envelope mapping
    │
    ▼
services/real/*.ts             HTTP + auth/identity implementations
    │
    ▼
services/client/httpClient.ts  the only place fetch() is called
    │
    ▼
Ariiti API Gateway (VITE_API_GATEWAY_URL)
```

`src/api/admin.ts` is the older aggregate client (namespaces `identityAdmin`,
`commerceAdmin`, `analyticsAdmin`, `deliveryAdmin`, `disputesAdmin`,
`reportsAdmin`, `auditAdmin`, `adminRolesApi`, `adminApi`). New work should
prefer a `services/*.service.ts` facade, which mirrors the same endpoints in a
per-feature module.

### HTTP client behaviour (`src/services/client/httpClient.ts`)

- Attaches `Authorization: Bearer <access token>` from `localStorage` by
  default (`{ authenticated: false }` for auth endpoints).
- JSON bodies, `FormData` uploads, query-param serialisation, `204` → `undefined`.
- 15 s default timeout via `AbortSignal`; external `signal` is honoured.
- On `401`: single-flight token refresh, then **one** automatic retry; if the
  refresh fails the session is cleared and the user is sent to `/login`.
- Every failure becomes an `ApiError` (`src/types/api.ts`) with
  `statusCode` + optional `code`; network/timeout failures use status `0` with
  codes `NETWORK` / `TIMEOUT`.
- `assertGatewayConfigured()` throws `ApiError(503, 'Ariiti API Gateway is not
  configured…')` when `VITE_API_GATEWAY_URL` is empty — the UI never pretends to
  be live.

## Authentication

**OAuth 2.1 + OIDC Authorization Code Flow with mandatory PKCE (S256)** against
the Identity Service through the gateway. Client id: `aritii-admin-web`
(registered in the gateway/identity `OAUTH_CLIENTS` list). **No cookies and no
server-side sessions.**

```text
1. src/utils/pkce.ts            code_verifier (64 chars) + code_challenge = BASE64URL(SHA256(verifier))
2. POST /auth/authorize         { email, password, code_challenge, code_challenge_method: 'S256',
                                  client_id, state }            -> single-use code
3. POST /auth/token             { grant_type: 'authorization_code', code, code_verifier,
                                  client_id }                   -> access_token + refresh_token
4. GET  /user/getuser           Authorization: Bearer <access_token> -> admin profile
5. POST /auth/token             { grant_type: 'refresh_token', refresh_token, client_id }
                                -> rotated token pair (reuse detection server-side)
6. POST /auth/revoke            { token }  (RFC 7009) -> logout
```

Implementation: [`src/services/real/auth.ts`](./src/services/real/auth.ts),
wired into the HTTP client by
[`src/context/AuthContext.tsx`](./src/context/AuthContext.tsx)
(`authService.configureAuthHandlers`).

Session handling:

- Tokens and profile are kept in `localStorage` — keys `token`, `refreshToken`,
  `tokenExpiration`, `userId`, `userType` and `user-<VITE_APP_NAME>`
  (`src/utils/auth-storage.ts`).
- On first mount `AuthContext` restores the cached profile and calls
  `GET /user/getuser`; a 5 s safety timeout clears a stuck session.
- `ProtectedRoute` redirects to `/login` when there is no access token.
- Login performs the PKCE exchange and then loads the profile before navigating
  to the page the user came from (default `/home`).

### Roles and authorization

Backend roles are normalised to frontend roles in `src/services/real/auth.ts`
(`ROLE_MAP`):

| Backend role | `AdminRole` |
| --- | --- |
| `ADMIN`, `SUPER_ADMIN`, `STAFF` | `SUPER_ADMIN` |
| `SELLER`, `SELLER_ADMIN` | `SELLER_ADMIN` |
| `RIDER`, `RIDER_ADMIN` | `RIDER_ADMIN` |
| `CUSTOMER`, `CUSTOMER_ADMIN` | `CUSTOMER_ADMIN` |

- Route gate: `RoleRoute` renders [`ForbiddenPage`](./src/pages/ForbiddenPage.tsx)
  (403) when the role is not allowed.
- Permission helpers: `src/utils/permissions.ts` exposes `ALL_PERMISSIONS`,
  `hasPermission`, `hasAnyPermission` and the `usePermissions()` hook; the
  wildcard `'*'` grants everything. Missing scopes default to `['*']`.
- UI authorization is **defence in depth only** — the API Gateway/backends
  remain the source of truth.

## Route map

Roles: `SUPER` = `SUPER_ADMIN`; `+SELLER` = `SUPER_ADMIN, SELLER_ADMIN`;
`+RIDER` = `SUPER_ADMIN, RIDER_ADMIN`; `+CUSTOMER` = `SUPER_ADMIN, CUSTOMER_ADMIN`.

| Path | Page (module) | Roles |
| --- | --- | --- |
| `/login` | `LoginPage` (AuthLayout) | public |
| `/` → `/home` | `dashboard/HomePage` (KPI dashboard) | SUPER |
| `/operations` | `operations/OperationsPage` (live operations) | SUPER |
| `/explorer` | `explorer/PlatformExplorerPage` (platform explorer) | SUPER |
| `/users`, `/users/:userId` | `users/UsersPage`, `UserDetailPage` | +CUSTOMER |
| `/sellers`, `/sellers/:sellerId` | `sellers/SellersPage`, `SellerDetailPage` | +SELLER |
| `/businesses`, `/businesses/:businessId` | `businesses/BusinessesPage`, `BusinessDetailPage` | +SELLER |
| `/stores`, `/stores/pending`, `/stores/:storeId`, `/stores/analytics` | `stores/*` | +SELLER |
| `/locations`, `/locations/create`, `/locations/hierarchy`, `/locations/:locationId`, `/locations/:locationId/zones`, `/locations/bulk/import` | `locations/*` | SUPER |
| `/riders`, `/riders/pending`, `/riders/:riderId` | `riders/*` | +RIDER |
| `/customers`, `/customers/:customerId` | `customers/*` | +CUSTOMER |
| `/disputes` | `disputes/DisputesPage` | +CUSTOMER |
| `/admins`, `/admins/new`, `/admins/:adminId`, `/admin-roles` | `admins/*` | SUPER |
| `/categories`, `/reviews/pending` | `catalog/*` | +SELLER |
| `/sectors` | `catalog/SectorsPage` | SUPER |
| `/orders`, `/orders/:orderId` | `orders/*` | SUPER |
| `/analytics`, `/analytics/growth` | `analytics/*` | +CUSTOMER / SUPER |
| `/audit-logs` | `audit/AuditLogsPage` | SUPER |
| `/settings/platform`, `/settings/notifications`, `/settings/system` | `settings/*` | SUPER |
| `/commerce`, `/commerce/products`, `/commerce/transactions`, `/commerce/promotions` | `commerce/*` | SUPER |
| `/delivery`, `/delivery/assignments`, `/delivery/zones` | `delivery/*` | +RIDER |
| `/forbidden`, `*` | `ForbiddenPage`, `NotFoundPage` | public |

Sidebar navigation (`src/routes/navigation.ts`) is grouped as Dashboard, Users,
Businesses & Shops, Locations & Expansion, Commerce, Delivery, Disputes,
Reports & Analytics, Audit Logs, Platform Settings and Admin Roles &
Permissions; `useNavigationGroups()` filters items by the signed-in role.

## API layer

All requests flow through `services/client/httpClient.ts` to the API Gateway.
The endpoint contract per feature is documented in
[`src/services/README.md`](./src/services/README.md) — quick reference:

| Feature | Gateway endpoints |
| --- | --- |
| Auth | `POST /auth/authorize`, `POST /auth/token`, `POST /auth/revoke`, `GET /user/getuser` |
| Users / customers | `GET /admin/users`, `GET /admin/users/:id`, `PUT /admin/users/:id/status` |
| Sellers | `GET /admin/sellers`, `GET /admin/sellers/:id` |
| Businesses | `GET /admin/businesses`, `GET /admin/businesses/:id`, `POST /admin/businesses/:id/approve\|reject` |
| Shops | `GET /shop/admin/shops`, `GET /shop/admin/shops/pending` |
| Riders | `GET /delivery/actor`, `GET /delivery/actor/:id`, `POST /delivery/actor/:id/approve`, `PUT /delivery/actor/:id/status` |
| Orders | `GET /order/admin`, `GET /order/admin/:id`, `GET /admin/orders`, `GET /order/admin/reviews/pending` |
| Catalog | `GET /category`, `GET /sector` |
| Locations | `GET/POST /delivery/location`, `GET /delivery/location/hierarchy`, `PUT /delivery/location/:id/activate\|deactivate`, `GET /delivery/zone/location/:locationId`, `POST /delivery/zone` |
| Delivery | `GET /delivery/operation/dashboard`, `GET /delivery/zone` |
| Platform control center | `GET /admin/platform/stats\|pending\|hierarchy`, `GET /admin/operations`, `GET /admin/operations/:stage`, `GET /admin/growth-analytics` |
| Sector availability | `GET/PUT/DELETE /delivery/sector-availability/location/:id[/:sectorId]` |
| Disputes | `GET /disputes`, `PATCH /disputes/:id/status` |
| Analytics | `GET /analytics/stats`, `GET /analytics/growth`, `GET /analytics/orders-by-type` |
| Audit | `GET /admin/audit-logs`, `GET /admin/audit-logs/:id`, `GET /admin/audit-logs/filters`, `GET /admin/audit-logs/stats` |
| Settings | `GET/PUT /settings/platform`, `/settings/notifications`, `/settings/system` |
| Notifications | `GET /admin/notifications` |

Service files: `admins`, `analytics`, `audit`, `auth`, `businesses`, `catalog`,
`customers`, `hierarchyManager`, `locations`, `notifications`, `orders`,
`platformAdmin`, `riders`, `sellers`, `settings`, `stores`, `users`
(+ `client/httpClient.ts` and `real/{auth,settings}.ts`).

Note: `services/locations.service.ts` normalises MongoDB `_id` → `id` and maps
the `{ location }` / `{ locations, count }` / `{ hierarchy }` envelopes — keep
new response-shape handling inside the service layer, not in pages.

## Hierarchy scoping

Every module can be scoped to a node of the platform hierarchy:
**platform → region → city → area → sector → business → shop**.

- `src/context/HierarchyContext.tsx` — `useHierarchy()` returns the `selection`,
  setters (`setRegion`, `setCity`, …), `clearBelow`, `clearAll`, `getPath`,
  `getPathString`, `isAnySelected`.
- `src/components/HierarchySelector.tsx` — sidebar selector;
  `src/components/AdminScopeBar.tsx` — scope banner rendered on every page by
  `DashboardLayout`; `HierarchyBreadcrumb`, `HierarchyTree`, `HierarchySidebar`,
  `HierarchyNodeModal`, `MobileHierarchyView` support drill-down UIs.
- `src/utils/hierarchyQueryBuilder.ts` — turns the selection into API query
  parameters; `platformAdmin.service.ts` exposes hierarchy-aware methods
  (`getStatsByHierarchy`, `listOrdersByHierarchy`, …).
- Selection persists in `localStorage` under `adminHierarchySelection`.
- Integration recipes: [`src/HIERARCHY_INTEGRATION.md`](./src/HIERARCHY_INTEGRATION.md).

## Internationalisation

`src/i18n/I18nProvider.tsx` provides `useLocalization()` → `{ t, locale,
setLocale, messages }`:

- `t('key')`, dot-notation (`t('a.b')`) and `{placeholder}` interpolation.
- Bundled locales: **`en`, `om`, `am`** (`src/i18n/locales.ts` →
  `locales/{en,om,am}.json`); missing keys fall back to English, then to the key.
- Selected locale persists in `localStorage` under `ariiti-locale` and is applied
  to `<html lang>`.
- `locales/` also holds ~30 extra JSON files inherited from the legacy admin
  template; they are **not** bundled.

## Theming and styling

- Tailwind CSS with **class-based dark mode**
  ([`tailwind.config.ts`](./tailwind.config.ts)); `ThemeContext` toggles the
  `dark` class on `<html>` and the `ThemeToggle` button sits in the header.
- Brand colours are CSS variables in [`src/index.css`](./src/index.css):
  `--primary-color` (`#b1c748`), `--primary-dark` (`#5ac12f`),
  `--secondary-color` (`#bac973`) plus `--dark-950` / `--dark-900` / `--dark-600`.
- Reusable primitives live in `src/components/common` (`Button`, `Card`,
  `Modal`, `StatCard`, `StatusBadge`, `Pagination`, `Skeleton`, `EmptyState`,
  `ErrorState`, `ConfirmDialog`, …) and `src/components/tables/DataTable.tsx`.
- `prettier-plugin-tailwindcss` is installed but is **not** listed in
  `.prettierrc`, so `npm run prettier` does not rewrite class order
  automatically — keep Tailwind classes hand-sorted for now.
- Theme default comes from `prefers-color-scheme`; `ThemeContext` persists the
  choice and toggles `document.documentElement.classList.toggle('dark', …)`.

## Quality gates

Inside `Aritii-admin-web/`:

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # eslint src --ext .ts,.tsx
npm run prettier     # format src
```

Across the repository (from `/`), the contract suites exercise this app too —
`tests/frontend-contract.js` extracts every gateway endpoint called from
`Aritii-admin-web/src` and `tests/no-cookies.test.js` scans
`Aritii-admin-web/src` for cookie usage:

```bash
cd ..                # repository root
npm test             # node --test tests/*.test.js
```

At the current commit this repository-level suite passes (48/48 tests,
`exit=0`).

The Cypress folder (`cypress.config.ts` with `baseUrl: http://localhost:3001`,
`cypress/support/*`) is scaffolding only: `cypress` is not a dependency and no
specs are committed, so `npm run cy:run` will not do anything useful yet.

## Build and deploy

```bash
npm run build        # tsc --noEmit && vite build  -> dist/
npm run preview      # serve dist/ on http://localhost:4173
```

- Deployment target is **static hosting** of `dist/` (no Node server, no
  Dockerfile or compose service for this app).
- Because routing uses the History API, the host must rewrite unknown paths to
  `/index.html` (SPA fallback), otherwise deep links 404.
- `VITE_API_GATEWAY_URL` has to be provided as a CI/CD build-time environment
  variable — `.env.production` deliberately leaves it empty.
- The gateway/identity service must keep `aritii-admin-web` in `OAUTH_CLIENTS`
  (`docker-compose.yml`, `services/identity-service/src/config/env.js`).
- `public/sw.js` is copied to `dist/` as a static asset; it is not registered by
  the app.

## Known gaps

1. **`npm run typecheck` / `npm run build` currently fail.** `tsc --noEmit`
   reports 105 errors across 23 files — mostly unused variables/imports
   (`noUnusedLocals`, `unused-imports`) and prop/type drift in the newer
   dashboard/hierarchy components (`AdvancedReporting`, `EnhancedPlatformExplorer`,
   `SmartDashboard`, `HierarchyNodeModal`, `LocationsPage`,
   `hierarchyManager.service`, `types/customer`). `npx vite build` on its own
   succeeds (esbuild does not type-check), so a bundle can be produced while the
   gate is red.
2. `npm run mock` references `mock-backend/server.cjs`, which is not present in
   this checkout.
3. `/home` is gated to `SUPER_ADMIN` in `AppRoutes.tsx`, while `navigation.ts`
   shows Home to all four roles — a non-super admin landing on `/home` gets the
   403 page.
4. `VITE_DEFAULT_LOCALE` is declared in `src/utils/env.ts` but locale resolution
   actually uses the `ariiti-locale` value, else `en` (`src/i18n/locales.ts`).
5. Older repository docs (e.g. `../ADMIN_WEB_COMPLETE.md`) still mention
   `http://localhost:3000` for the admin web and `npm run start`; the Vite dev
   server runs on **4000** and the production script is `preview`.
6. `legacy/` is the previous Next.js 13 + PrimeReact admin template, kept for
   reference only — excluded from `tsconfig.json`, ESLint, the build and the
   repo boundary tests. `CHANGELOG.md` describes that legacy app, not this SPA.

## Conventions

- Import through the `@/` alias (`@/services/...`, `@/components/...`).
- Pages never call `fetch`/`http` directly — go through a `services/*.service.ts`
  facade so envelopes, `_id` → `id` mapping and error typing stay in one place.
- Feature routes are lazy-loaded and wrapped in `Suspend` (Suspense + RoleRoute).
- No `any` (`@typescript-eslint/no-explicit-any: error`), no unused imports, no
  unused locals; Prettier settings come from `eslint-config-prettier`.
- No cookies: tokens live in `localStorage` only (enforced by
  `tests/no-cookies.test.js`), and tokens are issued **only** by
  `POST /auth/token`.
- Only `VITE_*` values may reach the browser bundle; never commit `.env.local`
  or secrets.
- Shared code destined for `aritii-shared-utils` / `aritii-shared-types` stays
  behind the boundaries described in [`src/lib/README.md`](./src/lib/README.md)
  and `src/types/api.ts`.

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `ApiError 503: Ariiti API Gateway is not configured` | `VITE_API_GATEWAY_URL` is empty — set it in `.env.local` and restart `npm run dev` |
| Requests fail with `NETWORK` (status `0`) | Gateway not running or wrong URL (`docker compose up -d --build`) |
| Redirected to `/login` right after load | Refresh token missing, expired or already rotated — sign in again; clear `localStorage` to reset the session |
| Login rejected | Gateway must allow the `aritii-admin-web` client; PKCE needs a secure context (HTTPS or `localhost`) |
| 403 page after login | The signed-in role is not allowed on that route (see [Route map](#route-map)) |
| Everyone logged out after a deploy | `VITE_APP_NAME` changed, which changes the `user-<appName>` session key |
| Port already in use | Change `server.port` in `vite.config.ts` |
| `npm install` refuses to run | Node version does not satisfy `.nvmrc`/`engines` (`engine-strict=true`) |

## Further documentation

In this folder:

- [`src/services/README.md`](./src/services/README.md) — endpoint map per feature
- [`src/lib/README.md`](./src/lib/README.md) — `aritii-shared-utils`/`-types` boundary
- [`src/HIERARCHY_INTEGRATION.md`](./src/HIERARCHY_INTEGRATION.md) — hierarchy patterns
- [`COMPREHENSIVE_ENHANCEMENTS_COMPLETE.md`](./COMPREHENSIVE_ENHANCEMENTS_COMPLETE.md) — enhancement inventory
- [`ADMIN_DASHBOARD_ENHANCEMENTS_SUMMARY.md`](./ADMIN_DASHBOARD_ENHANCEMENTS_SUMMARY.md)
- [`HIERARCHY_ARCHITECTURE.txt`](./HIERARCHY_ARCHITECTURE.txt), [`HIERARCHY_QUICK_START.md`](./HIERARCHY_QUICK_START.md), [`HIERARCHY_MANAGEMENT_GUIDE.md`](./HIERARCHY_MANAGEMENT_GUIDE.md), [`UNIFIED_HIERARCHY_SYSTEM.md`](./UNIFIED_HIERARCHY_SYSTEM.md)

In the repository root:

- [`../ARCHITECTURE.md`](../ARCHITECTURE.md) — services, gateway and auth design
- [`../DOCUMENTATION.md`](../DOCUMENTATION.md) — run/build instructions for the whole stack
- [`../ADMIN_WEB_COMPLETE.md`](../ADMIN_WEB_COMPLETE.md) — admin feature and seed-account reference
- [`../PLATFORM_ADMIN_COMPLETE.md`](../PLATFORM_ADMIN_COMPLETE.md) — platform admin control center

## License

MIT — see [`LICENSE`](./LICENSE) (inherited from the Creative Tim admin template
the legacy admin app was based on).
