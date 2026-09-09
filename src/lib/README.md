# `aritii-shared-utils` integration boundary (Phase 5)

The Ariiti Admin Web must use `aritii-shared-utils` for common API and
utility behavior **when the package becomes available in this repository**.

Until then, the frontend keeps a clean, local integration boundary at
`src/lib/aritii-shared-utils.ts`. Each importing module depends on that
boundary, so swapping the implementation is a single-file change.

## Expected API contract

These are the functions the shared package is expected to expose. The local
boundary implements their behaviour today; anything marked `[boundary only]`
already lives in `src/services/client` instead.

| Area | Expected API | Local today |
| --- | --- | --- |
| API client | `createApiClient({ baseUrl, getToken, onUnauthorized })` | `src/services/client/httpClient.ts` |
| Token attachment | `attachAuthToken(request, token)` | `httpClient` headers |
| HTTP errors | `normalizeHttpError(error) -> ApiError` | `src/types/api.ts` |
| Retries | `withRetry(requestFn, { attempts, delayMs })` | `httpClient` (single retry) |
| Timeouts | `withTimeout(requestFn, timeoutMs)` | `httpClient` (AbortSignal) |
| Token refresh | `refreshTokens(api, payload)` | `auth.service.ts` refresh flow |
| Formatting | `formatCurrency / formatDate / timeAgo` | `src/utils/format.ts` |
| Auth helpers | `mapUserTypeToRole / hasPermission` | `src/utils/auth-roles.ts` |

> Do **not** invert this: never rewrite shared behaviour into feature code
> and never import these helpers from `legacy/` in the new architecture.

## `aritii-shared-types` (Phase 6)

Domain models live in `src/types` and are annotated as temporary local
duplicates. Phase 6 replaces them with `aritii-shared-types` — no phase 5
work should duplicate a type that the shared package is known to define.