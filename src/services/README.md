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
