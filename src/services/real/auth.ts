/**
 * Real identity service — OAuth 2.1 Authorization Code Flow + PKCE (S256).
 *
 * Flow:
 *   1. generate code_verifier / code_challenge (S256)
 *   2. POST /auth/authorize with credentials + challenge -> one-time code
 *   3. POST /auth/token (grant_type=authorization_code, code + verifier) -> tokens
 *   4. GET /user/getuser for the admin profile
 * Tokens are only ever issued by the token endpoint; refresh rotates them.
 * No cookies are involved at any point.
 */
import { assertGatewayConfigured, http } from '@/services/client/httpClient';
import { createPkcePair } from '@/utils/pkce';
import { ADMIN_ROLES } from '@/utils/auth-roles';
import {
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  clearAuthTokens,
  clearStoredSessionState,
} from '@/utils/auth-storage';
import type {
  AdminRole,
  AdminUser,
  AuthTokens,
  LoginCredentials,
  LoginResult,
} from '@/types';

const CLIENT_ID = 'aritii-admin-web';

interface BackendUser {
  id: string;
  email: string;
  name?: string;
  phoneNumber?: string;
  role?: unknown;
  avatar?: { public_id?: string | null; url?: string | null };
  status?: string;
  /** Data scope (which locations/services this admin may act on). Identity-owned. */
  adminScope?: Record<string, unknown>;
  /**
   * Effective admin roles resolved by the Identity Service from the RBAC tables
   * (SUPER_ADMIN / SELLER_ADMIN / RIDER_ADMIN / CUSTOMER_ADMIN). Identity-owned.
   */
  adminRoles?: unknown;
  /** Effective permission keys resolved by the Identity Service. Identity-owned. */
  permissions?: string[];
}

export class UnsupportedAdminRoleError extends Error {
  constructor() {
    super('Unsupported administrator role');
    this.name = 'UnsupportedAdminRoleError';
  }
}

interface BackendCodeResponse {
  success: boolean;
  message?: string;
  code: string;
  state?: string | null;
  expires_in: number;
}

interface BackendTokenResponse {
  success: boolean;
  message?: string;
  access_token: string;
  id_token?: string;
  refresh_token: string;
  token_type?: string;
  expires_in: number;
}

interface BackendMeResponse {
  success: boolean;
  message?: string;
  user: BackendUser;
}

const ROLE_MAP: Record<string, AdminRole> = {
  ADMIN: 'SUPER_ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  STAFF: 'SUPER_ADMIN',
  OPERATIONS_ADMIN: 'OPERATIONS_ADMIN',
  OPERATIONAL_ADMIN: 'OPERATIONS_ADMIN',
  OPS_ADMIN: 'OPERATIONS_ADMIN',
  OPSADMIN: 'OPERATIONS_ADMIN',
  OS_ADMIN: 'OPERATIONS_ADMIN',
  OSADMIN: 'OPERATIONS_ADMIN',
  OPERATIONS: 'OPERATIONS_ADMIN',
  // Legacy roles → map to OPERATIONS_ADMIN
  SELLER: 'OPERATIONS_ADMIN',
  SELLER_ADMIN: 'OPERATIONS_ADMIN',
  RIDER: 'OPERATIONS_ADMIN',
  RIDER_ADMIN: 'OPERATIONS_ADMIN',
  BUYER: 'OPERATIONS_ADMIN',
  CUSTOMER: 'OPERATIONS_ADMIN',
  CUSTOMER_ADMIN: 'OPERATIONS_ADMIN',
};

/**
 * The Identity Service is the single source of truth for who an admin is.
 *
 * `adminRoles` (RBAC) and `permissions` both come from `/user/getuser`, which
 * resolves them from the RBAC tables. The `role`→AdminRole map below is only a
 * FALLBACK for accounts that have no explicit RBAC assignment — the coarse
 * `users.role` value ('ADMIN') cannot express the four console roles on its own.
 *
 * `adminScope` describes *which data* an admin may act on; it is NOT a
 * permission list and must never be used as one.
 */
const toAdminUser = (raw: BackendUser): AdminUser => {
  if (typeof raw !== 'object' || raw === null) {
    throw new UnsupportedAdminRoleError();
  }
  const role = resolveAdminRole(raw);
  return {
    userId: raw.id,
    email: raw.email,
    name: raw.name,
    image: raw.avatar?.url ?? undefined,
    role,
    userType: role.includes('SELLER')
      ? 'VENDOR'
      : role.includes('RIDER')
        ? 'RESTAURANT'
        : 'ADMIN',
    // Identity already returns the wildcard for an unrestricted admin, so an
    // absent or empty list falls back to the role's default permissions.
    permissions: Array.isArray(raw.permissions) &&
      raw.permissions.length > 0 &&
      raw.permissions.every((permission): permission is string => typeof permission === 'string')
      ? raw.permissions
      : (role === 'SUPER_ADMIN' ? ['*'] : [
          'dashboard.view',
          'users.view',
          'businesses.view',
          'shops.view',
          'locations.view',
          'orders.view',
          'orders.manage',
          'delivery.view',
          'delivery.manage',
          'disputes.view',
          'disputes.manage',
          'reports.view',
          'audit.view',
        ]),
    sectors: [],
    isActive: raw.status === 'active',
  };
};

/** Prefers the RBAC role from Identity; falls back to mapping the coarse role. */
function resolveAdminRole(raw: BackendUser): AdminRole {
  if (raw.adminRoles !== undefined && !Array.isArray(raw.adminRoles)) {
    throw new UnsupportedAdminRoleError();
  }

  // 1. Check explicit RBAC adminRoles
  if (Array.isArray(raw.adminRoles)) {
    for (const r of raw.adminRoles) {
      if (typeof r === 'string') {
        const normalized = r.toUpperCase().trim();
        if (ADMIN_ROLES.includes(normalized as AdminRole)) {
          return normalized as AdminRole;
        }
        if (ROLE_MAP[normalized]) {
          return ROLE_MAP[normalized];
        }
      }
    }
  }

  // 2. Check coarse role
  if (typeof raw.role === 'string') {
    const normalized = raw.role.toUpperCase().trim();
    if (ADMIN_ROLES.includes(normalized as AdminRole)) {
      return normalized as AdminRole;
    }
    const mappedRole = ROLE_MAP[normalized];
    if (mappedRole) {
      return mappedRole;
    }
  }

  throw new UnsupportedAdminRoleError();
}

function toAuthTokens(res: BackendTokenResponse): AuthTokens {
  return {
    accessToken: res.access_token,
    refreshToken: res.refresh_token,
    expiresAt: String(res.expires_in),
  };
}

/** Authorization step: exchange credentials for a one-time, PKCE-bound code. */
async function requestAuthorizationCode(credentials: LoginCredentials): Promise<{
  code: string;
  codeVerifier: string;
}> {
  const pkce = await createPkcePair();
  const res = await http.post<BackendCodeResponse & { requires2fa?: boolean; method?: string; tempToken?: string }>(
    '/auth/authorize',
    {
      email: credentials.email,
      password: credentials.password,
      code_challenge: pkce.codeChallenge,
      code_challenge_method: pkce.codeChallengeMethod,
      client_id: CLIENT_ID,
      state: pkce.state,
    },
    { authenticated: false }
  );
  if (res.requires2fa) {
    const err = new Error('2FA verification required');
    (err as any).method = res.method;
    (err as any).tempToken = res.tempToken;
    throw err;
  }
  if (!res.code) throw new Error('Authorization code was not issued');
  return { code: res.code, codeVerifier: pkce.codeVerifier };
}

/** Token step: redeem the code (single use) for the token pair. */
async function redeemAuthorizationCode(
  code: string,
  codeVerifier: string
): Promise<AuthTokens> {
  const res = await http.post<BackendTokenResponse>(
    '/auth/token',
    {
      grant_type: 'authorization_code',
      code,
      code_verifier: codeVerifier,
      client_id: CLIENT_ID,
    },
    { authenticated: false }
  );
  const tokens = toAuthTokens(res);
  // Persist first so the profile request below is authorized.
  setAuthTokens(tokens);
  return tokens;
}

export async function realLogin(credentials: LoginCredentials): Promise<LoginResult> {
  assertGatewayConfigured();
  const { code, codeVerifier } = await requestAuthorizationCode(credentials);
  const tokens = await redeemAuthorizationCode(code, codeVerifier);
  const user = await realGetCurrentAdmin();
  return { tokens, user };
}

export async function realGetCurrentAdmin(): Promise<AdminUser> {
  assertGatewayConfigured();
  const token = getAccessToken();
  if (!token) throw new Error('No access token available');
  const res = await http.get<BackendMeResponse>('/user/getuser');
  try {
    return toAdminUser(res.user);
  } catch (error) {
    clearStoredSessionState();
    throw error;
  }
}

export async function realRefreshSession(): Promise<boolean> {
  assertGatewayConfigured();
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await http.post<BackendTokenResponse>(
      '/auth/token',
      { grant_type: 'refresh_token', refresh_token: refreshToken, client_id: CLIENT_ID },
      { authenticated: false }
    );
    // Rotation: the response carries a NEW refresh token.
    setAuthTokens(toAuthTokens(res));
    return true;
  } catch {
    return false;
  }
}

/** Revokes the refresh token server-side (RFC 7009) and clears local state. */
export async function realLogout(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) {
      await http.post('/auth/revoke', { token: refreshToken }, { authenticated: false });
    }
  } catch {
    /* revocation is best-effort — local session is cleared regardless */
  } finally {
    clearAuthTokens();
  }
}

export async function realForgotPassword(email: string): Promise<{ success: boolean; message: string }> {
  assertGatewayConfigured();
  return http.post<{ success: boolean; message: string }>(
    '/auth/forgot-password',
    { email, clientType: 'admin' },
    { authenticated: false }
  );
}

export async function realVerifyResetToken(token: string): Promise<{ valid: boolean; email?: string; message?: string }> {
  assertGatewayConfigured();
  return http.get<{ valid: boolean; email?: string; message?: string }>(
    `/auth/verify-reset-token?token=${encodeURIComponent(token)}`,
    { authenticated: false }
  );
}

export async function realResetPassword(
  token: string,
  newPassword: string,
  confirmPassword: string
): Promise<{ success: boolean; message: string }> {
  assertGatewayConfigured();
  return http.post<{ success: boolean; message: string }>(
    '/auth/reset-password',
    { token, newPassword, confirmPassword },
    { authenticated: false }
  );
}
