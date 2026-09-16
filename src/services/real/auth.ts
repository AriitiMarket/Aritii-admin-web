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
import {
  getRefreshToken,
  setAuthTokens,
  clearAuthTokens,
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
  role: string;
  avatar?: { public_id?: string | null; url?: string | null };
  status?: string;
  adminScope?: Record<string, unknown>;
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
  SELLER: 'SELLER_ADMIN',
  SELLER_ADMIN: 'SELLER_ADMIN',
  RIDER: 'RIDER_ADMIN',
  RIDER_ADMIN: 'RIDER_ADMIN',
  CUSTOMER: 'CUSTOMER_ADMIN',
  CUSTOMER_ADMIN: 'CUSTOMER_ADMIN',
  STAFF: 'SUPER_ADMIN',
};

const toAdminUser = (raw: BackendUser): AdminUser => {
  const role = ROLE_MAP[raw.role] ?? 'SUPER_ADMIN';
  const scopeKeys = Object.keys(raw.adminScope ?? {});
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
    permissions: scopeKeys.length ? scopeKeys : ['*'],
    sectors: [],
    isActive: raw.status === 'active',
  };
};

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
  const res = await http.post<BackendCodeResponse>(
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
  const res = await http.get<BackendMeResponse>('/user/getuser');
  return toAdminUser(res.user);
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
