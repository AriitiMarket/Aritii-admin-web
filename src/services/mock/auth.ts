/** Mock-mode auth implementation — talks to the bundled REST mock backend. */
import { http } from '@/services/client/httpClient';
import type {
  AdminUser,
  AuthTokens,
  LoginCredentials,
  LoginResult,
} from '@/types/auth';
import { mapUserTypeToRole } from '@/utils/auth-roles';
import type { MockSession } from './types';

interface MockSessionEnvelope {
  data: MockSession;
  message?: string;
  status?: string;
}

export const toAdminUser = (session: MockSession): AdminUser => ({
  userId: session.userId,
  email: session.email,
  name: session.name,
  image: session.image,
  role: mapUserTypeToRole(session.userType),
  userType: session.userType,
  permissions: session.permissions ?? [],
  sectors: [],
  isActive: session.isActive,
  userTypeId: session.userTypeId,
  shopType: session.shopType,
});

export async function mockLogin(
  credentials: LoginCredentials
): Promise<LoginResult> {
  const response = await http.post<MockSessionEnvelope>(
    '/auth/login',
    { email: credentials.email, password: credentials.password, type: 'email' },
    { authenticated: false }
  );
  const session = response.data;
  const tokens: AuthTokens = {
    accessToken: session.token,
    refreshToken: session.refreshToken,
    expiresAt: session.tokenExpiration,
  };
  return { tokens, user: toAdminUser(session) };
}

export async function mockGetCurrentAdmin(): Promise<AdminUser> {
  const response = await http.get<MockSessionEnvelope>('/admin/profile');
  return toAdminUser(response.data);
}

/** Mock tokens never expire — refresh is a no-op success. */
export async function mockRefreshSession(): Promise<boolean> {
  return true;
}