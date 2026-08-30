import { AsistenciaLocationTabs } from '@restopsiq/ui';
import type { AsistenciaLocationTab } from '@restopsiq/ui';
import { useMemo } from 'react';

import { useUiTheme } from '@/hooks/useUiTheme';

import { GENERAL_LOCATION_TAB_ID } from '@/features/auth/constants/location-session.constants';
import { useLocationSession } from '@/features/auth/context/LocationSessionContext';

import styles from './LocationTabsBar.module.scss';

export function LocationTabsBar(): React.JSX.Element | null {
  const theme = useUiTheme();
  const { assignedLocations, activeTabId, isSelecting, showLocationTabs, selectTab } =
    useLocationSession();

  const tabs = useMemo<AsistenciaLocationTab[]>(() => {
    const generalTab: AsistenciaLocationTab = {
      id: GENERAL_LOCATION_TAB_ID,
      name: 'General',
      city: 'Todas las sedes',
    };

    const locationTabs = assignedLocations.map((location) => ({
      id: location.id,
      name: location.name,
      city: location.city?.trim() || location.code?.trim() || 'Sede',
    }));

    return [generalTab, ...locationTabs];
  }, [assignedLocations]);

  if (!showLocationTabs) {
    return null;
  }

  return (
    <div className={styles.bar} data-testid="location-tabs-bar">
      <AsistenciaLocationTabs
        className={styles.tabs}
        tabs={tabs}
        activeId={activeTabId}
        onChange={(tabId) => {
          if (isSelecting) return;
          void selectTab(tabId);
        }}
        theme={theme}
        aria-label="Seleccionar sede o vista general"
      />
    </div>
  );
}
