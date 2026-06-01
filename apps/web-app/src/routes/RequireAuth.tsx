import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { isAuthenticated } from '@/lib/auth-token';

export function RequireAuth(): React.JSX.Element {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
