import { AppProviders } from '@/app/providers/AppProviders';
import { AppRoutes } from '@/routes/AppRoutes';

/**
 * Ariiti Admin Web — root application component.
 * Routing lives in @/routes/AppRoutes; cross-cutting concerns are wired by
 * @/app/providers/AppProviders.
 */
export default function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
}