import { AsistenciaMonitorPreview, type AsistenciaLocationTab, toast } from '@restopsiq/ui';
import { useQueries } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { useTheme } from '@/providers/ThemeProvider';
import { AttendanceApiError, getAttendanceOvertimeSummary } from '../api/attendance.client';
import { attendanceKeys } from '../api/queryKeys';
import { useAttendanceActiveQuery } from '../hooks/useAttendanceActiveQuery';
import { useAttendanceHistoryQuery } from '../hooks/useAttendanceHistoryQuery';
import {
  useRegisterAttendanceEntryMutation,
  useRegisterAttendanceExitMutation,
} from '../hooks/useAttendanceMutations';
import type {
  AttendanceEmployeeSummary,
  AttendanceHistoryItem,
  AttendanceOvertimeSummary,
} from '../types/attendance.types';

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
}

function formatOvertimeLabel(minutes: number): string {
  return `+${formatDuration(minutes)} ext.`;
}

function formatLastSyncLabel(date: Date | undefined): string {
  if (!date) return 'hace 1s';
  const diffSec = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  return `hace ${diffSec}s`;
}

function mapLocationTabs(history: AttendanceHistoryItem[]): AsistenciaLocationTab[] {
  const map = new Map<string, AsistenciaLocationTab>();
  for (const item of history) {
    const location = item.location;
    if (!location?.id || !location?.name) continue;
    if (map.has(location.id)) continue;

    const [name, city] = location.name.split(' - ');
    map.set(location.id, {
      id: location.id,
      name: name?.trim() ?? location.name,
      city: city?.trim() ?? location.city ?? '',
    });
  }
  return Array.from(map.values());
}

function getEmployeeDisplayName(employee?: AttendanceEmployeeSummary): string {
  if (employee?.name?.trim()) return employee.name;
  if (employee?.user?.email) return employee.user.email.split('@')[0] ?? 'Empleado';
  return 'Empleado';
}

function getTodayIsoDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function AttendanceMonitorScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const asistenciaTheme = theme === 'light' ? 'light' : 'dark';
  const [locationId, setLocationId] = useState<string>('');
  const today = useMemo(() => getTodayIsoDate(), []);

  const historyQuery = useAttendanceHistoryQuery({
    limit: 100,
    offset: 0,
    dateFrom: today,
    dateTo: today,
  });
  const locationTabs = useMemo(() => mapLocationTabs(historyQuery.data ?? []), [historyQuery.data]);

  useEffect(() => {
    if (!locationId && locationTabs.length > 0) {
      setLocationId(locationTabs[0]?.id ?? '');
    }
  }, [locationId, locationTabs]);

  const activeQuery = useAttendanceActiveQuery(locationId);

  const selectedLocationHistory = useMemo(
    () => (historyQuery.data ?? []).filter((item) => item.locationId === locationId),
    [historyQuery.data, locationId],
  );

  const latestEventByEmployee = useMemo(() => {
    const sorted = [...selectedLocationHistory].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    const map = new Map<string, AttendanceHistoryItem>();
    for (const event of sorted) {
      if (!map.has(event.employeeId)) {
        map.set(event.employeeId, event);
      }
    }
    return Array.from(map.values());
  }, [selectedLocationHistory]);

  const overtimeQueries = useQueries({
    queries: latestEventByEmployee
      .map((event) => event.employee?.userId)
      .filter((id): id is string => Boolean(id))
      .map((userId) => ({
        queryKey: attendanceKeys.overtime(userId),
        queryFn: () => getAttendanceOvertimeSummary(userId),
        refetchInterval: 30_000,
      })),
  });

  const overtimeByUserId = useMemo(() => {
    const map = new Map<string, AttendanceOvertimeSummary>();
    overtimeQueries.forEach((query) => {
      const data = query.data;
      if (data?.userId) map.set(data.userId, data);
    });
    return map;
  }, [overtimeQueries]);

  const activeUserIds = useMemo(() => {
    const set = new Set<string>();
    (activeQuery.data ?? []).forEach((item) => set.add(item.userId));
    return set;
  }, [activeQuery.data]);

  const employees = useMemo(
    () =>
      latestEventByEmployee.map((event) => {
        const userId = event.employee?.userId ?? '';
        const overtime = overtimeByUserId.get(userId);
        const isOnShift = userId ? activeUserIds.has(userId) : event.eventType === 'ENTRY';
        const totalMinutes = overtime?.totalMinutes ?? 0;
        const overtimeMinutes = overtime?.overtimeMinutes ?? 0;
        return {
          id: event.employeeId,
          name: getEmployeeDisplayName(event.employee),
          role: event.employee?.position ?? 'Sin cargo',
          status: isOnShift ? 'on-shift' : 'absent',
          entryLabel: isOnShift
            ? `Entrada ${new Date(event.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`
            : undefined,
          workedTime: totalMinutes > 0 ? formatDuration(totalMinutes) : undefined,
          overtimeLabel: overtimeMinutes > 0 ? formatOvertimeLabel(overtimeMinutes) : undefined,
          progressPercent:
            totalMinutes > 0 ? Math.min(100, Math.round((totalMinutes / 480) * 100)) : 0,
          progressTone: overtimeMinutes > 0 ? 'amber' : 'accent',
          highlight: overtimeMinutes > 0 ? 'overtime' : 'none',
        } as const;
      }),
    [latestEventByEmployee, overtimeByUserId, activeUserIds],
  );

  const metrics = useMemo(() => {
    const total = employees.length;
    const onShift = employees.filter((e) => e.status === 'on-shift').length;
    const absent = Math.max(0, total - onShift);
    const overtime = employees.filter((e) => e.overtimeLabel).length;
    return {
      total,
      onShift,
      absent,
      offSchedule: 0,
      overtime,
      legalAlerts: 0,
    };
  }, [employees]);

  const selectedLocation = locationTabs.find((tab) => tab.id === locationId);
  const locationSummary = `${(selectedLocation?.name ?? 'SEDE').toUpperCase()} · ${metrics.total} EMPLEADOS ACTIVOS`;

  const entryMutation = useRegisterAttendanceEntryMutation();
  const exitMutation = useRegisterAttendanceExitMutation();

  const handleSync = async () => {
    try {
      await Promise.all([historyQuery.refetch(), activeQuery.refetch()]);
      toast.success('Monitor sincronizado');
    } catch {
      toast.error('No se pudo sincronizar asistencia');
    }
  };

  // Baseline implementation of POST entry/exit in this page context.
  // If there is no active employee in selected location we do not fire requests.
  const registerQuickEntry = async () => {
    const candidate = latestEventByEmployee.find((event) => {
      const userId = event.employee?.userId;
      return userId && !activeUserIds.has(userId);
    });
    if (!candidate?.employee?.userId || !locationId) return;
    try {
      await entryMutation.mutateAsync({ userId: candidate.employee.userId, locationId });
      toast.success('Entrada registrada');
    } catch (error) {
      const message =
        error instanceof AttendanceApiError ? error.message : 'No se pudo registrar entrada';
      toast.error(message);
    }
  };

  const registerQuickExit = async () => {
    const candidate = activeQuery.data?.[0];
    if (!candidate || !locationId) return;
    try {
      await exitMutation.mutateAsync({ userId: candidate.userId, locationId });
      toast.success('Salida registrada');
    } catch (error) {
      const message =
        error instanceof AttendanceApiError ? error.message : 'No se pudo registrar salida';
      toast.error(message);
    }
  };

  return (
    <AsistenciaMonitorPreview
      theme={asistenciaTheme}
      locationId={locationId}
      onLocationChange={setLocationId}
      locations={locationTabs}
      employees={employees}
      metrics={metrics}
      locationSummary={locationSummary}
      lastSyncLabel={formatLastSyncLabel(
        historyQuery.dataUpdatedAt ? new Date(historyQuery.dataUpdatedAt) : undefined,
      )}
      onSync={handleSync}
      onQuickEntry={registerQuickEntry}
      onQuickExit={registerQuickExit}
    />
  );
}
