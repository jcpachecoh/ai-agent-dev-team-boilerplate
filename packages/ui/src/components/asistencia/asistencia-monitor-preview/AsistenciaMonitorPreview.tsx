import type { JSX } from 'react';
import { useState } from 'react';

import { RecetaMetricCard } from '../../receta/receta-metric-card';
import { AsistenciaContextBar } from '../asistencia-context-bar';
import { AsistenciaEmployeeCard } from '../asistencia-employee-card';
import type { AsistenciaEmployeeCardProps } from '../asistencia-employee-card';
import { AsistenciaEmployeeGrid } from '../asistencia-employee-grid';
import { AsistenciaEmployeeList, AsistenciaEmployeeListRow } from '../asistencia-employee-list';
import { AsistenciaLegendItem } from '../asistencia-legend-item';
import { AsistenciaLocationTabs } from '../asistencia-location-tabs';
import { AsistenciaPage } from '../asistencia-page';
import { AsistenciaPageHeader } from '../asistencia-page-header';
import { AsistenciaSyncButton } from '../asistencia-sync-button';
import { AsistenciaViewToggle } from '../asistencia-view-toggle';
import type {
  AsistenciaLocationTab,
  AsistenciaMonitorMetrics,
  AsistenciaTheme,
  AsistenciaViewMode,
} from '../shared/asistencia-types';
import { formatMetricFraction } from '../shared/asistencia-utils';
import styles from './AsistenciaMonitorPreview.module.scss';

export interface AsistenciaMonitorPreviewProps {
  title?: string;
  subtitle?: string;
  lastSyncLabel?: string;
  locationId?: string;
  locationSummary?: string;
  locations?: AsistenciaLocationTab[];
  metrics?: AsistenciaMonitorMetrics;
  employees?: AsistenciaEmployeeCardProps[];
  onLocationChange?: (locationId: string) => void;
  onSync?: () => void;
  onQuickEntry?: () => void;
  onQuickExit?: () => void;
  viewMode?: AsistenciaViewMode;
  onViewModeChange?: (mode: AsistenciaViewMode) => void;
  emptyMessage?: string;
  theme?: AsistenciaTheme;
  className?: string;
}

const defaultMetrics: AsistenciaMonitorMetrics = {
  onShift: 4,
  absent: 1,
  offSchedule: 0,
  overtime: 1,
  legalAlerts: 0,
  total: 5,
};

const defaultEmployees: AsistenciaEmployeeCardProps[] = [
  {
    id: 'emp-1',
    name: 'Carlos Mendoza',
    role: 'Parrillero',
    avatarTone: 'sand',
    status: 'on-shift',
    entryLabel: 'Entrada 07:05',
    shiftRange: '07:00–15:00',
    workedTime: '07h 52m',
    progressPercent: 98,
    progressTone: 'accent',
  },
  {
    id: 'emp-2',
    name: 'Ana López',
    role: 'Chef Principal',
    avatarTone: 'teal',
    status: 'on-shift',
    entryLabel: 'Entrada 07:00',
    shiftRange: '07:00–15:00',
    workedTime: '08h 18m',
    overtimeLabel: '+00h 18m ext.',
    progressPercent: 100,
    progressTone: 'amber',
    highlight: 'overtime',
  },
  {
    id: 'emp-3',
    name: 'Pedro Torres',
    role: 'Mesero',
    avatarTone: 'blue',
    status: 'on-shift',
    entryLabel: 'Entrada 12:02',
    shiftRange: '12:00–20:00',
    workedTime: '03h 03m',
    progressPercent: 38,
    progressTone: 'accent',
  },
  {
    id: 'emp-4',
    name: 'María Ruiz',
    role: 'Cajera',
    avatarTone: 'purple',
    status: 'absent',
    shiftRange: '09:00–17:00',
  },
  {
    id: 'emp-5',
    name: 'Roberto Silva',
    role: 'Auxiliar de Cocina',
    avatarTone: 'coral',
    status: 'on-shift',
    entryLabel: 'Entrada 07:15',
    shiftRange: '07:00–15:00',
    workedTime: '07h 42m',
    progressPercent: 96,
    progressTone: 'accent',
  },
];

export function AsistenciaMonitorPreview({
  title = 'Monitor de Asistencia',
  subtitle = 'Tiempo real · Polling cada 30s',
  lastSyncLabel = 'hace 1s',
  locationId = 'chapinero',
  locationSummary = 'SEDE CHAPINERO · 5 EMPLEADOS ACTIVOS',
  locations,
  metrics = defaultMetrics,
  employees = defaultEmployees,
  onLocationChange,
  onSync,
  onQuickEntry,
  onQuickExit,
  viewMode,
  onViewModeChange,
  emptyMessage,
  theme = 'dark',
  className,
}: AsistenciaMonitorPreviewProps): JSX.Element {
  const [internalViewMode, setInternalViewMode] = useState<AsistenciaViewMode>('list');
  const resolvedViewMode = viewMode ?? internalViewMode;

  const handleViewModeChange = (mode: AsistenciaViewMode) => {
    if (viewMode === undefined) {
      setInternalViewMode(mode);
    }
    onViewModeChange?.(mode);
  };

  const resolvedSubtitle = `${subtitle} · Última sync: ${lastSyncLabel}`;

  return (
    <AsistenciaPage theme={theme} className={className}>
      <div className={styles.monitor}>
        <AsistenciaPageHeader
          title={title}
          subtitle={resolvedSubtitle}
          theme={theme}
          syncAction={
            <div className={styles.actions}>
              <AsistenciaSyncButton
                theme={theme}
                onClick={onQuickEntry}
                label="Registrar entrada"
              />
              <AsistenciaSyncButton theme={theme} onClick={onQuickExit} label="Registrar salida" />
              <AsistenciaSyncButton theme={theme} onClick={onSync} />
            </div>
          }
        />

        <div className={styles.tabsWrap}>
          <AsistenciaLocationTabs
            tabs={locations}
            activeId={locationId}
            onChange={onLocationChange}
            theme={theme}
          />
        </div>

        <div className={styles.metrics}>
          <RecetaMetricCard
            theme={theme}
            size="sm"
            title="En turno"
            value={formatMetricFraction(metrics.onShift, metrics.total)}
            variant="type-2"
            showIcon={false}
            className={styles.metricCard}
          />
          <RecetaMetricCard
            theme={theme}
            size="sm"
            title="Ausentes"
            value={formatMetricFraction(metrics.absent, metrics.total)}
            variant="type-4"
            showIcon={false}
            className={styles.metricCard}
          />
          <RecetaMetricCard
            theme={theme}
            size="sm"
            title="Fuera de horario"
            value={formatMetricFraction(metrics.offSchedule, metrics.total)}
            variant="type-1"
            showIcon={false}
            className={styles.metricCard}
          />
          <RecetaMetricCard
            theme={theme}
            size="sm"
            title="Con horas extra"
            value={formatMetricFraction(metrics.overtime, metrics.total)}
            variant="type-3"
            showIcon={false}
            className={styles.metricCard}
          />
          <RecetaMetricCard
            theme={theme}
            size="sm"
            title="Alertas legales"
            value={formatMetricFraction(metrics.legalAlerts, metrics.total)}
            variant="type-1"
            showIcon={false}
            className={styles.metricCard}
          />
        </div>

        <AsistenciaContextBar
          theme={theme}
          summary={locationSummary}
          legend={
            <>
              <AsistenciaLegendItem label="En turno" status="on-shift" theme={theme} />
              <AsistenciaLegendItem label="Ausente" status="absent" theme={theme} />
              <AsistenciaLegendItem label="Fuera de horario" status="off-schedule" theme={theme} />
            </>
          }
          actions={
            <AsistenciaViewToggle
              theme={theme}
              value={resolvedViewMode}
              onChange={handleViewModeChange}
            />
          }
        />

        {employees.length === 0 && emptyMessage ? (
          <p className={styles.emptyMessage}>{emptyMessage}</p>
        ) : resolvedViewMode === 'grid' ? (
          <AsistenciaEmployeeGrid>
            {employees.map((employee) => (
              <AsistenciaEmployeeCard
                key={employee.id ?? employee.name}
                {...employee}
                theme={theme}
              />
            ))}
          </AsistenciaEmployeeGrid>
        ) : (
          <AsistenciaEmployeeList>
            {employees.map((employee) => (
              <AsistenciaEmployeeListRow
                key={employee.id ?? employee.name}
                {...employee}
                theme={theme}
              />
            ))}
          </AsistenciaEmployeeList>
        )}
      </div>
    </AsistenciaPage>
  );
}

export default AsistenciaMonitorPreview;
