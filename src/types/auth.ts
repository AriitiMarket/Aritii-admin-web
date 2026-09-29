/**
 * Authentication & authorization domain types.
 *
 * NOTE (Phase 6): expected to be aligned with `aritii-shared-types`.
 */

/** Aritii admin roles used for route/UI authorization (frontend only — the backend stays the source of truth). */
export type AdminRole =
  | 'SUPER_ADMIN'
  | 'RIDER_ADMIN'
  | 'SELLER_ADMIN'
  | 'CUSTOMER_ADMIN';

/** Legacy user-type codes emitted by the current identity/mock backend. */
export type LegacyUserType = 'ADMIN' | 'STAFF' | 'VENDOR' | 'RESTAURANT';

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string | number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AdminUser {
  userId: string;
  email: string;
  name?: string;
  image?: string;
  role: AdminRole;
  /** Legacy user type retained for backward compatibility with existing REST sessions. */
  userType: LegacyUserType;
  permissions: string[];
  sectors: string[];
  isActive?: boolean;
  userTypeId?: string;
  shopType?: string;
}

export interface LoginResult {
  tokens: AuthTokens;
  user: AdminUser;
}