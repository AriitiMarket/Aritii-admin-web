/**
 * Extract a human-readable message from a failed API call.
 *
 * The HTTP client rejects with Axios-shaped errors (`error.response.data.message`);
 * anything else (network failure, thrown Error) falls back so callers never
 * surface "undefined" to the admin.
 */
export function apiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { message?: unknown } } }).response;
    const message = response?.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
