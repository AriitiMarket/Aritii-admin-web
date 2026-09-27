/** Platform configuration context (currency, delivery rate, ...). */
import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import type { PlatformSettings } from '@/types';
import { settingsService } from '@/services/settings.service';
import { useAsync } from '@/hooks/useAsync';
import { useAuthContext } from '@/context/AuthContext';

interface ConfigurationContextValue {
  configuration: PlatformSettings | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const ConfigurationContext = createContext<ConfigurationContextValue | undefined>(
  undefined
);

export function ConfigurationProvider({ children }: { children: ReactNode }) {
  // Subscribe to auth instead of reading localStorage once per render: the
  // one-shot read never flipped after login, so settings were never fetched
  // until a full page reload.
  //
  // Wait for the auth bootstrap too — child effects run before the parent's,
  // so on the very first mount AuthProvider has not registered its
  // 401 -> refresh -> retry handlers yet. Firing here would spend the stale
  // access token on a 401 that nobody can recover from.
  const { isAuthenticated, loading: authLoading } = useAuthContext();

  const ready = isAuthenticated && !authLoading;
  const { data, loading, error, refetch } = useAsync(
    () => (ready ? settingsService.getPlatform() : Promise.resolve(null)),
    [ready]
  );

  const value = useMemo<ConfigurationContextValue>(
    () => ({
      configuration: data,
      loading,
      error,
      refresh: refetch,
    }),
    [data, loading, error, refetch]
  );

  return (
    <ConfigurationContext.Provider value={value}>
      {children}
    </ConfigurationContext.Provider>
  );
}

export function useConfigurationContext(): ConfigurationContextValue {
  const context = useContext(ConfigurationContext);
  if (!context) {
    throw new Error(
      'useConfigurationContext must be used within a ConfigurationProvider'
    );
  }
  return context;
}