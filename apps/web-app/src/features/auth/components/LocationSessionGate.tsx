import type { ReactNode } from 'react';

import { useLocationSession } from '../context/LocationSessionContext';
import { NoLocationView } from './NoLocationView';

export function LocationSessionGate({ children }: { children: ReactNode }): React.JSX.Element {
  const { assignedLocations, isLoading } = useLocationSession();

  if (isLoading) {
    return <div role="status">Cargando sedes asignadas…</div>;
  }

  if (assignedLocations.length === 0) {
    return <NoLocationView />;
  }

  return <>{children}</>;
}
