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
  // Only fetch if user is authenticated
  const hasToken = typeof window !== 'undefined'
    ? Boolean(window.localStorage.getItem('token'))
    : false;

  const { data, loading, error, refetch } = useAsync(
    () => (hasToken ? settingsService.getPlatform() : Promise.resolve(null)),
    [hasToken]
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