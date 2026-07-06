import type {
  AttendanceCollaboratorsFilters,
  AttendanceComparisonFilters,
  AttendanceControlPanelFilters,
  AttendanceHistoryFilters,
  AttendanceMonitorPeriod,
} from '../types/attendance.types';
import type { WeeklyAssignmentsQuery } from '../types/turno-assignments.types';
import type { TurnosListQuery } from '../types/turnos.types';

export const attendanceKeys = {
  all: ['attendance'] as const,
  history: () => [...attendanceKeys.all, 'history'] as const,
  historyList: (filters: AttendanceHistoryFilters) =>
    [...attendanceKeys.history(), filters] as const,
  active: (locationId: string) => [...attendanceKeys.all, 'active', locationId] as const,
  card: (userId: string, dateFrom: string, dateTo: string) =>
    [...attendanceKeys.all, 'card', userId, dateFrom, dateTo] as const,
  overtime: (userId: string, date?: string) =>
    [...attendanceKeys.all, 'overtime', userId, date ?? 'today'] as const,
  monitorSummary: (locationId: string, period: AttendanceMonitorPeriod, anchorDate: string) =>
    [...attendanceKeys.all, 'monitor-summary', locationId, period, anchorDate] as const,
  controlPanel: (filters: AttendanceControlPanelFilters) =>
    [...attendanceKeys.all, 'control-panel', filters] as const,
  comparison: (filters: AttendanceComparisonFilters) =>
    [...attendanceKeys.all, 'comparison', filters] as const,
  collaborators: (filters: AttendanceCollaboratorsFilters) =>
    [...attendanceKeys.all, 'collaborators', filters] as const,
  collaboratorSupervisors: () => [...attendanceKeys.all, 'collaborator-supervisors'] as const,
  collaboratorAudit: (employeeDetailsId: string) =>
    [...attendanceKeys.all, 'collaborator-audit', employeeDetailsId] as const,
  turnos: {
    all: () => [...attendanceKeys.all, 'turnos'] as const,
    list: (filters: TurnosListQuery) => [...attendanceKeys.turnos.all(), 'list', filters] as const,
  },
  turnoAssignments: {
    all: () => [...attendanceKeys.all, 'turno-assignments'] as const,
    weekly: (filters: WeeklyAssignmentsQuery) =>
      [...attendanceKeys.turnoAssignments.all(), 'weekly', filters] as const,
  },
};
