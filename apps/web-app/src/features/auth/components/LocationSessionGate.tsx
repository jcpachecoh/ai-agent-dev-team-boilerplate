import type { ReactNode } from 'react';
import { LoadingState } from '@restopsiq/ui';
import { Navigate } from 'react-router-dom';

import { AuthApiError } from '../api/auth.api';
import { useLocationSession } from '../context/LocationSessionContext';
import { isAuthenticated } from '@/lib/auth-token';

import { NoLocationView } from './NoLocationView';
import styles from './LocationSessionGate.module.scss';

function isSessionExpiredError(error: Error | null): boolean {
  if (!error) return false;
  if (error instanceof AuthApiError && error.status === 401) return true;
  return /sesión expirada/i.test(error.message);
}

export function LocationSessionGate({ children }: { children: ReactNode }): React.JSX.Element {
  const { assignedLocations, isLoading, locationsError, refetchLocations } = useLocationSession();
  const authenticated = isAuthenticated();

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ sessionExpired: true }} />;
  }

  if (isLoading) {
    return (
      <LoadingState
        message="Cargando sedes asignadas…"
        layout="compact"
        className={styles.loading}
      />
    );
  }

  if (locationsError) {
    if (isSessionExpiredError(locationsError) || !isAuthenticated()) {
      return <Navigate to="/login" replace state={{ sessionExpired: true }} />;
    }

    return (
      <div className={styles.screen} data-testid="location-load-error">
        <div className={styles.panel}>
          <p className={styles.title}>No pudimos cargar tus sedes</p>
          <p className={styles.help}>{locationsError.message}</p>
          <button type="button" className={styles.retryBtn} onClick={() => void refetchLocations()}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (assignedLocations.length === 0) {
    return <NoLocationView />;
  }

  return <>{children}</>;
}
