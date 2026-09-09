/**
 * Auth service facade — selects mock or real (API Gateway) implementation.
 */
import { isMockMode } from '@/utils/env';
import type { AdminUser, LoginCredentials, LoginResult } from '@/types';
import { mockGetCurrentAdmin, mockLogin, mockRefreshSession } from './mock/auth';
import {
  realGetCurrentAdmin,
  realLogin,
  realRefreshSession,
} from './real/auth';
import { registerAuthHandlers } from './client/httpClient';
import type { UnauthorizedHandler } from './client/httpClient';

export const authService = {
  login(credentials: LoginCredentials): Promise<LoginResult> {
    return isMockMode() ? mockLogin(credentials) : realLogin(credentials);
  },
  getCurrentAdmin(): Promise<AdminUser> {
    return isMockMode() ? mockGetCurrentAdmin() : realGetCurrentAdmin();
  },
  refreshSession(): Promise<boolean> {
    return isMockMode() ? mockRefreshSession() : realRefreshSession();
  },
  /** Wires the 401 refresh/unauthorized flow used by the shared HTTP client. */
  configureAuthHandlers(handlers: {
    onRefresh?: () => Promise<boolean>;
    onUnauthorized?: UnauthorizedHandler;
  }): void {
    registerAuthHandlers(handlers);
  },
};