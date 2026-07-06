export type AttendanceEventType = 'ENTRY' | 'EXIT';

export type AttendanceShift = 'MORNING' | 'AFTERNOON' | 'NIGHT';

export interface AttendanceHistoryFilters {
  userId?: string;
  locationId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface AttendanceEmployeeSummary {
  id: string;
  userId: string;
  name?: string;
  position?: string;
  user?: {
    email?: string;
    cedula?: string;
  };
}

export interface AttendanceLocationSummary {
  id: string;
  name: string;
  city?: string;
}

export type AttendanceLogSource = 'APP_MOVIL' | 'MANUAL' | 'DEVICE';

export interface AttendanceHistoryItem {
  id: string;
  employeeId: string;
  locationId: string;
  eventType: AttendanceEventType;
  shift?: AttendanceShift | null;
  timestamp: string;
  workDate: string;
  employee?: AttendanceEmployeeSummary;
  location?: AttendanceLocationSummary;
  source?: AttendanceLogSource;
  manualReason?: string | null;
  createdByUserId?: string | null;
  manualParentLogId?: string | null;
  createdBy?: { email: string } | null;
  createdAt?: string;
}

// OS-551 — Tarjeta de Asistencia

export interface AttendanceObservationDto {
  id: string;
  employeeId: string;
  workDate: string;
  note: string;
  createdByUserId?: string | null;
  updatedByUserId?: string | null;
  createdBy?: { email: string } | null;
  updatedBy?: { email: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceCardResult {
  logs: AttendanceHistoryItem[];
  observations: AttendanceObservationDto[];
}

export interface UpsertAttendanceObservationInput {
  workDate: string;
  note: string;
}

export interface CreateManualMarkingInput {
  workDate: string;
  eventType: AttendanceEventType;
  timestamp: string;
  reason: string;
  parentLogId?: string;
}

export interface AttendanceActiveEntry {
  logId: string;
  employeeId: string;
  userId: string;
  fullName: string;
  locationId: string;
  entryTimestamp: string;
  workDate: string;
  shift?: AttendanceShift | null;
}

export interface AttendanceOvertimePair {
  entryId: string;
  exitId?: string;
  entryTimestamp: string;
  exitTimestamp?: string;
  durationMinutes: number;
}

export interface AttendanceOvertimeSummary {
  employeeId: string;
  userId: string;
  workDate: string;
  totalMinutes: number;
  overtimeMinutes: number;
  isNocturno: boolean;
  pairs: AttendanceOvertimePair[];
}

export interface AttendanceEntryInput {
  userId: string;
  locationId: string;
  notes?: string;
}

export interface AttendanceExitInput {
  userId: string;
  locationId: string;
  notes?: string;
}

export interface AttendanceEntryResult {
  logId: string;
  employeeId: string;
  userId: string;
  workDate: string;
  timestamp: string;
  shift?: AttendanceShift | null;
}

export interface AttendanceExitResult {
  logId: string;
  employeeId: string;
  userId: string;
  workDate: string;
  timestamp: string;
  totalMinutes: number;
  overtimeMinutes: number;
  isNocturno: boolean;
}

export type AttendanceMonitorPeriod = 'day' | 'week' | 'month' | 'year';

export interface AttendanceMonitorEmployee {
  employeeId: string;
  userId: string;
  name: string;
  role: string;
  status: 'on-shift' | 'absent' | 'late' | 'overtime';
  entryLabel?: string;
  workedMinutes?: number;
  overtimeMinutes?: number;
  lateMinutes?: number;
  daysPresent?: number;
  lastEntryAt?: string;
}

export interface AttendanceMonitorSummary {
  locationId: string;
  period: AttendanceMonitorPeriod;
  anchorDate: string;
  dateFrom: string;
  dateTo: string;
  isLive: boolean;
  metrics: {
    total: number;
    onShift: number;
    absent: number;
    lateArrivals: number;
    overtime: number;
    offSchedule: number;
    legalAlerts: number;
  };
  employees: {
    onShift: AttendanceMonitorEmployee[];
    absent: AttendanceMonitorEmployee[];
    late: AttendanceMonitorEmployee[];
    overtime: AttendanceMonitorEmployee[];
  };
}

export interface AttendanceMonitorSummaryFilters {
  period: AttendanceMonitorPeriod;
  anchorDate: string;
}

export type AttendanceControlPanelPeriod = 'day' | 'week' | 'month';

export type AttendanceClasificacion = 'administrativo' | 'operaciones' | 'todos';

export interface AttendanceComparisonFilters {
  anchorDate?: string;
  period?: AttendanceControlPanelPeriod;
  locationId?: string;
  area?: string;
  contractType?: string;
  search?: string;
}

export interface AttendanceComparisonPoint {
  label: string;
  bucketKey: string;
  current: number;
  previous: number;
}

export interface AttendanceComparisonSummary {
  period: AttendanceControlPanelPeriod;
  anchorDate: string;
  dateFrom: string;
  dateTo: string;
  previousDateFrom: string;
  previousDateTo: string;
  series: {
    current: { key: string; name: string };
    previous: { key: string; name: string };
  };
  points: AttendanceComparisonPoint[];
}

export interface AttendanceControlPanelFilters {
  anchorDate?: string;
  period?: AttendanceControlPanelPeriod;
  locationId?: string;
  area?: string;
  contractType?: string;
  clasificacion?: AttendanceClasificacion;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface AttendanceControlPanelTimelineRow {
  employeeId: string;
  userId: string;
  photoUrl: string | null;
  documentNumber: string;
  primerApellido: string | null;
  nombres: string | null;
  especialidad: string;
  area: string;
  contrato: string;
  locationId: string;
  locationName: string;
  lastRecordAt: string;
  lastEventType: AttendanceEventType;
  source: AttendanceLogSource;
  latitude: number | null;
  longitude: number | null;
  hasGeo: boolean;
  isOutOfGeofence: boolean;
}

export interface AttendanceControlPanelAlert {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  generatedAt: string;
  employeeId?: string;
  employeeName?: string;
}

export interface AttendanceControlPanelSummary {
  anchorDate: string;
  period: AttendanceControlPanelPeriod;
  dateFrom: string;
  dateTo: string;
  tenantName: string;
  isLive: boolean;
  clasificacion?: AttendanceClasificacion;
  metrics: {
    workingNow: number;
    attendanceToday: number;
    tenantAttendanceToday: number;
    overtimeHoursMonth: number;
  };
  timeline: {
    items: AttendanceControlPanelTimelineRow[];
    total: number;
    page: number;
    pageSize: number;
  };
  alerts: AttendanceControlPanelAlert[];
  filters: {
    areas: string[];
    contractTypes: string[];
    locations: Array<{ id: string; name: string }>;
  };
}

export interface DismissAlertResult {
  alertKey: string;
  dismissedAt: string;
}

// OS-550 — Colaboradores de Asistencia

export type AttendanceCollaboratorLaborClassification = 'COCINA' | 'SERVICIO' | 'ADMINISTRATIVO';

export interface AttendanceCollaboratorSupervisor {
  id: string;
  name: string;
  email: string | null;
}

export interface AttendanceCollaboratorTodayShift {
  type: 'ASSIGNED' | 'REST' | 'BASE';
  turno: {
    id: string;
    nombre: string;
    sigla: string;
    horaInicio: string;
    horaFin: string;
    jornada: string;
  } | null;
}

export interface AttendanceCollaborator {
  id: string;
  userId: string;
  locationId: string;
  locationName: string | null;
  name: string;
  primerApellido: string | null;
  segundoApellido: string | null;
  cedula: string;
  email: string;
  positionId: string | null;
  positionName: string;
  area: string;
  contractType: string;
  laborClassification: AttendanceCollaboratorLaborClassification;
  isActive: boolean;
  supervisors: AttendanceCollaboratorSupervisor[];
  todayShift: AttendanceCollaboratorTodayShift;
  portalWorkerEnabled: boolean;
}

export interface AttendanceCollaboratorsFilters {
  search?: string;
  positionId?: string;
  contractType?: string;
  area?: string;
  locationId?: string;
  supervisorUserId?: string;
  laborClassification?: 'administrativo' | 'operaciones';
  status?: 'all' | 'active' | 'inactive';
  sortBy?: 'employee' | 'role' | 'hireDate';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface AttendanceCollaboratorsResult {
  items: AttendanceCollaborator[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  summary: {
    total: number;
    active: number;
    inactive: number;
  };
}

export interface AttendanceCollaboratorSupervisorOption {
  id: string;
  name: string;
  email: string | null;
}

// OS-550 follow-up — Portal trabajador, exportaciones e historial mínimo

export type AttendanceCollaboratorExportFormat = 'excel' | 'pdf';

export interface AttendanceCollaboratorEmailExportInput {
  recipients: string[];
  format: AttendanceCollaboratorExportFormat;
  filters: AttendanceCollaboratorsFilters;
}

export interface AttendanceCollaboratorAuditEntry {
  id: string;
  action: string;
  actorName: string | null;
  createdAt: string;
  oldValue: unknown;
  newValue: unknown;
}
