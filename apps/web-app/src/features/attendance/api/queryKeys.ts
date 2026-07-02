import type {
  AttendanceComparisonFilters,
  AttendanceControlPanelFilters,
  AttendanceHistoryFilters,
  AttendanceMonitorPeriod,
} from '../types/attendance.types';

export const attendanceKeys = {
  all: ['attendance'] as const,
  history: () => [...attendanceKeys.all, 'history'] as const,
  historyList: (filters: AttendanceHistoryFilters) =>
    [...attendanceKeys.history(), filters] as const,
  active: (locationId: string) => [...attendanceKeys.all, 'active', locationId] as const,
  overtime: (userId: string, date?: string) =>
    [...attendanceKeys.all, 'overtime', userId, date ?? 'today'] as const,
  monitorSummary: (locationId: string, period: AttendanceMonitorPeriod, anchorDate: string) =>
    [...attendanceKeys.all, 'monitor-summary', locationId, period, anchorDate] as const,
  controlPanel: (filters: AttendanceControlPanelFilters) =>
    [...attendanceKeys.all, 'control-panel', filters] as const,
  comparison: (filters: AttendanceComparisonFilters) =>
    [...attendanceKeys.all, 'comparison', filters] as const,
};
