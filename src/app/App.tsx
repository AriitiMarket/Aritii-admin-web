import { AppProviders } from '@/app/providers/AppProviders';
import { AppRoutes } from '@/routes/AppRoutes';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

/**
 * Ariiti Admin Web — root application component.
 * Routing lives in @/routes/AppRoutes; cross-cutting concerns are wired by
 * @/app/providers/AppProviders.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </ErrorBoundary>
  );
}
