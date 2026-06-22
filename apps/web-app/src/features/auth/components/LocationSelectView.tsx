import { FieldAlertBanner, PlantLocationCard, PlantLocationSelectFooter } from '@restopsiq/ui';
import { useCallback, useMemo, useState } from 'react';

import { useUiTheme } from '@/hooks/useUiTheme';

import { useLocationSession } from '../context/LocationSessionContext';
import type { AssignedLocationSummary } from '../types';
import styles from './LocationSelectView.module.scss';

export interface LocationSelectViewProps {
  locations?: AssignedLocationSummary[];
  mode?: 'initial' | 'change';
  onCancel?: () => void;
}

export function LocationSelectView({
  locations: locationsProp,
  mode = 'initial',
  onCancel,
}: LocationSelectViewProps): React.JSX.Element {
  const theme = useUiTheme();
  const { assignedLocations, locationId, isSelecting, selectLocation, closeLocationPicker } =
    useLocationSession();
  const locations = locationsProp ?? assignedLocations;
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    mode === 'change' ? locationId : null,
  );
  const [error, setError] = useState<string | null>(null);

  const locationCountLabel = useMemo(() => {
    const count = locations.length;
    return count === 1 ? 'Tienes acceso a 1 sede' : `Tienes acceso a ${count} sedes`;
  }, [locations.length]);

  const handleContinue = useCallback(async () => {
    if (!selectedLocationId || isSelecting) return;
    setError(null);
    try {
      await selectLocation(selectedLocationId);
      if (mode === 'change') {
        closeLocationPicker();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos activar la sede seleccionada.');
    }
  }, [closeLocationPicker, isSelecting, mode, selectLocation, selectedLocationId]);

  return (
    <div className={styles.screen} data-testid="location-select-screen">
      <section className={styles.intro}>
        <p className={styles.eyebrow}>Seleccionar sede de trabajo</p>
        <h1 className={styles.title}>¿En cuál sede vas a trabajar hoy?</h1>
        <p className={styles.subtitle}>
          {locationCountLabel} · Selecciona la sede activa para esta sesión
        </p>
      </section>

      <section className={styles.cardsSection}>
        {error ? (
          <FieldAlertBanner variant="danger" theme={theme}>
            {error}
          </FieldAlertBanner>
        ) : null}

        <div className={styles.cardsGrid}>
          {locations.map((location) => (
            <PlantLocationCard
              key={location.id}
              location={location}
              theme={theme}
              selected={selectedLocationId === location.id}
              disabled={isSelecting}
              onSelect={setSelectedLocationId}
            />
          ))}
        </div>
      </section>

      <PlantLocationSelectFooter
        className={styles.footer}
        theme={theme}
        canContinue={Boolean(selectedLocationId)}
        isSubmitting={isSelecting}
        onContinue={() => void handleContinue()}
        onCancel={onCancel}
      />
    </div>
  );
}
