# Service layer — endpoint map

The admin web talks to the **Ariiti API Gateway** only
(`VITE_API_GATEWAY_URL`). It never connects to microservices directly.

Two implementations exist per feature:

| Directory | Purpose |
| --- | --- |
| `src/services/mock/*` | Bundled mock backend + explicitly labeled demo generators. Active when `VITE_USE_MOCKS=true`. |
| `src/services/real/*` | Documented Ariiti API Gateway contracts. Active when `VITE_USE_MOCKS=false`. These are **integration boundaries** (`@boundary`) — they describe the final endpoint contract and are pending backend implementation. Nothing in them is silently fake. |

The feature facades (`*.service.ts`) switch between the two based on
`isMockMode()` — mock data is never mixed into live requests.

## Endpoint map

| Feature | Mock endpoint (existing `mock-backend`) | Ariiti Gateway contract (boundary) |
| --- | --- | --- |
| Login | `POST /auth/login` | `POST /identity/auth/login` |
| Current admin | `GET /admin/profile` | `GET /identity/auth/me` |
| Token refresh | — (mock tokens never expire) | `POST /identity/auth/refresh` |
| Users | `GET /admin/users`, `GET /admin/user/:id`, `PUT/DELETE ...` | `GET /admin/users` etc. |
| Customers | derived from mock users | `GET /customers`, `GET /customers/:id` |
| Sellers | `GET /admin/vendors`, `GET /admin/vendor/:id` | `GET /sellers`, `GET /sellers/:id` |
| Stores | `GET /admin/restaurants`, `GET /admin/restaurant/profile?id=` | `GET /stores`, `GET /stores/:id` |
| Riders | `GET /admin/riders`, `GET /admin/rider/:id` | `GET /riders`, `GET /riders/:id` |
| Orders | `GET /admin/orders`, `GET /admin/order/:id` | `GET /orders`, `GET /orders/:id` |
| Stats | `GET /admin/stats` | `GET /analytics/stats` |
| Dashboard series | `GET /admin/dashboard/users-by-year` etc. | `GET /analytics/growth` etc. |
| Platform settings | `GET/PUT /config` | `GET/PUT /settings/platform` |
| Notification/system settings | — (local demo only) | `GET/PUT /settings/notifications`, `/settings/system` |
| Notifications | `GET /admin/notifications` | `GET /notifications` |
| Categories / Sectors / Reviews / Disputes | — (explicit demo generator) | `GET /categories`, `/sectors`, `/reviews/pending`, `/disputes` |

**Mock surfaces without a server endpoint** (categories, sectors, reviews,
disputes, admin accounts, settings toggles) use `src/services/mock/generators.ts`
and print a console warning so no one mistakes demo data for live data.