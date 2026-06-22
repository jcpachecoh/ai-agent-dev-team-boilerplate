import type { JSX } from 'react';
import { useMemo, useState } from 'react';

import { RecetaMetricCard } from '../../receta/receta-metric-card';
import { AsistenciaContextBar } from '../asistencia-context-bar';
import { AsistenciaLocationCard } from '../asistencia-location-card';
import { AsistenciaLocationList, AsistenciaLocationListRow } from '../asistencia-location-list';
import { AsistenciaPage } from '../asistencia-page';
import { AsistenciaPageHeader } from '../asistencia-page-header';
import { AsistenciaSyncButton } from '../asistencia-sync-button';
import { AsistenciaViewToggle } from '../asistencia-view-toggle';
import type {
  AsistenciaLocationSummary,
  AsistenciaTheme,
  AsistenciaViewMode,
} from '../shared/asistencia-types';
import { aggregateLocationMetrics, sortLocationsByActivity } from '../shared/asistencia-utils';
import styles from './AsistenciaLocationHub.module.scss';

export interface AsistenciaLocationHubProps {
  title?: string;
  subtitle?: string;
  locations?: AsistenciaLocationSummary[];
  viewMode?: AsistenciaViewMode;
  onViewModeChange?: (mode: AsistenciaViewMode) => void;
  onLocationSelect?: (locationId: string) => void;
  onSync?: () => void;
  live?: boolean;
  loading?: boolean;
  errorMessage?: string;
  emptyMessage?: string;
  theme?: AsistenciaTheme;
  className?: string;
}

export function AsistenciaLocationHub({
  title = 'Monitor de Asistencia',
  subtitle = 'Selecciona una sede para ver el detalle',
  locations = [],
  viewMode,
  onViewModeChange,
  onLocationSelect,
  onSync,
  live = false,
  loading = false,
  errorMessage,
  emptyMessage = 'No hay sedes activas configuradas.',
  theme = 'dark',
  className,
}: AsistenciaLocationHubProps): JSX.Element {
  const [internalViewMode, setInternalViewMode] = useState<AsistenciaViewMode>('list');
  const resolvedViewMode = viewMode ?? internalViewMode;

  const sortedLocations = useMemo(() => sortLocationsByActivity(locations), [locations]);
  const aggregateMetrics = useMemo(() => aggregateLocationMetrics(locations), [locations]);
  const locationSummary = useMemo(() => {
    const sedeLabel =
      locations.length === 1 ? '1 SEDE ACTIVA' : `${locations.length} SEDES ACTIVAS`;
    const employeeLabel =
      aggregateMetrics.total === 1 ? '1 EMPLEADO' : `${aggregateMetrics.total} EMPLEADOS`;
    return `${sedeLabel} · ${employeeLabel}`;
  }, [aggregateMetrics.total, locations.length]);

  const handleViewModeChange = (mode: AsistenciaViewMode) => {
    if (viewMode === undefined) {
      setInternalViewMode(mode);
    }
    onViewModeChange?.(mode);
  };

  return (
    <AsistenciaPage theme={theme} className={className}>
      <div className={styles.hub}>
        <AsistenciaPageHeader
          title={title}
          subtitle={subtitle}
          theme={theme}
          live={live}
          syncAction={onSync ? <AsistenciaSyncButton theme={theme} onClick={onSync} /> : undefined}
        />

        <div className={styles.metrics}>
          <RecetaMetricCard
            theme={theme}
            size="sm"
            title="En turno"
            value={String(aggregateMetrics.onShift)}
            variant="type-2"
            showIcon={false}
            className={styles.metricCard}
          />
          <RecetaMetricCard
            theme={theme}
            size="sm"
            title="Ausentes"
            value={String(aggregateMetrics.absent)}
            variant="type-4"
            showIcon={false}
            className={styles.metricCard}
          />
          <RecetaMetricCard
            theme={theme}
            size="sm"
            title="Llegadas tarde"
            value={String(aggregateMetrics.offSchedule)}
            variant="type-1"
            showIcon={false}
            className={styles.metricCard}
          />
          <RecetaMetricCard
            theme={theme}
            size="sm"
            title="Con horas extra"
            value={String(aggregateMetrics.overtime)}
            variant="type-3"
            showIcon={false}
            className={styles.metricCard}
          />
        </div>

        <AsistenciaContextBar
          theme={theme}
          summary={locationSummary}
          className={styles.contextBar}
          actions={
            <AsistenciaViewToggle
              theme={theme}
              value={resolvedViewMode}
              onChange={handleViewModeChange}
            />
          }
        />

        {errorMessage ? (
          <p className={`${styles.stateMessage} ${styles.stateMessageError}`} role="alert">
            {errorMessage}
          </p>
        ) : loading ? (
          <p className={styles.stateMessage}>Cargando sedes…</p>
        ) : sortedLocations.length === 0 ? (
          <p className={styles.emptyMessage}>{emptyMessage}</p>
        ) : resolvedViewMode === 'grid' ? (
          <div className={styles.grid}>
            {sortedLocations.map((location) => (
              <AsistenciaLocationCard
                key={location.id}
                {...location}
                theme={theme}
                onSelect={onLocationSelect}
              />
            ))}
          </div>
        ) : (
          <AsistenciaLocationList theme={theme}>
            {sortedLocations.map((location) => (
              <AsistenciaLocationListRow
                key={location.id}
                {...location}
                theme={theme}
                onSelect={onLocationSelect}
              />
            ))}
          </AsistenciaLocationList>
        )}
      </div>
    </AsistenciaPage>
  );
}

export default AsistenciaLocationHub;
