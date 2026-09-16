/**
 * Auth service facade — real API Gateway implementation.
 */
import type { AdminUser, LoginCredentials, LoginResult } from '@/types';
import {
  realGetCurrentAdmin,
  realLogin,
  realLogout,
  realRefreshSession,
} from './real/auth';
import { registerAuthHandlers } from './client/httpClient';
import type { UnauthorizedHandler } from './client/httpClient';

export const authService = {
  login(credentials: LoginCredentials): Promise<LoginResult> {
    return realLogin(credentials);
  },
  getCurrentAdmin(): Promise<AdminUser> {
    return realGetCurrentAdmin();
  },
  refreshSession(): Promise<boolean> {
    return realRefreshSession();
  },
  /** Revokes the server-side session (RFC 7009) and clears local tokens. */
  logout(): Promise<void> {
    return realLogout();
  },
  /** Wires the 401 refresh/unauthorized flow used by the shared HTTP client. */
  configureAuthHandlers(handlers: {
    onRefresh?: () => Promise<boolean>;
    onUnauthorized?: UnauthorizedHandler;
  }): void {
    registerAuthHandlers(handlers);
  },
};
