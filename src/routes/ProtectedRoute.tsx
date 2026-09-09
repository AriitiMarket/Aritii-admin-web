import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { PageLoader } from '@/components/common/PageLoader';
import { getAccessToken } from '@/utils/auth-storage';

/**
 * Guards private routes: shows the loader while the session bootstraps and
 * redirects to /login when no valid session exists.
 */
export function ProtectedRoute({ children }: { children: ReactElement }) {
  const { loading } = useAuth();
  const location = useLocation();
  const hasSessionToken = Boolean(getAccessToken());

  if (loading) {
    return <PageLoader />;
  }

  if (!hasSessionToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}