import { LoadingState } from '@restopsiq/ui';
import { Navigate, Outlet } from 'react-router-dom';

import { AppModule, canAccessModule, canAccessPath } from '@/config/rbac.config';
import { useMe } from '@/features/auth/hooks/useMe';
import { getRoleCodeFromToken } from '@/lib/auth-token';

function resolveRoleCode(meRoleCode: string | undefined): string | undefined {
  return meRoleCode ?? getRoleCodeFromToken();
}

interface ProtectedRouteProps {
  module: AppModule;
  children?: React.ReactNode;
}

export function ProtectedRoute({ module, children }: ProtectedRouteProps): React.JSX.Element {
  const { data: me, isLoading, isFetching } = useMe();
  const roleCode = resolveRoleCode(me?.roleCode);
  const waitingForProfile = (isLoading || isFetching) && !roleCode;

  if (waitingForProfile) {
    return <LoadingState message="Cargando permisos…" layout="compact" />;
  }

  if (!canAccessModule(roleCode, module)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

interface ModulePathRouteProps {
  children: React.ReactNode;
}

/** Guards a route by resolving the module from the current pathname. */
export function ModulePathRoute({ children }: ModulePathRouteProps): React.JSX.Element {
  const { data: me, isLoading, isFetching } = useMe();
  const roleCode = resolveRoleCode(me?.roleCode);
  const pathname = window.location.pathname;
  const waitingForProfile = (isLoading || isFetching) && !roleCode;

  if (waitingForProfile) {
    return <LoadingState message="Cargando permisos…" layout="compact" />;
  }

  if (!canAccessPath(roleCode, pathname)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
