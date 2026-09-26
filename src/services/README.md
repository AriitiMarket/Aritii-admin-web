# Service layer — endpoint map

The admin web talks to the **Ariiti API Gateway** only
(`VITE_API_GATEWAY_URL`). It never connects to microservices directly.

## Architecture

Feature facades (`*.service.ts`) delegate to the `real/` implementations,
which use the shared HTTP client to call the API Gateway.

## Endpoint map

| Feature | Ariiti Gateway contract |
| --- | --- |
| Login | `POST /auth/authorize` (credentials + PKCE S256) then `POST /auth/token` (authorization_code grant) |
| Current admin | `GET /user/getuser` |
| Token refresh | `POST /auth/token` (refresh_token grant — rotates the refresh token) |
| Users | `GET /admin/users`, `GET /admin/users/:id`, `PUT /admin/users/:id/status` |
| Customers | `GET /admin/users?role=BUYER` |
| Sellers | `GET /admin/sellers`, `GET /admin/sellers/:id` |
| Stores | `GET /shop/admin/shops`, `GET /shop/admin/shops/pending` |
| Riders | `GET /delivery/actor`, `GET /delivery/actor/:id`, `POST /delivery/actor/:id/approve`, `PUT /delivery/actor/:id/status` |
| Orders | `GET /order/admin`, `GET /order/admin/:id` |
| Analytics | `GET /analytics/stats`, `GET /analytics/growth`, `GET /analytics/orders-by-type` |
| Categories | `GET /category` |
| Sectors | `GET /sector` |
| Reviews | `GET /order/admin/reviews/pending` |
| Disputes | `GET /disputes`, `PATCH /disputes/:id/status` |
| Settings | `GET/PUT /settings/platform`, `/settings/notifications`, `/settings/system` |
| Locations | `GET /delivery/location`, `POST /delivery/location`, `GET /delivery/location/hierarchy`, `PUT /delivery/location/:id/activate\|deactivate` |
| Delivery | `GET /delivery/operation/dashboard`, `GET /delivery/zone` |
| Notifications | `GET /admin/notifications` |
| Seller Applications | `GET /seller-application`, `POST /seller-application/:id/approve` |

## Hierarchy filters (one shared contract)

Every hierarchy-aware platform read accepts the **same** filter vocabulary,
produced exclusively by
[`src/utils/hierarchyQueryBuilder.ts`](./../utils/hierarchyQueryBuilder.ts):

```
regionId, cityId, areaId, sectorId, businessId, shopId
```

Accepted by:

| Endpoint | Hierarchy filters | Notes |
| --- | --- | --- |
| `GET /admin/platform/stats` | ✅ | Scopes businesses/shops/orders. `users`/`deliveries`/`locations` stay platform-wide; the response reports this via `scopeApplied` / `scopeNote`. |
| `GET /admin/businesses` | ✅ | Resolved through the shops owned by each seller. |
| `GET /admin/shops` | ✅ | `businessId` matches the application link or the owner. |
| `GET /admin/orders` | ✅ | Resolved through the shops that own the sellers. |
| `GET /admin/operations/:stage` | ✅ | Same resolver as `/admin/orders`. |
| `GET /admin/growth-analytics` | ✅ | Same resolver; region/city/area expand to descendant locations. |

Backend resolution lives in one place —
`commerce-service/src/admin/services/adminPlatform.service.js`
(`resolveHierarchyScope` + `expandLocationIds`). Non-leaf selections
(region/city/area) are expanded to their descendant location ids through the
Delivery-owned location tree, because a shop stores a single leaf `locationId`.
The legacy spellings `locationId` / `location` / `region` / `city` / `sector`
are still accepted so older callers are never silently ignored.

> **Do not** add a new hierarchy filter shape to a page. Extend
> `hierarchyQueryBuilder.ts` instead — the backend resolver is the counterpart,
> and the two must stay in step.
