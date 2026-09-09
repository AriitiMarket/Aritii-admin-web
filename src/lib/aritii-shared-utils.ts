/**
 * `aritii-shared-utils` integration boundary.
 *
 * Phase 5 keeps this module as a LOCAL, working implementation of the API
 * helpers the frontend needs. In a later phase these functions are replaced
 * by the `aritii-shared-utils` package — the import sites elsewhere in the
 * codebase must continue to work unchanged.
 *
 * Expected `aritii-shared-utils` API contract (subject to its published API):
 *   - createApiClient(opts)                 -> HTTP client with base URL
 *   - attachAuthToken(client, getToken)      -> bearer token attachment
 *   - normalizeHttpError(error)              -> normalized error model
 *   - withRetry(request, { attempts, delayMs })
 *   - withTimeout(request, { timeoutMs })
 *   - refreshTokens(api, refreshPayload)     -> token refresh coordination
 *   - formatCurrency, formatDate, timeAgo    -> formatting helpers
 *   - hasPermission, mapUserTypeToRole       -> shared auth helpers
 *
 * See src/lib/README.md for the full boundary document.
 */

export { ApiError, isApiError } from '@/types/api';
export type { ApiEnvelope, PaginatedResult, PaginationParams } from '@/types/api';