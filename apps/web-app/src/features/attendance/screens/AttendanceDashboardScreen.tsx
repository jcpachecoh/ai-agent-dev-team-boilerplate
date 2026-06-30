import {
  AsistenciaPage,
  AsistenciaPageHeader,
  AsistenciaSyncButton,
  RecetaMetricCard,
} from '@restopsiq/ui';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { useTheme } from '@/providers/ThemeProvider';
import { getErrorMessage } from '@/lib/graphql-client';

import { getAttendanceMonitorSummary } from '../api/attendance.client';
import { ATTENDANCE_ROUTES } from '../constants/routes';
import { attendanceKeys } from '../api/queryKeys';
import { useAttendanceScopeLocations } from '../hooks/useAttendanceScopeLocations';
import { buildLocationSummary, formatLastSyncLabel } from '../mappers/monitor.mappers';
import { getTodayIsoDateBogota } from '../utils/attendance-storage';
import styles from './AttendanceDashboardScreen.module.scss';

const REFETCH_INTERVAL_MS = 60_000;

export function AttendanceDashboardScreen(): React.JSX.Element {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const asistenciaTheme = theme === 'light' ? 'light' : 'dark';
  const today = useMemo(() => getTodayIsoDateBogota(), []);
  const {
    locations: scopedLocations,
    isLoading: isLocationsLoading,
    error: locationsError,
  } = useAttendanceScopeLocations();

  const summaryQueries = useQueries({
    queries: scopedLocations.map((location) => ({
      queryKey: attendanceKeys.monitorSummary(location.id, 'day', today),
      queryFn: () =>
        getAttendanceMonitorSummary(location.id, {
          period: 'day',
          anchorDate: today,
        }),
      enabled: Boolean(location.id),
      refetchInterval: REFETCH_INTERVAL_MS,
    })),
  });

  const locationSummaries = useMemo(() => {
    return scopedLocations.map((location, index) => {
      const summary = summaryQueries[index]?.data;
      if (!summary) {
        return buildLocationSummary(location, {
          locationId: location.id,
          period: 'day',
          anchorDate: today,
          dateFrom: today,
          dateTo: today,
          isLive: false,
          metrics: {
            total: 0,
            onShift: 0,
            absent: 0,
            lateArrivals: 0,
            overtime: 0,
            offSchedule: 0,
            legalAlerts: 0,
          },
          employees: { onShift: [], absent: [], late: [], overtime: [] },
        });
      }
      return buildLocationSummary(location, summary);
    });
  }, [scopedLocations, summaryQueries, today]);

  const aggregateMetrics = useMemo(() => {
    return locationSummaries.reduce(
      (acc, location) => ({
        total: acc.total + location.metrics.total,
        onShift: acc.onShift + location.metrics.onShift,
        absent: acc.absent + location.metrics.absent,
        offSchedule: acc.offSchedule + location.metrics.lateArrivals,
        overtime: acc.overtime + location.metrics.overtime,
        legalAlerts: acc.legalAlerts,
      }),
      { total: 0, onShift: 0, absent: 0, offSchedule: 0, overtime: 0, legalAlerts: 0 },
    );
  }, [locationSummaries]);

  const formatMetricFraction = (value: number, total: number): string => `${value} / ${total}`;

  const noveltyCount =
    aggregateMetrics.offSchedule + aggregateMetrics.overtime + aggregateMetrics.legalAlerts;

  const isLoading = isLocationsLoading || summaryQueries.some((query) => query.isPending);
  const queryError =
    locationsError ?? summaryQueries.find((query) => query.error)?.error ?? undefined;
  const isLive = summaryQueries.some((query) => query.data?.isLive);
  const latestSyncAt = summaryQueries.reduce<number | undefined>((latest, query) => {
    if (!query.dataUpdatedAt) return latest;
    return latest === undefined ? query.dataUpdatedAt : Math.max(latest, query.dataUpdatedAt);
  }, undefined);
  const lastSyncLabel = formatLastSyncLabel(latestSyncAt ? new Date(latestSyncAt) : undefined);

  const handleSync = async () => {
    await Promise.all(
      scopedLocations.map((location) =>
        queryClient.invalidateQueries({
          queryKey: attendanceKeys.monitorSummary(location.id, 'day', today),
        }),
      ),
    );
  };

  return (
    <AsistenciaPage theme={asistenciaTheme} className={styles.page}>
      <AsistenciaPageHeader
        theme={asistenciaTheme}
        title="Panel de control"
        subtitle={`Resumen del día · ${today} · Actualización cada 60s · Última sync: ${lastSyncLabel}`}
        live={isLive}
        syncAction={
          <AsistenciaSyncButton theme={asistenciaTheme} onClick={() => void handleSync()} />
        }
      />

      {queryError ? (
        <p className={styles.error} role="alert">
          {getErrorMessage(queryError)}
        </p>
      ) : null}

      <section className={styles.metrics} aria-label="Indicadores del día">
        <RecetaMetricCard
          theme={asistenciaTheme}
          title="Colaboradores esperados"
          value={String(aggregateMetrics.total)}
          description="Total programado hoy"
          variant="type-1"
          loading={isLoading}
        />
        <RecetaMetricCard
          theme={asistenciaTheme}
          title="Presentes"
          value={formatMetricFraction(aggregateMetrics.onShift, aggregateMetrics.total)}
          description="En turno ahora"
          variant="type-2"
          loading={isLoading}
        />
        <RecetaMetricCard
          theme={asistenciaTheme}
          title="Ausentes"
          value={formatMetricFraction(aggregateMetrics.absent, aggregateMetrics.total)}
          description="Sin marcación de entrada"
          variant="type-3"
          loading={isLoading}
        />
        <RecetaMetricCard
          theme={asistenciaTheme}
          title="Con novedad"
          value={String(noveltyCount)}
          description="Tardanzas, extras o alertas legales"
          variant="type-4"
          loading={isLoading}
        />
      </section>

      <section className={styles.locations} aria-label="Sedes monitoreadas">
        <div className={styles.locationsHeader}>
          <h2 className={styles.locationsTitle}>Sedes</h2>
          <button
            type="button"
            className={styles.linkButton}
            onClick={() => navigate(ATTENDANCE_ROUTES.monitor)}
          >
            Ir al monitor de asistencias
          </button>
        </div>

        {scopedLocations.length === 0 && !isLoading ? (
          <p className={styles.empty}>No hay sedes activas en tu alcance.</p>
        ) : (
          <ul className={styles.locationList}>
            {locationSummaries.map((location) => (
              <li key={location.id}>
                <button
                  type="button"
                  className={styles.locationCard}
                  onClick={() => navigate(ATTENDANCE_ROUTES.locationDetail(location.id))}
                >
                  <span className={styles.locationName}>{location.name}</span>
                  <span className={styles.locationMeta}>
                    {location.city} · Presentes {location.metrics.onShift} /{' '}
                    {location.metrics.total}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AsistenciaPage>
  );
}
