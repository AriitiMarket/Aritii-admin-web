/**
 * Session storage helpers.
 * Migrated from legacy/lib/utils/methods/auth.ts — keys are kept compatible
 * so existing sessions/tokens remain usable during the transition.
 */
import type { AdminUser, AuthTokens, LegacyUserType } from '@/types/auth';
import { env } from '@/utils/env';

const AUTH_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  USER_TYPE: 'userType',
  USER_ID: 'userId',
  TOKEN_EXPIRATION: 'tokenExpiration',
} as const;

export const SESSION_USER_KEY = `user-${env.appName}`;

export function setAuthTokens(payload: Partial<AuthTokens> & {
  userType?: LegacyUserType;
  userId?: string;
}): void {
  if (typeof window === 'undefined') return;
  if (payload.accessToken) localStorage.setItem(AUTH_KEYS.TOKEN, payload.accessToken);
  if (payload.refreshToken) localStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, payload.refreshToken);
  if (payload.userId) localStorage.setItem(AUTH_KEYS.USER_ID, payload.userId);
  if (payload.userType) localStorage.setItem(AUTH_KEYS.USER_TYPE, payload.userType);
  if (payload.expiresAt) localStorage.setItem(AUTH_KEYS.TOKEN_EXPIRATION, String(payload.expiresAt));
}

export function getAccessToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(AUTH_KEYS.TOKEN) ?? '';
}

export function getRefreshToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(AUTH_KEYS.REFRESH_TOKEN) ?? '';
}

export function getUserType(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(AUTH_KEYS.USER_TYPE) ?? '';
}

export function clearAuthTokens(): void {
  if (typeof window === 'undefined') return;
  Object.values(AUTH_KEYS).forEach((key) => localStorage.removeItem(key));
}

export function getStoredUser(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(SESSION_USER_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as AdminUser;
  } catch {
    localStorage.removeItem(SESSION_USER_KEY);
    return null;
  }
}

export function setStoredUser(user: AdminUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
}

export function persistUserSession(user: AdminUser, tokens?: AuthTokens): void {
  if (typeof window === 'undefined') return;
  setStoredUser(user);
  if (tokens) {
    setAuthTokens({
      userId: user.userId,
      userType: user.userType,
      ...tokens,
    });
  } else {
    setAuthTokens({ userId: user.userId, userType: user.userType });
  }
}

export function clearStoredSessionState(): void {
  if (typeof window === 'undefined') return;
  clearAuthTokens();
  localStorage.removeItem(SESSION_USER_KEY);
  localStorage.removeItem('selectedSector');
  localStorage.removeItem('messaging-token');
}