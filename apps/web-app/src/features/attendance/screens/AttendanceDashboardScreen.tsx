import {
  AsistenciaPage,
  AsistenciaPageHeader,
  AsistenciaSyncButton,
  AreaChart,
  EmpleadoAvatar,
  RecetaFilterSelect,
  RecetaMetricCard,
  RecetaTextInput,
  resolveEmpleadoInitials,
  Spinner,
} from '@restopsiq/ui';
import { MapPin, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useUiTheme } from '@/hooks/useUiTheme';
import { useTheme } from '@/providers/ThemeProvider';
import { getErrorMessage } from '@/lib/graphql-client';

import { dismissAttendanceAlert } from '../api/attendance.client';
import { formatLastSyncLabel } from '../mappers/monitor.mappers';
import { useAttendanceComparisonQuery } from '../hooks/useAttendanceComparisonQuery';
import { useAttendanceControlPanelQuery } from '../hooks/useAttendanceControlPanelQuery';
import { useAttendanceScopeLocations } from '../hooks/useAttendanceScopeLocations';
import { getTodayIsoDateBogota } from '../utils/attendance-storage';
import type {
  AttendanceClasificacion,
  AttendanceControlPanelPeriod,
  AttendanceControlPanelTimelineRow,
} from '../types/attendance.types';
import styles from './AttendanceDashboardScreen.module.scss';

function formatAttendanceSourceLabel(source: AttendanceControlPanelTimelineRow['source']): string {
  switch (source) {
    case 'APP_MOVIL':
      return 'App móvil';
    case 'MANUAL':
      return 'Manual';
    default:
      return 'Automática';
  }
}

const TIMELINE_PERIOD_OPTIONS: Array<{ id: AttendanceControlPanelPeriod; label: string }> = [
  { id: 'day', label: 'Hoy' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
];

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

const CLASIFICACION_OPTIONS: Array<{ value: AttendanceClasificacion; label: string }> = [
  { value: 'todos', label: 'Todas las clasificaciones' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'operaciones', label: 'Operaciones' },
];

const TIMELINE_PERIOD_TITLES: Record<AttendanceControlPanelPeriod, string> = {
  day: 'Línea de tiempo hoy',
  week: 'Línea de tiempo semana',
  month: 'Línea de tiempo mes',
};

type SortableColumn =
  | 'documentNumber'
  | 'primerApellido'
  | 'nombres'
  | 'especialidad'
  | 'area'
  | 'contrato'
  | 'lastRecordAt';

function formatRecordDate(value: string): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function formatComparisonChartLabel(
  label: string,
  bucketKey: string,
  period: AttendanceControlPanelPeriod,
): string {
  if (period === 'day') return label;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(bucketKey);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return label;
}

function formatAlertTime(value: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

export function AttendanceDashboardScreen(): React.JSX.Element {
  const uiTheme = useUiTheme();
  const { theme } = useTheme();
  const asistenciaTheme = theme === 'light' ? 'light' : 'dark';
  const today = useMemo(() => getTodayIsoDateBogota(), []);
  const {
    isSystemAdmin,
    isGeneralScope,
    locations: scopedLocations,
  } = useAttendanceScopeLocations();

  const scopedLocationId = useMemo(() => {
    if (isSystemAdmin || isGeneralScope) return '';
    if (scopedLocations.length === 1) return scopedLocations[0]?.id ?? '';
    return '';
  }, [isGeneralScope, isSystemAdmin, scopedLocations]);

  const [search, setSearch] = useState('');
  const [locationId, setLocationId] = useState('');
  const [area, setArea] = useState('');
  const [contractType, setContractType] = useState('');
  const [clasificacion, setClasificacion] = useState<AttendanceClasificacion>('todos');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(20);
  const [timelinePeriod, setTimelinePeriod] = useState<AttendanceControlPanelPeriod>('day');
  const [sortBy, setSortBy] = useState<SortableColumn>('lastRecordAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [dismissingAlertIds, setDismissingAlertIds] = useState<Set<string>>(new Set());
  const [mobileTab, setMobileTab] = useState<'timeline' | 'alerts'>('timeline');

  const query = useAttendanceControlPanelQuery({
    anchorDate: today,
    period: timelinePeriod,
    locationId: locationId || scopedLocationId || undefined,
    area: area || undefined,
    contractType: contractType || undefined,
    clasificacion,
    search: search.trim() || undefined,
    page,
    pageSize,
    sortBy,
    sortDir,
  });

  const comparisonFilters = useMemo(
    () => ({
      anchorDate: today,
      period: timelinePeriod,
      locationId: locationId || scopedLocationId || undefined,
      area: area || undefined,
      contractType: contractType || undefined,
      search: search.trim() || undefined,
    }),
    [area, contractType, locationId, scopedLocationId, search, timelinePeriod, today],
  );

  const comparisonQuery = useAttendanceComparisonQuery(comparisonFilters);
  const comparison = comparisonQuery.data;

  const chartData = useMemo(
    () =>
      comparison?.points.map((point) => ({
        label: formatComparisonChartLabel(point.label, point.bucketKey, timelinePeriod),
        current: point.current,
        previous: point.previous,
      })) ?? [],
    [comparison?.points, timelinePeriod],
  );

  const chartSeries = useMemo(
    () => [
      {
        dataKey: 'current',
        name: comparison?.series.current.name ?? 'Periodo actual',
        colorIndex: 0,
      },
      {
        dataKey: 'previous',
        name: comparison?.series.previous.name ?? 'Periodo anterior',
        colorIndex: 1,
      },
    ],
    [comparison?.series.current.name, comparison?.series.previous.name],
  );

  const chartXAxisInterval = useMemo(() => {
    if (timelinePeriod === 'day') return 2;
    if (timelinePeriod === 'week') return 0;
    return 5;
  }, [timelinePeriod]);

  const data = query.data;
  // El backend ya excluye las alertas descartadas por este usuario (persistidas en
  // AlertDismissal); dismissingAlertIds solo oculta al instante mientras el POST
  // de descarte y el refetch siguiente todavía no confirman el cambio en el server.
  const visibleAlerts = useMemo(
    () => (data?.alerts ?? []).filter((alert) => !dismissingAlertIds.has(alert.id)),
    [data?.alerts, dismissingAlertIds],
  );

  const totalPages = data
    ? Math.max(1, Math.ceil(data.timeline.total / data.timeline.pageSize))
    : 1;
  const canFilterByLocation = isSystemAdmin || isGeneralScope;

  const handleSort = (column: SortableColumn) => {
    if (sortBy === column) {
      setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(column);
    setSortDir('asc');
  };

  const handleDismissAlert = (alertKey: string) => {
    setDismissingAlertIds((current) => new Set(current).add(alertKey));
    void dismissAttendanceAlert(alertKey)
      .then(() => query.refetch())
      .catch(() => {
        setDismissingAlertIds((current) => {
          const next = new Set(current);
          next.delete(alertKey);
          return next;
        });
      });
  };

  const clearFilters = () => {
    setSearch('');
    setLocationId('');
    setArea('');
    setContractType('');
    setClasificacion('todos');
    setPage(1);
  };

  return (
    <AsistenciaPage theme={asistenciaTheme} className={styles.page}>
      <AsistenciaPageHeader
        theme={asistenciaTheme}
        title="Panel de control"
        subtitle={`Línea de tiempo hoy · ${today} · Actualización cada 60s · Última sync: ${formatLastSyncLabel(query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : undefined)}`}
        live={data?.isLive}
        syncAction={
          <AsistenciaSyncButton theme={asistenciaTheme} onClick={() => void query.refetch()} />
        }
      />

      {query.error ? (
        <p className={styles.error} role="alert">
          {getErrorMessage(query.error)}
        </p>
      ) : null}

      <section className={styles.chartPanel} aria-label="Comparativo de asistencias">
        <div className={styles.panelHeader}>
          <div className={styles.chartHeading}>
            <h2 className={styles.panelTitle}>Comparativo de asistencias</h2>
            {comparison ? (
              <p className={styles.chartSubtitle}>
                {comparison.dateFrom === comparison.dateTo
                  ? comparison.dateFrom
                  : `${comparison.dateFrom} – ${comparison.dateTo}`}{' '}
                vs{' '}
                {comparison.previousDateFrom === comparison.previousDateTo
                  ? comparison.previousDateFrom
                  : `${comparison.previousDateFrom} – ${comparison.previousDateTo}`}
              </p>
            ) : null}
          </div>
          <div className={styles.periodFilter} role="group" aria-label="Periodo del comparativo">
            {TIMELINE_PERIOD_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={[
                  styles.periodButton,
                  timelinePeriod === option.id ? styles.periodButtonActive : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-pressed={timelinePeriod === option.id}
                onClick={() => {
                  setTimelinePeriod(option.id);
                  setPage(1);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.chartWrap}>
          <AreaChart
            theme={asistenciaTheme}
            size="md"
            height={220}
            xAxisInterval={chartXAxisInterval}
            className={styles.comparisonChart}
            data={chartData}
            xDataKey="label"
            series={chartSeries}
            loading={comparisonQuery.isLoading}
            empty={!comparisonQuery.isLoading && chartData.length === 0}
            emptyTitle="Sin datos de comparación"
            emptyDescription="No hay marcaciones en el periodo seleccionado."
            ariaLabel="Comparativo de asistencias por periodo"
          />
        </div>
      </section>

      <section className={styles.metrics} aria-label="Indicadores del día">
        <RecetaMetricCard
          theme={asistenciaTheme}
          title="Cantidad de personas trabajando"
          value={String(data?.metrics.workingNow ?? 0)}
          description="Con entrada activa sin salida"
          variant="type-1"
          loading={query.isLoading}
        />
        <RecetaMetricCard
          theme={asistenciaTheme}
          title="Cantidad de asistencias de hoy"
          value={String(data?.metrics.attendanceToday ?? 0)}
          description="Colaboradores con marcación hoy"
          variant="type-2"
          loading={query.isLoading}
        />
        <RecetaMetricCard
          theme={asistenciaTheme}
          title={`Asistencias ${data?.tenantName ?? 'empresa'}`}
          value={String(data?.metrics.tenantAttendanceToday ?? 0)}
          description="Consolidado del alcance visible"
          variant="type-3"
          loading={query.isLoading}
        />
        <RecetaMetricCard
          theme={asistenciaTheme}
          title="Hrs Extras mes"
          value={`${data?.metrics.overtimeHoursMonth ?? 0}h`}
          description="Acumulado del mes calendario"
          variant="type-4"
          loading={query.isLoading}
        />
      </section>

      <section className={styles.filters} aria-label="Filtros del panel">
        <RecetaTextInput
          theme={uiTheme}
          className={styles.searchInput}
          placeholder="Buscar por nombre o documento"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        {canFilterByLocation ? (
          <RecetaFilterSelect
            theme={uiTheme}
            size="md"
            placeholder="Todas las sedes"
            value={locationId}
            options={[
              { value: '', label: 'Todas las sedes' },
              ...(data?.filters.locations ?? []).map((location) => ({
                value: location.id,
                label: location.name,
              })),
            ]}
            onChange={(value) => {
              setLocationId(value);
              setPage(1);
            }}
          />
        ) : null}
        <RecetaFilterSelect
          theme={uiTheme}
          size="md"
          placeholder="Todas las áreas"
          value={area}
          options={[
            { value: '', label: 'Todas las áreas' },
            ...(data?.filters.areas ?? []).map((item) => ({ value: item, label: item })),
          ]}
          onChange={(value) => {
            setArea(value);
            setPage(1);
          }}
        />
        <RecetaFilterSelect
          theme={uiTheme}
          size="md"
          placeholder="Todos los contratos"
          value={contractType}
          options={[
            { value: '', label: 'Todos los contratos' },
            ...(data?.filters.contractTypes ?? []).map((item) => ({ value: item, label: item })),
          ]}
          onChange={(value) => {
            setContractType(value);
            setPage(1);
          }}
        />
        <RecetaFilterSelect
          theme={uiTheme}
          size="md"
          placeholder="Todas las clasificaciones"
          value={clasificacion}
          options={CLASIFICACION_OPTIONS}
          onChange={(value) => {
            setClasificacion(value as AttendanceClasificacion);
            setPage(1);
          }}
        />
        <button type="button" className={styles.clearButton} onClick={clearFilters}>
          Limpiar filtros
        </button>
      </section>

      <div className={styles.mobileTabs} role="tablist" aria-label="Secciones del panel">
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'timeline'}
          className={mobileTab === 'timeline' ? styles.mobileTabActive : styles.mobileTab}
          onClick={() => setMobileTab('timeline')}
        >
          Línea de tiempo
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'alerts'}
          className={mobileTab === 'alerts' ? styles.mobileTabActive : styles.mobileTab}
          onClick={() => setMobileTab('alerts')}
        >
          Alertas ({visibleAlerts.length})
        </button>
      </div>

      <div className={styles.content}>
        <section
          className={[styles.timelinePanel, mobileTab === 'alerts' ? styles.hiddenOnMobile : '']
            .filter(Boolean)
            .join(' ')}
          aria-label="Línea de tiempo hoy"
        >
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>{TIMELINE_PERIOD_TITLES[timelinePeriod]}</h2>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Foto</th>
                  <th scope="col">
                    <button
                      type="button"
                      className={styles.sortButton}
                      onClick={() => handleSort('documentNumber')}
                    >
                      Documento
                    </button>
                  </th>
                  <th scope="col">
                    <button
                      type="button"
                      className={styles.sortButton}
                      onClick={() => handleSort('primerApellido')}
                    >
                      Primer apellido
                    </button>
                  </th>
                  <th scope="col">
                    <button
                      type="button"
                      className={styles.sortButton}
                      onClick={() => handleSort('nombres')}
                    >
                      Nombre
                    </button>
                  </th>
                  <th scope="col">
                    <button
                      type="button"
                      className={styles.sortButton}
                      onClick={() => handleSort('especialidad')}
                    >
                      Especialidad
                    </button>
                  </th>
                  <th scope="col">
                    <button
                      type="button"
                      className={styles.sortButton}
                      onClick={() => handleSort('area')}
                    >
                      Área
                    </button>
                  </th>
                  <th scope="col">
                    <button
                      type="button"
                      className={styles.sortButton}
                      onClick={() => handleSort('contrato')}
                    >
                      Contrato
                    </button>
                  </th>
                  <th scope="col">
                    <button
                      type="button"
                      className={styles.sortButton}
                      onClick={() => handleSort('lastRecordAt')}
                    >
                      Último registro
                    </button>
                  </th>
                  <th scope="col">Origen</th>
                  <th scope="col">Geo</th>
                </tr>
              </thead>
              <tbody>
                {query.isLoading ? (
                  <tr>
                    <td colSpan={10} className={styles.emptyCell}>
                      <div className={styles.loadingState} role="status" aria-live="polite">
                        <Spinner size="lg" theme={asistenciaTheme === 'light' ? 'light' : 'dark'} />
                        <p className={styles.loadingText}>Cargando línea de tiempo…</p>
                      </div>
                    </td>
                  </tr>
                ) : (data?.timeline.items.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={10} className={styles.emptyCell}>
                      No hay marcaciones registradas en el periodo con los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  data?.timeline.items.map((row) => (
                    <TimelineRow key={row.employeeId} row={row} theme={asistenciaTheme} />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.pagination}>
            <button
              type="button"
              className={styles.pageButton}
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Anterior
            </button>
            <span className={styles.pageInfo}>
              Página {page} de {totalPages} · {data?.timeline.total ?? 0} registros
            </span>
            <button
              type="button"
              className={styles.pageButton}
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Siguiente
            </button>
            <div className={styles.pageSizeControl}>
              <span className={styles.pageSizeLabel}>Filas por página</span>
              <RecetaFilterSelect
                theme={uiTheme}
                size="sm"
                aria-label="Filas por página"
                value={String(pageSize)}
                options={PAGE_SIZE_OPTIONS.map((size) => ({
                  value: String(size),
                  label: String(size),
                }))}
                onChange={(value) => {
                  setPageSize(Number(value) as (typeof PAGE_SIZE_OPTIONS)[number]);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </section>

        <aside
          className={[styles.alertsPanel, mobileTab === 'timeline' ? styles.hiddenOnMobile : '']
            .filter(Boolean)
            .join(' ')}
          aria-label="Alertas"
        >
          <div className={styles.alertsHeader}>
            <h2 className={styles.panelTitle}>Alertas</h2>
            <span className={styles.alertCount}>{visibleAlerts.length}</span>
          </div>
          {visibleAlerts.length === 0 ? (
            <p className={styles.emptyAlerts}>Sin alertas activas para el día consultado.</p>
          ) : (
            <ul className={styles.alertList}>
              {visibleAlerts.map((alert) => (
                <li key={alert.id} className={styles.alertItem}>
                  <div>
                    <p className={styles.alertTitle}>{alert.title}</p>
                    {alert.subtitle ? (
                      <p className={styles.alertSubtitle}>{alert.subtitle}</p>
                    ) : null}
                    <p className={styles.alertTime}>{formatAlertTime(alert.generatedAt)}</p>
                  </div>
                  <button
                    type="button"
                    className={styles.dismissButton}
                    aria-label={`Descartar alerta de ${alert.employeeName ?? 'colaborador'}`}
                    onClick={() => handleDismissAlert(alert.id)}
                  >
                    <X size={14} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </AsistenciaPage>
  );
}

function TimelineRow({
  row,
  theme,
}: {
  row: AttendanceControlPanelTimelineRow;
  theme: 'light' | 'dark';
}): React.JSX.Element {
  const fullName = [row.nombres, row.primerApellido].filter(Boolean).join(' ');
  const mapUrl =
    row.latitude != null && row.longitude != null
      ? `https://www.google.com/maps?q=${row.latitude},${row.longitude}`
      : null;

  return (
    <tr className={row.isOutOfGeofence ? styles.outOfGeofenceRow : undefined}>
      <td>
        <EmpleadoAvatar
          initials={resolveEmpleadoInitials(fullName || row.documentNumber)}
          photoUrl={row.photoUrl ?? undefined}
          theme={theme}
          size="sm"
        />
      </td>
      <td>{row.documentNumber}</td>
      <td>{row.primerApellido ?? '—'}</td>
      <td>{row.nombres ?? '—'}</td>
      <td>{row.especialidad}</td>
      <td>{row.area}</td>
      <td>{row.contrato}</td>
      <td>{formatRecordDate(row.lastRecordAt)}</td>
      <td>{formatAttendanceSourceLabel(row.source)}</td>
      <td>
        {mapUrl ? (
          <a
            href={mapUrl}
            target="_blank"
            rel="noreferrer"
            className={row.isOutOfGeofence ? styles.geoLinkDanger : styles.geoLink}
            aria-label={`Ver ubicación de ${fullName}`}
          >
            <MapPin size={16} aria-hidden />
          </a>
        ) : (
          <span className={styles.noGeo}>—</span>
        )}
      </td>
    </tr>
  );
}
