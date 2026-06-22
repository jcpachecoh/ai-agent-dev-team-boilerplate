import {
  AsistenciaPeriodFilter,
  AsistenciaSedeDetail,
  type AsistenciaMonitorPeriod,
  type AsistenciaViewMode,
  toast,
} from '@restopsiq/ui';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useLocation } from '@/features/sedes/hooks/useLocations';
import { useTheme } from '@/providers/ThemeProvider';
import { AttendanceApiError } from '../api/attendance.client';
import {
  useRegisterAttendanceEntryMutation,
  useRegisterAttendanceExitMutation,
} from '../hooks/useAttendanceMutations';
import { useAttendanceMonitorSummary } from '../hooks/useAttendanceMonitorSummary';
import {
  formatLastSyncLabel,
  formatMonitorPeriodLabel,
  mapMonitorSummaryToEmployees,
  mapMonitorSummaryToMetrics,
} from '../mappers/monitor.mappers';
import type { AttendanceMonitorPeriod } from '../types/attendance.types';
import {
  getStoredEmployeeViewMode,
  getTodayIsoDateBogota,
  setStoredEmployeeViewMode,
} from '../utils/attendance-storage';
import { getErrorMessage } from '@/lib/graphql-client';

export function AttendanceLocationDetailScreen(): React.JSX.Element {
  const { locationId = '' } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const asistenciaTheme = theme === 'light' ? 'light' : 'dark';

  const [period, setPeriod] = useState<AttendanceMonitorPeriod>('day');
  const [anchorDate, setAnchorDate] = useState(() => getTodayIsoDateBogota());
  const [viewMode, setViewMode] = useState<AsistenciaViewMode>(getStoredEmployeeViewMode);

  const locationQuery = useLocation(locationId);
  const summaryQuery = useAttendanceMonitorSummary({
    locationId,
    period,
    anchorDate,
    refetchInterval: (data) => (data?.isLive ? 30_000 : false),
  });

  const summary = summaryQuery.data;
  const metrics = useMemo(
    () => (summary ? mapMonitorSummaryToMetrics(summary) : undefined),
    [summary],
  );
  const employees = useMemo(
    () => (summary ? mapMonitorSummaryToEmployees(summary) : undefined),
    [summary],
  );

  const entryMutation = useRegisterAttendanceEntryMutation();
  const exitMutation = useRegisterAttendanceExitMutation();

  const locationName = locationQuery.data?.name ?? 'Sede';
  const locationSummary = summary
    ? `${locationName.toUpperCase()} · ${summary.metrics.total} EMPLEADOS`
    : `${locationName.toUpperCase()}`;

  const handleViewModeChange = (mode: AsistenciaViewMode) => {
    setViewMode(mode);
    setStoredEmployeeViewMode(mode);
  };

  const handlePeriodChange = (nextPeriod: AsistenciaMonitorPeriod) => {
    setPeriod(nextPeriod as AttendanceMonitorPeriod);
  };

  const handleSync = async () => {
    try {
      await summaryQuery.refetch();
      toast.success('Monitor sincronizado');
    } catch {
      toast.error('No se pudo sincronizar asistencia');
    }
  };

  const registerQuickEntry = async () => {
    const candidate = summary?.employees.absent[0] ?? summary?.employees.onShift[0];
    if (!candidate?.userId || !locationId) return;
    try {
      await entryMutation.mutateAsync({ userId: candidate.userId, locationId });
      toast.success('Entrada registrada');
      await summaryQuery.refetch();
    } catch (error) {
      const message =
        error instanceof AttendanceApiError ? error.message : 'No se pudo registrar entrada';
      toast.error(message);
    }
  };

  const registerQuickExit = async () => {
    const candidate = summary?.employees.onShift[0];
    if (!candidate?.userId || !locationId) return;
    try {
      await exitMutation.mutateAsync({ userId: candidate.userId, locationId });
      toast.success('Salida registrada');
      await summaryQuery.refetch();
    } catch (error) {
      const message =
        error instanceof AttendanceApiError ? error.message : 'No se pudo registrar salida';
      toast.error(message);
    }
  };

  const notFound =
    summaryQuery.isError &&
    summaryQuery.error instanceof AttendanceApiError &&
    summaryQuery.error.status === 404;

  return (
    <AsistenciaSedeDetail
      theme={asistenciaTheme}
      title={locationName}
      subtitle="Detalle de asistencia por sede"
      periodRangeLabel={summary ? formatMonitorPeriodLabel(summary) : undefined}
      locationSummary={locationSummary}
      lastSyncLabel={formatLastSyncLabel(
        summaryQuery.dataUpdatedAt ? new Date(summaryQuery.dataUpdatedAt) : undefined,
      )}
      metrics={metrics}
      employees={employees}
      viewMode={viewMode}
      onViewModeChange={handleViewModeChange}
      onBack={() => navigate('/payroll/attendance')}
      onSync={handleSync}
      onQuickEntry={registerQuickEntry}
      onQuickExit={registerQuickExit}
      showQuickActions={summary?.isLive ?? false}
      live={summary?.isLive ?? false}
      loading={summaryQuery.isPending || locationQuery.isPending}
      errorMessage={
        notFound
          ? 'Sede no encontrada.'
          : summaryQuery.isError
            ? getErrorMessage(summaryQuery.error)
            : undefined
      }
      emptyMessage={
        summary && summary.metrics.total === 0
          ? 'No hay empleados asignados a esta sede.'
          : undefined
      }
      periodFilter={
        <AsistenciaPeriodFilter
          theme={asistenciaTheme}
          period={period as AsistenciaMonitorPeriod}
          anchorDate={anchorDate}
          onPeriodChange={handlePeriodChange}
          onAnchorDateChange={setAnchorDate}
        />
      }
    />
  );
}
