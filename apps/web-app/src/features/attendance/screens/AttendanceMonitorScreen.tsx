import {
  AsistenciaLocationHub,
  type AsistenciaLocationSummary,
  type AsistenciaViewMode,
  toast,
} from '@restopsiq/ui';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useLocations } from '@/features/sedes/hooks/useLocations';
import { useTheme } from '@/providers/ThemeProvider';
import { getErrorMessage } from '@/lib/graphql-client';

import { getAttendanceMonitorSummary } from '../api/attendance.client';
import { attendanceKeys } from '../api/queryKeys';
import { buildLocationSummary, formatLastSyncLabel } from '../mappers/monitor.mappers';
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

  const locationsQuery = useLocations();
  const activeLocations = useMemo(
    () => (locationsQuery.data ?? []).filter((location) => location.isActive),
    [locationsQuery.data],
  );

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
      const summary = summaryQueries[index]?.data;
      if (!summary) {
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
      return buildLocationSummary(location, summary);
    });
  }, [activeLocations, summaryQueries]);

  const isLoading = locationsQuery.isPending || summaryQueries.some((query) => query.isPending);
  const queryError = locationsQuery.error ?? summaryQueries.find((query) => query.error)?.error;
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
    navigate(`/payroll/attendance/${locationId}`);
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
