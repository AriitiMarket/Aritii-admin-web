/**
 * Auth context — session state, login, logout, refresh and auth handler wiring.
 * Frontend authorization is UI/route control only; the backend stays the
 * source of truth.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authService } from '@/services/auth.service';
import type { AdminUser, LoginCredentials } from '@/types';
import {
  clearStoredSessionState,
  getAccessToken,
  getStoredUser,
  getRefreshToken,
  persistUserSession,
} from '@/utils/auth-storage';

interface AuthContextValue {
  user: AdminUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<AdminUser>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AdminUser | null>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const isAuthFailure = (error: unknown): boolean => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = String((error as { message: string }).message).toLowerCase();
    return (
      message.includes('unauthenticated') ||
      message.includes('forbidden') ||
      message.includes('token') ||
      message.includes('expired')
    );
  }
  return false;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    clearStoredSessionState();
    setUser(null);
  }, []);

  const refreshSession = useCallback(async (): Promise<AdminUser | null> => {
    const token = getAccessToken() || getRefreshToken();
    if (!token) {
      setUser(null);
      return null;
    }
    try {
      const currentUser = await authService.getCurrentAdmin();
      persistUserSession(currentUser);
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      if (isAuthFailure(error)) {
        await logout();
      }
      return null;
    }
  }, [logout]);

  // Wire the shared HTTP client auth handlers (401 -> refresh -> retry / logout).
  useEffect(() => {
    authService.configureAuthHandlers({
      onRefresh: async () => {
        const refreshed = await authService.refreshSession();
        if (!refreshed) {
          await logout();
        } else {
          await refreshSession();
        }
        return refreshed;
      },
      onUnauthorized: () => {
        void logout().then(() => {
          window.location.assign('/login');
        });
      },
    });
  }, [logout, refreshSession]);

  // Bootstrap session on first mount.
  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      const cachedUser = getStoredUser();
      if (cachedUser) setUser(cachedUser);

      if (!getAccessToken()) {
        if (mounted) setLoading(false);
        return;
      }

      await refreshSession();
      if (mounted) setLoading(false);
    };

    void bootstrap();
    return () => {
      mounted = false;
    };
  }, [refreshSession]);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<AdminUser> => {
      const result = await authService.login(credentials);
      persistUserSession(result.user, {
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        expiresAt: result.tokens.expiresAt,
      });
      setUser(result.user);
      return result.user;
    },
    []
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshSession,
    }),
    [user, loading, login, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}