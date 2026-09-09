/**
 * Real identity service — Ariiti API Gateway contract.
 * @boundary: the gateway endpoint below is the documented integration
 * contract and is pending backend implementation.
 */
import { assertGatewayConfigured, http } from '@/services/client/httpClient';
import type {
  AdminRole,
  AdminUser,
  AuthTokens,
  LoginCredentials,
  LoginResult,
} from '@/types';

interface RealUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: AdminRole;
  userType: 'ADMIN' | 'STAFF' | 'VENDOR' | 'RESTAURANT';
  permissions?: string[];
  sectors?: string[];
  isActive?: boolean;
}

interface RealLoginResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    tokenExpiration?: string;
    user: RealUser;
  };
}

interface RealMeResponse {
  data: RealUser;
}

const toAdminUser = (raw: RealUser): AdminUser => ({
  userId: raw.id,
  email: raw.email,
  name: raw.name,
  image: raw.image,
  role: raw.role,
  userType: raw.userType,
  permissions: raw.permissions ?? [],
  sectors: raw.sectors ?? [],
  isActive: raw.isActive,
});

export async function realLogin(
  credentials: LoginCredentials
): Promise<LoginResult> {
  assertGatewayConfigured();
  const response = await http.post<RealLoginResponse>('/identity/auth/login', {
    email: credentials.email,
    password: credentials.password,
  });
  const tokens: AuthTokens = {
    accessToken: response.data.accessToken,
    refreshToken: response.data.refreshToken,
    expiresAt: response.data.tokenExpiration,
  };
  return { tokens, user: toAdminUser(response.data.user) };
}

export async function realGetCurrentAdmin(): Promise<AdminUser> {
  assertGatewayConfigured();
  const response = await http.get<RealMeResponse>('/identity/auth/me');
  return toAdminUser(response.data);
}

export async function realRefreshSession(): Promise<boolean> {
  assertGatewayConfigured();
  try {
    await http.post<{ data: { accessToken: string } }>(
      '/identity/auth/refresh',
      {},
      { authenticated: false }
    );
    return true;
  } catch {
    return false;
  }
}