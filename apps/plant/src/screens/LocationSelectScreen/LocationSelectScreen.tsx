import {
  FieldAlertBanner,
  PlantLocationCard,
  PlantLocationSelectFooter,
  PlantLocationSelectHeader,
} from '@restopsiq/ui';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import { selectActiveLocation } from '@/services/location.service';
import type { AssignedLocation } from '@/stores/session.store';
import { useSessionStore } from '@/stores/session.store';
import styles from './LocationSelectScreen.module.scss';

export interface LocationSelectScreenProps {
  locations: AssignedLocation[];
  operatorName?: string;
  operatorRole?: string;
  mode?: 'initial' | 'change';
  onSelected?: () => void;
  onCancel?: () => void;
}

export function LocationSelectScreen({
  locations,
  operatorName,
  operatorRole,
  mode = 'initial',
  onSelected,
  onCancel,
}: LocationSelectScreenProps): React.JSX.Element {
  const sessionOperator = useSessionStore((s) => s.operator);
  const setActiveLocation = useSessionStore((s) => s.setActiveLocation);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    mode === 'change' ? (sessionOperator?.locationId ?? null) : null,
  );

  const resolvedOperatorName = operatorName ?? sessionOperator?.operatorName ?? 'Operador';
  const resolvedOperatorRole = operatorRole ?? sessionOperator?.role ?? 'OPERATOR';

  const selectMutation = useMutation({
    mutationFn: selectActiveLocation,
    onSuccess: (response, locationId) => {
      setActiveLocation(locationId, {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });
      onSelected?.();
    },
  });

  const locationCountLabel = useMemo(() => {
    const count = locations.length;
    return count === 1 ? 'Tienes acceso a 1 sede' : `Tienes acceso a ${count} sedes`;
  }, [locations.length]);

  const handleContinue = useCallback(() => {
    if (!selectedLocationId || selectMutation.isPending) return;
    selectMutation.mutate(selectedLocationId);
  }, [selectMutation, selectedLocationId]);

  return (
    <div className={styles.screen} data-testid="location-select-screen">
      <div className={styles.glow} aria-hidden />

      <PlantLocationSelectHeader
        operatorName={resolvedOperatorName}
        operatorRole={resolvedOperatorRole}
        className={styles.header}
      />

      <section className={styles.intro}>
        <p className={styles.eyebrow}>Seleccionar sede de trabajo</p>
        <h1 className={styles.title}>¿En cuál sede vas a trabajar hoy?</h1>
        <p className={styles.subtitle}>
          {locationCountLabel} · Selecciona la sede activa para esta sesión
        </p>
      </section>

      <section className={styles.cardsSection}>
        {selectMutation.isError ? (
          <FieldAlertBanner variant="danger" theme="dark">
            No pudimos activar la sede seleccionada. Intente nuevamente.
          </FieldAlertBanner>
        ) : null}

        <div className={styles.cardsGrid}>
          {locations.map((location) => (
            <PlantLocationCard
              key={location.id}
              location={location}
              selected={selectedLocationId === location.id}
              disabled={selectMutation.isPending}
              onSelect={setSelectedLocationId}
            />
          ))}
        </div>
      </section>

      <PlantLocationSelectFooter
        className={styles.footer}
        canContinue={Boolean(selectedLocationId)}
        isSubmitting={selectMutation.isPending}
        onContinue={handleContinue}
        onCancel={onCancel}
      />
    </div>
  );
}

export default LocationSelectScreen;
