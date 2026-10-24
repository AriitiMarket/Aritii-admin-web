/**
 * Generic API contracts used across the Aritii API Gateway client.
 *
 * NOTE (Phase 6): these envelope/pagination types are expected to be
 * provided by `aritii-shared-types`. They are duplicated here only as a
 * local boundary until that package is integrated.
 */

/** Standard Aritii API Gateway envelope. */
export interface ApiEnvelope<T> {
  data: T;
  message?: string;
  status: string;
  error?: {
    code: string | number;
    message: string;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  statusCounts?: Record<string, number>;
}

/** Normalised HTTP error surfaced by the API client. */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly code?: string;
  /**
   * Field-level problems from the service envelope
   * (`{ success, code, message, errors }`), e.g. validation messages keyed by
   * field. Present only when the service sent them.
   */
  readonly errors?: unknown;

  constructor(statusCode: number, message: string, code?: string, errors?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
  }
}

export const isApiError = (error: unknown): error is ApiError => {
  return error instanceof ApiError;
};