/** Application-level provider composition. */
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ToastProvider } from '@/context/ToastContext';
import { ConfigurationProvider } from '@/context/ConfigurationContext';
import { SectorProvider } from '@/context/SectorContext';
import { AuthProvider } from '@/context/AuthContext';
import { ToastViewport } from '@/components/feedback/ToastViewport';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ToastProvider>
          {/* AuthProvider must wrap every provider that talks to the API: it
              registers the shared 401 -> refresh -> retry handlers, and React
              runs child effects before parent effects, so an API-calling
              provider mounted above it would fire its first request with no
              refresh path and surface a 401. */}
          <AuthProvider>
            <ConfigurationProvider>
              <SectorProvider>
                {children}
                <ToastViewport />
              </SectorProvider>
            </ConfigurationProvider>
          </AuthProvider>
        </ToastProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}