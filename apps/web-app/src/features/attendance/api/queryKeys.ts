import type { AttendanceHistoryFilters } from '../types/attendance.types';

export const attendanceKeys = {
  all: ['attendance'] as const,
  history: () => [...attendanceKeys.all, 'history'] as const,
  historyList: (filters: AttendanceHistoryFilters) =>
    [...attendanceKeys.history(), filters] as const,
  active: (locationId: string) => [...attendanceKeys.all, 'active', locationId] as const,
  overtime: (userId: string, date?: string) =>
    [...attendanceKeys.all, 'overtime', userId, date ?? 'today'] as const,
};
