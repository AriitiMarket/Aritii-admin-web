import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ForbiddenPage } from '@/pages/ForbiddenPage';
import type { AdminRole } from '@/types/auth';

/**
 * Role guard for route-level authorization (UI control only — the backend
 * remains the source of truth). Renders a 403 screen when the signed-in
 * admin's role does not match the allowed roles.
 */
export function RoleRoute({
  roles,
  children,
}: {
  roles: AdminRole[];
  children: ReactElement;
}) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    return <ForbiddenPage />;
  }

  return children;
}