/** Application-level provider composition. */
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ToastProvider } from '@/context/ToastContext';
import { ConfigurationProvider } from '@/context/ConfigurationContext';
import { SectorProvider } from '@/context/SectorContext';
import { HierarchyProvider } from '@/context/HierarchyContext';
import { AuthProvider } from '@/context/AuthContext';
import { ToastViewport } from '@/components/feedback/ToastViewport';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ToastProvider>
          <ConfigurationProvider>
            <SectorProvider>
              <HierarchyProvider>
                <AuthProvider>
                  {children}
                  <ToastViewport />
                </AuthProvider>
              </HierarchyProvider>
            </SectorProvider>
          </ConfigurationProvider>
        </ToastProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}