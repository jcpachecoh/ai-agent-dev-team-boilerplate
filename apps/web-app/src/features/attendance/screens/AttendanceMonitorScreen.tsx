import {
  AsistenciaLocationHub,
  type AsistenciaLocationSummary,
  type AsistenciaViewMode,
  toast,
} from '@restopsiq/ui';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useTheme } from '@/providers/ThemeProvider';
import { getErrorMessage } from '@/lib/graphql-client';

import { ATTENDANCE_ROUTES } from '../constants/routes';
import { getAttendanceMonitorSummary } from '../api/attendance.client';
import { attendanceKeys } from '../api/queryKeys';
import { useAttendanceScopeLocations } from '../hooks/useAttendanceScopeLocations';
import { buildLocationSummary, formatLastSyncLabel } from '../mappers/monitor.mappers';
import { useLaborClassificationFilter } from '../stores/attendance-labor-filter.store';
import { filterAttendanceMonitorSummary } from '../utils/labor-classification';
import { useLaborClassificationLookup } from '../hooks/useLaborClassificationLookup';
import {
  getStoredLocationViewMode,
  getTodayIsoDateBogota,
  setStoredLocationViewMode,
} from '../utils/attendance-storage';

export function AttendanceMonitorScreen(): React.JSX.Element {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const asistenciaTheme = theme === 'light' ? 'light' : 'dark';
  const today = useMemo(() => getTodayIsoDateBogota(), []);
  const [viewMode, setViewMode] = useState<AsistenciaViewMode>(getStoredLocationViewMode);
  const { value: laborFilter } = useLaborClassificationFilter();
  const { lookup, payrollEmployees } = useLaborClassificationLookup();

  const {
    locations: activeLocations,
    isLoading: isLocationsLoading,
    error: locationsError,
  } = useAttendanceScopeLocations();

  const summaryQueries = useQueries({
    queries: activeLocations.map((location) => ({
      queryKey: attendanceKeys.monitorSummary(location.id, 'day', today),
      queryFn: () =>
        getAttendanceMonitorSummary(location.id, {
          period: 'day',
          anchorDate: today,
        }),
      enabled: Boolean(location.id),
      refetchInterval: 30_000,
    })),
  });

  const locationSummaries = useMemo((): AsistenciaLocationSummary[] => {
    return activeLocations.map((location, index) => {
      const rawSummary = summaryQueries[index]?.data;
      if (!rawSummary) {
        return {
          id: location.id,
          name: location.name,
          city: location.city ?? '',
          metrics: {
            total: 0,
            onShift: 0,
            absent: 0,
            lateArrivals: 0,
            overtime: 0,
          },
        };
      }

      const summary = filterAttendanceMonitorSummary(
        rawSummary,
        laborFilter,
        lookup,
        payrollEmployees,
      );
      return buildLocationSummary(location, summary);
    });
  }, [activeLocations, summaryQueries, laborFilter, lookup, payrollEmployees]);

  const isLoading = isLocationsLoading || summaryQueries.some((query) => query.isPending);
  const queryError = locationsError ?? summaryQueries.find((query) => query.error)?.error;
  const isLive = summaryQueries.some((query) => query.data?.isLive);
  const latestSyncAt = summaryQueries.reduce<number | undefined>((latest, query) => {
    if (!query.dataUpdatedAt) return latest;
    return latest === undefined ? query.dataUpdatedAt : Math.max(latest, query.dataUpdatedAt);
  }, undefined);
  const lastSyncLabel = formatLastSyncLabel(latestSyncAt ? new Date(latestSyncAt) : undefined);

  const handleViewModeChange = (mode: AsistenciaViewMode) => {
    setViewMode(mode);
    setStoredLocationViewMode(mode);
  };

  const handleLocationSelect = (locationId: string) => {
    navigate(ATTENDANCE_ROUTES.locationDetail(locationId));
  };

  const handleSync = async () => {
    try {
      await Promise.all(
        activeLocations.map((location) =>
          queryClient.invalidateQueries({
            queryKey: attendanceKeys.monitorSummary(location.id, 'day', today),
          }),
        ),
      );
      toast.success('Monitor sincronizado');
    } catch {
      toast.error('No se pudo sincronizar asistencia');
    }
  };

  return (
    <AsistenciaLocationHub
      theme={asistenciaTheme}
      subtitle={`${isLive ? 'Tiempo real' : 'Resumen del día'} · Polling cada 30s · Última sync: ${lastSyncLabel} · ${today}`}
      locations={locationSummaries}
      viewMode={viewMode}
      onViewModeChange={handleViewModeChange}
      onLocationSelect={handleLocationSelect}
      onSync={handleSync}
      live={isLive}
      loading={isLoading}
      errorMessage={queryError ? getErrorMessage(queryError) : undefined}
      emptyMessage="No hay sedes activas configuradas."
    />
  );
}
