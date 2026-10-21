# Ariiti Market - Admin Web

**Modern enterprise operator and platform management console** for the Ariiti Multi-Seller Marketplace. Built with React 18, Vite, TypeScript, and Tailwind CSS.

**Status:** ✅ Production Ready | **Port:** 4000 | **Auth:** OAuth 2.1 + PKCE + 2FA | **Type:** TypeScript Strict

---

## 🚀 Quick Start

### Prerequisites
- Node.js `>= 20.16.0` (pinned by [`.nvmrc`](./.nvmrc))
- npm `>= 10.0.0` (enforced via `.npmrc` `engine-strict=true`)
- Docker & Docker Compose (for running backend microservices & the API Gateway)

### Setup & Run Locally

```bash
# 1. Switch to compatible Node version
nvm use

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local

# 4. Start local development server
npm run dev

# Open http://localhost:4000
```

### Build for Production

```bash
npm run build        # Type-checks and bundles output into dist/
npm run preview      # Serves production build locally on http://localhost:4173
```

### Seeded Admin Credentials (Local Development)

The backend provides default administrative accounts seeded for testing various permission levels:

| Role | Email | Password | Primary Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@aritii.com` | `Admin123!` | Full platform administration, system settings, audit logs & RBAC |
| **Operations Admin** | `admin@aritii.com` | `Admin123!` | Marketplace operations, user management & catalog |
| **Seller Admin** | `selleradmin@aritii.com` | `Admin123!` | Business, seller & shop approvals and catalog moderation |
| **Rider Admin** | `rideradmin@aritii.com` | `Admin123!` | Deliveries, logistics, providers & dispatch |
| **Customer Admin**| `customeradmin@aritii.com` | `Admin123!` | Users, buyers, customers & dispute resolution |

---

## 🏛️ System Architecture

The admin console interacts exclusively with the **Ariiti API Gateway**. It never communicates directly with internal microservices.

```text
Browser (Admin Web SPA — http://localhost:4000)
                    │
                    ▼
      Ariiti API Gateway (:8000, /api/*)
    ┌───────────────┼───────────────┐
    ▼               ▼               ▼
Identity Service  Commerce Service Delivery Service
  (:3000)         (:3002)         (:3003)
```

- **Single Entry Point**: All API calls target `VITE_API_GATEWAY_URL` (`http://localhost:8000/api`).
- **Stateless Tokens**: OAuth 2.1 Bearer JWTs stored in `localStorage`. **No cookies** are utilized.
- **Microservice Routing**: The API Gateway validates tokens, scopes, and routes requests to Identity, Commerce, Delivery, and Analytics services.

---

## 📋 Project Structure

```text
Aritii-admin-web/src/
├── app/                        # Application root & global provider tree
│   ├── App.tsx                 # ErrorBoundary > AppProviders > AppRoutes
│   └── providers/              # Theme, i18n, Toast, Sector, Hierarchy, Auth
│
├── routes/                     # Centralized router & access control
│   ├── AppRoutes.tsx           # Route declarations & lazy-loaded pages
│   ├── navigation.ts           # Navigation groups & role-based visibility
│   ├── ProtectedRoute.tsx      # Authentication gate
│   └── RoleRoute.tsx           # Role-based 403 Forbidden gate
│
├── layouts/                    # Layout shells
│   ├── AuthLayout.tsx          # Clean layout for login & 2FA verify
│   └── DashboardLayout.tsx     # Header, Hierarchy ScopeBar, Sidebar, Outlet
│
├── pages/                      # Feature modules
│   ├── dashboard/              # KPI Dashboards & Operational Analytics
│   ├── users/                  # User accounts & customer management
│   ├── sellers/                # Seller verification & performance
│   ├── businesses/             # Business entity management & approvals
│   ├── stores/                 # Shop management & store analytics
│   ├── locations/              # Regions, cities, areas & delivery zones
│   ├── delivery/               # Deliveries, logistics & provider management
│   ├── orders/                 # Order lifecycle & refund processing
│   ├── catalog/                # Categories, sectors & product reviews
│   ├── disputes/               # Customer dispute resolution
│   ├── analytics/              # Platform & growth analytics
│   ├── audit/                  # Security audit logs
│   ├── admins/                 # Administrator directory & RBAC matrix
│   └── settings/               # Platform, notification & system settings
│
├── components/                 # Reusable UI component library
│   ├── common/                 # Button, Card, Modal, DataTable, StatCard
│   ├── charts/                 # Line, Bar, and Donut charts (Chart.js)
│   ├── forms/                  # Form fields, toggles, validators
│   ├── layout/                 # Header, Sidebar, NavList, UserMenu
│   ├── feedback/               # Toast notifications & dialogs
│   ├── TwoFactorSetup.tsx      # 2FA setup wizard (TOTP, Email, SMS)
│   ├── TwoFactorVerify.tsx     # 2FA login verification challenge
│   └── TwoFactorSettings.tsx   # 2FA management & backup codes
│
├── context/                    # React Context providers
│   ├── AuthContext.tsx         # User authentication, token lifecycle & 2FA
│   ├── HierarchyContext.tsx    # Multi-level platform scoping
│   ├── ThemeContext.tsx        # Dark/light mode state
│   └── ToastContext.tsx        # In-app alert system
│
├── services/                   # API integration facades
│   ├── client/httpClient.ts    # Central HTTP client (fetch, interceptors, retry)
│   ├── real/auth.ts            # OAuth 2.1, PKCE & 2FA API implementation
│   ├── users.service.ts        # User APIs
│   ├── businesses.service.ts   # Business verification APIs
│   ├── orders.service.ts       # Order lifecycle APIs
│   ├── locations.service.ts    # Geo-hierarchy APIs
│   └── platformAdmin.service.ts# High-level operational stats
│
├── types/                      # TypeScript domain definitions
│   ├── api.ts                  # API envelope & error types
│   ├── auth.ts                 # User roles, tokens & claims
│   ├── hierarchy.ts            # Regional & store hierarchy types
│   └── order.ts                # Order and fulfillment types
│
├── i18n/                       # Localization (English, Oromo, Amharic)
│   ├── I18nProvider.tsx        # Context & translation hook `useLocalization()`
│   └── locales.ts              # Locale dictionary loader
│
└── utils/                      # Utilities
    ├── auth-storage.ts         # LocalStorage token helpers
    ├── pkce.ts                 # Cryptographic PKCE challenge generator
    ├── permissions.ts          # Granular permission check helpers
    └── env.ts                  # Safe environment variable access
```

---

## 🔐 Authentication, Security & 2FA

The Admin Web implements an **OAuth 2.1 + OIDC Authorization Code Flow with Proof Key for Code Exchange (PKCE - S256)** and integrated **Two-Factor Authentication (2FA)**.

### Login & 2FA Lifecycle

```text
1. PKCE Generation      -> code_verifier (64 chars) + code_challenge = SHA256(verifier)
2. Authorize Request    -> POST /auth/authorize (email, password, code_challenge, client_id)
3. 2FA Evaluation       -> If 2FA enabled: returns { requires2fa: true, tempToken, method }
                           -> User completes 6-digit TOTP / SMS / Email challenge or backup code
                           -> POST /auth/verify-2fa -> returns single-use authorization code
4. Token Exchange       -> POST /auth/token (authorization_code, code_verifier) -> access_token + refresh_token
5. Session Load         -> GET /user/getuser (Bearer JWT) -> Admin profile, role claims, permissions
6. Token Rotation       -> POST /auth/token (grant_type: 'refresh_token') on 401 or expiration
7. Revocation           -> POST /auth/revoke (RFC 7009) on logout
```

### Two-Factor Authentication Capabilities
- **Authenticator App (TOTP)**: Google Authenticator, Microsoft Authenticator, Authy (offline, recommended).
- **Email / SMS OTP**: One-time verification codes dispatched via email or text message.
- **Emergency Backup Codes**: 10 one-time recovery codes generated upon setup with Copy, Download `.txt`, and Print options.
- **Password-Protected Disable**: Disabling 2FA strictly requires account password verification.

### Role-Based Access Control (RBAC)

Administrators are granted access based on four normalized roles:

| Role | Permissions & Scope |
| :--- | :--- |
| `SUPER_ADMIN` | Full access across all modules, platform controls, RBAC, settings, and audit logs. |
| `SELLER_ADMIN` | Management of sellers, businesses, shops, catalog, sectors, and product reviews. |
| `RIDER_ADMIN` | Management of delivery logistics, dispatching, riders, and operating zones. |
| `CUSTOMER_ADMIN` | User account management, customer profiles, order oversight, and dispute resolution. |

```tsx
// Route Guard Example:
<Route element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'SELLER_ADMIN']} />}>
  <Route path="/businesses" element={<BusinessesPage />} />
</Route>

// Permission Check Example:
const { hasPermission } = usePermissions();
if (hasPermission('orders:cancel')) {
  // Render cancel action
}
```

---

## 🌐 Centralized API Services Layer

All network requests flow through `src/services/client/httpClient.ts`:

- **Automatic Bearer Token Injection**: Pulls the current token from `localStorage` for authenticated requests.
- **Single-Flight Token Refresh**: Intercepts `401 Unauthorized`, rotates tokens, and retries the original request seamlessly.
- **Structured Error Handling**: Wraps network drops, timeouts, and gateway errors in typed `ApiError` instances.
- **Standardized Envelopes**: Normalizes backend MongoDB `_id` to `id` and extracts payload bodies.

### Key Service Facades

| Service | Primary Endpoints | Description |
| :--- | :--- | :--- |
| `authService` | `/auth/authorize`, `/auth/token`, `/user/getuser`, `/user/2fa/*` | Session management & 2FA workflows |
| `usersService` | `/admin/users`, `/admin/users/:id/status` | User accounts, roles, and status changes |
| `businessesService` | `/admin/businesses`, `/admin/businesses/:id/approve` | Business entity compliance and approvals |
| `storesService` | `/shop/admin/shops`, `/shop/admin/shops/pending` | Merchant shops and store analytics |
| `locationsService` | `/delivery/location`, `/delivery/zone` | Regions, cities, areas, and geo-fenced zones |
| `ordersService` | `/order/admin`, `/order/admin/reviews/pending` | Order lifecycle, tracking, and review moderation |
| `platformAdmin` | `/admin/platform/stats`, `/admin/growth-analytics` | KPI summary statistics and cross-service telemetry |
| `auditService` | `/admin/audit-logs`, `/admin/audit-logs/filters` | Security and compliance audit records |

---

## 🗺️ Multi-Level Platform Hierarchy & Scoping

The admin dashboard supports hierarchical scoping across the entire platform:

```text
Platform ──> Region ──> City ──> Area ──> Sector ──> Business ──> Shop
```

- **`HierarchyContext`**: Provides active selection (`selection`), setters, breadcrumbs, and persistence via `localStorage`.
- **`AdminScopeBar`**: Sticky header banner displayed on all operational pages showing current hierarchy scope.
- **`HierarchySelector`**: Interactive tree selector allowing operators to filter KPIs and data tables by specific cities, sectors, or stores.
- **`hierarchyQueryBuilder`**: Utility automatically appending query parameters (`regionId`, `cityId`, `shopId`) to outgoing API requests.

---

## 🛍️ Comprehensive Feature Modules

### 1. KPI & Operational Dashboards
- Real-time revenue, order volume, active riders, and pending approvals.
- Visual charts (revenue trends, orders by fulfillment type, category distribution).
- Quick links to high-priority moderation queues.

### 2. User & Customer Management
- Unified user directory filtered by role (Buyer, Seller, Rider, Admin).
- Account status controls (Active, Suspended, Banned) with reason tracking.
- Customer order history, saved addresses, and profile details.

### 3. Business & Seller Verification
- Business onboarding workflow: document review, tax ID validation, and KYC approval/rejection.
- Seller performance metrics, ratings, and shop counts.

### 4. Shop & Storefront Oversight
- Approvals queue for newly registered merchant stores.
- Operating status management and merchant analytics.

### 5. Delivery, Logistics & Riders
- Live delivery monitoring with status tracking (`pending`, `assigned`, `in_transit`, `delivered`).
- Rider directory, onboarding approvals, vehicle verification, and zone assignments.
- Geo-fenced delivery zone creation and location mapping.

### 6. Catalog, Sectors & Moderation
- Multi-tier product categories and business sectors.
- Customer review moderation queue (Approve / Reject reviews).

### 7. Disputes & Customer Support
- Structured dispute handling for refunds, damaged goods, or missing orders.
- Direct communication audit trail and resolution workflows.

### 8. Audit Logs & Platform Settings
- Tamper-evident administrative audit logs with IP, user agent, and timestamp.
- Platform configurations, automated notification templates, and system parameters.

---

## 🎨 Theming & Internationalization (i18n)

### Design Tokens & Tailwind Dark Mode
- Full support for dark and light modes via Tailwind's `class` strategy.
- Brand colors configured via CSS variables in [`src/index.css`](./src/index.css):
  - Primary: `#b1c748` / `#5ac12f`
  - Secondary: `#bac973`
  - Dark Surfaces: `#131921`, `#1a222d`, `#232f3e`
- Responsive breakpoints: Mobile (`< 640px`), Tablet (`640px - 1024px`), Desktop (`> 1024px`).

### Multi-Language Localization
- Supported Locales: **English (`en`)**, **Oromo (`om`)**, and **Amharic (`am`)**.
- Uses `useLocalization()` hook:
  ```tsx
  const { t, locale, setLocale } = useLocalization();
  return <h1>{t('dashboard.welcome')}</h1>;
  ```
- Locale preferences are saved to `localStorage` and applied to `<html lang="...">`.

---

## 🛠️ Available Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `vite` | Starts local dev server at `http://localhost:4000` |
| `npm run build` | `tsc --noEmit && vite build` | Type-checks code and generates production bundle in `dist/` |
| `npm run typecheck`| `tsc --noEmit` | Runs TypeScript compiler checks without emitting files |
| `npm run lint` | `eslint src --ext .ts,.tsx` | Lints TypeScript and React source files |
| `npm run preview` | `vite preview` | Previews the production build locally at `http://localhost:4173` |
| `npm run prettier`| `prettier --write src` | Automatically formats codebase to Prettier standards |

---

## ⚙️ Environment Variables

Configure settings in `.env.local`:

| Variable | Default / Example | Purpose |
| :--- | :--- | :--- |
| `VITE_API_GATEWAY_URL` | `http://localhost:8000/api` | Base URL of the API Gateway entry point. |
| `VITE_APP_NAME` | `Ariiti Admin` | Display name and session namespace key in `localStorage`. |
| `VITE_DEFAULT_LOCALE` | `en` | Default UI fallback locale (`en`, `om`, `am`). |

> **Security Note:** Only variables prefixed with `VITE_` are bundled into client code. Never include private keys, database passwords, or gateway secrets in frontend `.env` files.

---

## 🧪 Quality Gates & Troubleshooting

### Quality Checks
```bash
# Verify TypeScript typing
npm run typecheck

# Verify code style and lint rules
npm run lint

# Format code
npm run prettier
```

### Common Issues & Fixes

| Symptom | Probable Cause | Resolution |
| :--- | :--- | :--- |
| `ApiError 503: Gateway not configured` | `VITE_API_GATEWAY_URL` is empty | Set `VITE_API_GATEWAY_URL=http://localhost:8000/api` in `.env.local` and restart Vite. |
| Network Error (`status: 0`) | Backend or Gateway not running | Start the backend stack using `docker compose up -d` in `backend-micro`. |
| 403 Forbidden Page | Logged-in admin lacks required role | Sign in using an account with appropriate permissions (e.g. `SUPER_ADMIN`). |
| 2FA Code Rejected | Clock skew or invalid code | Verify device time synchronization. Use emergency backup codes if necessary. |
| Immediate redirect to `/login` | Expired refresh token or rotated session | Clear browser `localStorage` and log in again. |

---

## 🤝 Contributing

1. Create a descriptive feature branch: `git checkout -b feature/admin-feature-name`
2. Ensure changes follow TypeScript strict guidelines and pass `npm run typecheck`
3. Commit with conventional commit messages: `git commit -m "feat(module): add feature"`
4. Push and create a Pull Request to `main`.

---

## 📄 License

All rights reserved © Ariiti Market 2026.
