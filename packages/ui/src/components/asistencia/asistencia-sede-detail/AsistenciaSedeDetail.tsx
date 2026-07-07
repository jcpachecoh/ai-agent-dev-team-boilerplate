import type { JSX, ReactNode } from 'react';

import { RecetaMetricCard } from '../../receta/receta-metric-card';
import { AsistenciaCategorySection } from '../asistencia-category-section';
import { AsistenciaContextBar } from '../asistencia-context-bar';
import { AsistenciaEmployeeCard } from '../asistencia-employee-card';
import { AsistenciaEmployeeList, AsistenciaEmployeeListRow } from '../asistencia-employee-list';
import { AsistenciaLegendItem } from '../asistencia-legend-item';
import { AsistenciaPage } from '../asistencia-page';
import { AsistenciaPageHeader } from '../asistencia-page-header';
import { AsistenciaSyncButton } from '../asistencia-sync-button';
import { AsistenciaViewToggle } from '../asistencia-view-toggle';
import type {
  AsistenciaCategoryEmployees,
  AsistenciaEmployeeCardData,
  AsistenciaMonitorMetrics,
  AsistenciaTheme,
  AsistenciaViewMode,
} from '../shared/asistencia-types';
import { formatMetricFraction } from '../shared/asistencia-utils';
import styles from './AsistenciaSedeDetail.module.scss';

export interface AsistenciaSedeDetailProps {
  title?: string;
  subtitle?: string;
  periodRangeLabel?: string;
  locationSummary?: string;
  lastSyncLabel?: string;
  metrics?: AsistenciaMonitorMetrics;
  employees?: AsistenciaCategoryEmployees;
  viewMode?: AsistenciaViewMode;
  onViewModeChange?: (mode: AsistenciaViewMode) => void;
  onBack?: () => void;
  onSync?: () => void;
  onQuickEntry?: () => void;
  onQuickExit?: () => void;
  showQuickActions?: boolean;
  periodFilter?: ReactNode;
  live?: boolean;
  loading?: boolean;
  errorMessage?: string;
  emptyMessage?: string;
  theme?: AsistenciaTheme;
  className?: string;
  onEmployeeClick?: (employee: AsistenciaEmployeeCardData) => void;
}

const defaultMetrics: AsistenciaMonitorMetrics = {
  total: 0,
  onShift: 0,
  absent: 0,
  offSchedule: 0,
  overtime: 0,
  legalAlerts: 0,
};

const defaultEmployees: AsistenciaCategoryEmployees = {
  onShift: [],
  absent: [],
  late: [],
  overtime: [],
};

function renderEmployees(
  items: AsistenciaEmployeeCardData[],
  viewMode: AsistenciaViewMode,
  theme: AsistenciaTheme,
  onEmployeeClick?: (employee: AsistenciaEmployeeCardData) => void,
): JSX.Element {
  if (viewMode === 'grid') {
    return (
      <div className={styles.categoryGrid}>
        {items.map((employee) => (
          <AsistenciaEmployeeCard
            key={employee.id}
            {...employee}
            theme={theme}
            onClick={onEmployeeClick ? () => onEmployeeClick(employee) : undefined}
          />
        ))}
      </div>
    );
  }

  return (
    <AsistenciaEmployeeList>
      {items.map((employee) => (
        <AsistenciaEmployeeListRow
          key={employee.id}
          {...employee}
          theme={theme}
          onClick={onEmployeeClick ? () => onEmployeeClick(employee) : undefined}
        />
      ))}
    </AsistenciaEmployeeList>
  );
}

export function AsistenciaSedeDetail({
  title = 'Monitor de Asistencia',
  subtitle = 'Detalle de sede',
  periodRangeLabel,
  locationSummary,
  lastSyncLabel,
  metrics = defaultMetrics,
  employees = defaultEmployees,
  viewMode = 'list',
  onViewModeChange,
  onBack,
  onSync,
  onQuickEntry,
  onQuickExit,
  showQuickActions = true,
  periodFilter,
  live = false,
  loading = false,
  errorMessage,
  emptyMessage,
  theme = 'dark',
  className,
  onEmployeeClick,
}: AsistenciaSedeDetailProps): JSX.Element {
  const resolvedSubtitle = lastSyncLabel ? `${subtitle} · Última sync: ${lastSyncLabel}` : subtitle;
  const totalEmployees =
    employees.onShift.length +
    employees.absent.length +
    employees.late.length +
    employees.overtime.length;

  return (
    <AsistenciaPage theme={theme} className={className}>
      <div className={styles.detail}>
        <div className={styles.backRow}>
          {onBack ? (
            <button type="button" className={styles.backButton} onClick={onBack}>
              ← Volver a sedes
            </button>
          ) : (
            <span />
          )}
          {periodFilter}
        </div>

        <AsistenciaPageHeader
          title={title}
          subtitle={resolvedSubtitle}
          theme={theme}
          live={live}
          syncAction={
            <div className={styles.actions}>
              {showQuickActions ? (
                <>
                  <AsistenciaSyncButton
                    theme={theme}
                    onClick={onQuickEntry}
                    label="Registrar entrada"
                  />
                  <AsistenciaSyncButton
                    theme={theme}
                    onClick={onQuickExit}
                    label="Registrar salida"
                  />
                </>
              ) : null}
              <AsistenciaSyncButton theme={theme} onClick={onSync} />
            </div>
          }
        />

        {periodRangeLabel ? <p className={styles.periodRange}>{periodRangeLabel}</p> : null}

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
            title="Llegadas tarde"
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
        </div>

        <AsistenciaContextBar
          theme={theme}
          summary={locationSummary ?? ''}
          className={styles.contextBar}
          legend={
            <>
              <AsistenciaLegendItem label="En turno" status="on-shift" theme={theme} />
              <AsistenciaLegendItem label="Ausente" status="absent" theme={theme} />
              <AsistenciaLegendItem label="Llegada tarde" status="off-schedule" theme={theme} />
            </>
          }
          actions={
            <AsistenciaViewToggle theme={theme} value={viewMode} onChange={onViewModeChange} />
          }
        />

        {errorMessage ? (
          <p className={`${styles.stateMessage} ${styles.stateMessageError}`} role="alert">
            {errorMessage}
          </p>
        ) : loading ? (
          <p className={styles.stateMessage}>Cargando asistencia…</p>
        ) : totalEmployees === 0 && emptyMessage ? (
          <p className={styles.emptyMessage}>{emptyMessage}</p>
        ) : (
          <div className={styles.categories}>
            <AsistenciaCategorySection
              title="En turno"
              count={employees.onShift.length}
              theme={theme}
            >
              {employees.onShift.length > 0
                ? renderEmployees(employees.onShift, viewMode, theme, onEmployeeClick)
                : null}
            </AsistenciaCategorySection>
            <AsistenciaCategorySection
              title="Ausentes"
              count={employees.absent.length}
              theme={theme}
            >
              {employees.absent.length > 0
                ? renderEmployees(employees.absent, viewMode, theme, onEmployeeClick)
                : null}
            </AsistenciaCategorySection>
            <AsistenciaCategorySection
              title="Llegadas tarde"
              count={employees.late.length}
              theme={theme}
            >
              {employees.late.length > 0
                ? renderEmployees(employees.late, viewMode, theme, onEmployeeClick)
                : null}
            </AsistenciaCategorySection>
            <AsistenciaCategorySection
              title="Horas extra"
              count={employees.overtime.length}
              theme={theme}
            >
              {employees.overtime.length > 0
                ? renderEmployees(employees.overtime, viewMode, theme, onEmployeeClick)
                : null}
            </AsistenciaCategorySection>
          </div>
        )}
      </div>
    </AsistenciaPage>
  );
}

export default AsistenciaSedeDetail;
