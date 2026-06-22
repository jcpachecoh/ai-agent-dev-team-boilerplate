import type { ReactNode } from 'react';

import { useLogout } from '../hooks/useLogout';
import { useLocationSession } from '../context/LocationSessionContext';
import { LocationSelectView } from './LocationSelectView';
import { NoLocationView } from './NoLocationView';

export function LocationSessionGate({ children }: { children: ReactNode }): React.JSX.Element {
  const handleLogout = useLogout();
  const {
    assignedLocations,
    requiresLocationSelection,
    isLoading,
    isPickerOpen,
    canOperate,
    closeLocationPicker,
  } = useLocationSession();

  if (isLoading) {
    return <div role="status">Cargando sedes asignadas…</div>;
  }

  if (assignedLocations.length === 0) {
    return <NoLocationView />;
  }

  const needsInitialSelection = requiresLocationSelection || !canOperate;

  if (needsInitialSelection || isPickerOpen) {
    return (
      <LocationSelectView
        mode={isPickerOpen ? 'change' : 'initial'}
        onCancel={
          isPickerOpen
            ? closeLocationPicker
            : () => {
                handleLogout();
              }
        }
      />
    );
  }

  return <>{children}</>;
}
