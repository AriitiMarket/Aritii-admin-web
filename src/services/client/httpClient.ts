/**
 * Ariiti API Gateway HTTP client.
 *
 * The admin web NEVER talks to microservices directly — every request flows
 * through the single configured gateway URL (VITE_API_GATEWAY_URL).
 *
 * Capabilities:
 *  - JSON envelope handling (see src/types/api.ts)
 *  - bearer token attachment from session storage
 *  - request timeouts (AbortSignal) and external signal support
 *  - single-flight token refresh on 401 with automatic retry
 *  - normalized ApiError for every failure mode
 */
import { ApiError } from '@/types/api';
import { getAccessToken } from '@/utils/auth-storage';
import { env } from '@/utils/env';

export interface HttpRequestOptions {
  params?: Record<string, string | number | boolean | null | undefined>;
  timeoutMs?: number;
  signal?: AbortSignal;
  /** Attach the bearer token. Defaults to true. */
  authenticated?: boolean;
}

type HttpBody =
  | Record<string, unknown>
  | unknown[]
  | string
  | FormData
  | undefined;

export interface RefreshHandler {
  (): Promise<boolean>;
}

export interface UnauthorizedHandler {
  (): void;
}

let refreshHandler: RefreshHandler | null = null;
let unauthorizedHandler: UnauthorizedHandler | null = null;
let refreshInFlight: Promise<boolean> | null = null;

/** Registered by AuthProvider so the client can trigger auth flows. */
export function registerAuthHandlers(handlers: {
  onRefresh?: RefreshHandler | null;
  onUnauthorized?: UnauthorizedHandler | null;
}): void {
  refreshHandler = handlers.onRefresh ?? null;
  unauthorizedHandler = handlers.onUnauthorized ?? null;
}

async function attemptRefresh(): Promise<boolean> {
  if (!refreshHandler) return false;
  if (!refreshInFlight) {
    refreshInFlight = refreshHandler().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

const DEFAULT_TIMEOUT_MS = 15000;

function resolveUrl(
  endpoint: string,
  params?: HttpRequestOptions['params']
): string {
  const base = /^https?:\/\//.test(endpoint)
    ? endpoint
    : `${env.apiGatewayUrl}${endpoint}`;
  if (!params) return base;
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      search.append(key, String(value));
    }
  });
  const query = search.toString();
  return query
    ? `${base}${base.includes('?') ? '&' : '?'}${query}`
    : base;
}

function buildHeaders(authenticated: boolean): Headers {
  const headers = new Headers({ Accept: 'application/json' });
  if (authenticated) {
    const token = getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

async function toError(response: Response): Promise<ApiError> {
  let message = `Request failed (${response.status})`;
  let code: string | undefined;
  try {
    const body = (await response.json()) as {
      message?: string;
      error?: { message?: string; code?: string | number };
    };
    message = body.message ?? body.error?.message ?? message;
    if (typeof body.error?.code === 'string') code = body.error.code;
  } catch {
    // non-JSON error body, keep default message
  }
  return new ApiError(response.status, message, code);
}

async function doFetch<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  body: HttpBody,
  options: HttpRequestOptions,
  allowAuthRetry: boolean
): Promise<T> {
  const { signal, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const controller = new AbortController();
  const onExternalAbort = () => controller.abort(signal?.reason);
  if (signal?.aborted) {
    controller.abort(signal.reason);
  } else {
    signal?.addEventListener('abort', onExternalAbort, { once: true });
  }
  const timer =
    timeoutMs > 0
      ? window.setTimeout(() => {
          controller.abort(
            new DOMException('Request timed out', 'TimeoutError')
          );
        }, timeoutMs)
      : 0;

  const cleanup = () => {
    signal?.removeEventListener('abort', onExternalAbort);
    if (timer) window.clearTimeout(timer);
  };

  try {
    const isForm = body instanceof FormData;
    const headers = buildHeaders(options.authenticated ?? true);
    if (!isForm && body !== undefined) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(resolveUrl(endpoint, options.params), {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : isForm
            ? body
            : typeof body === 'string'
              ? body
              : JSON.stringify(body),
      signal: controller.signal,
    });

    if (response.ok) {
      if (response.status === 204) return undefined as T;
      const type = response.headers.get('content-type') ?? '';
      return (type.includes('application/json')
        ? await response.json()
        : await response.text()) as T;
    }

    if (
      response.status === 401 &&
      allowAuthRetry &&
      (options.authenticated ?? true)
    ) {
      cleanup();
      const refreshed = await attemptRefresh();
      if (refreshed) {
        return doFetch<T>(method, endpoint, body, options, false);
      }
      unauthorizedHandler?.();
    }

    throw await toError(response);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const isAbort =
      error instanceof DOMException && error.name === 'AbortError';
    throw new ApiError(
      0,
      isAbort
        ? 'Request timed out'
        : 'Network error: API Gateway unavailable',
      isAbort ? 'TIMEOUT' : 'NETWORK'
    );
  } finally {
    cleanup();
  }
}

export const http = {
  get<T>(
    endpoint: string,
    options: HttpRequestOptions = {}
  ): Promise<T> {
    return doFetch<T>('GET', endpoint, undefined, options, true);
  },
  post<T>(
    endpoint: string,
    body: HttpBody = {},
    options: HttpRequestOptions = {}
  ): Promise<T> {
    return doFetch<T>('POST', endpoint, body, options, true);
  },
  put<T>(
    endpoint: string,
    body: HttpBody = {},
    options: HttpRequestOptions = {}
  ): Promise<T> {
    return doFetch<T>('PUT', endpoint, body, options, true);
  },
  patch<T>(
    endpoint: string,
    body: HttpBody = {},
    options: HttpRequestOptions = {}
  ): Promise<T> {
    return doFetch<T>('PATCH', endpoint, body, options, true);
  },
  delete<T>(
    endpoint: string,
    options: HttpRequestOptions = {}
  ): Promise<T> {
    return doFetch<T>('DELETE', endpoint, undefined, options, true);
  },
};

/** Guards boundary-only real service calls that have no configured gateway. */
export function assertGatewayConfigured(): void {
  if (!env.apiGatewayUrl) {
    throw new ApiError(
      503,
      'Ariiti API Gateway is not configured. Set VITE_API_GATEWAY_URL in your .env file.'
    );
  }
}