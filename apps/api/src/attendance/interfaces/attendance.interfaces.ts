import {
  AttendanceLog,
  AttendanceLogSource,
  AttendanceObservation,
  AttendanceShift,
  AttendanceEventType,
  AttendanceValidationStatus,
  EmployeeDetails,
  LaborClassification,
  Location,
  User,
} from '@prisma/client';

export type AttendanceClasificacion = 'administrativo' | 'operaciones' | 'todos';

export type LaborClassificationCounts = Record<Lowercase<LaborClassification>, number>;

// ── Composed types ──────────────────────────────────────────────────────────

export type EmployeeWithUser = EmployeeDetails & { user: User };

export type AttendanceLogFull = AttendanceLog & {
  employee: EmployeeWithUser;
  location: Location;
  createdBy?: { email: string } | null;
};

export type AttendanceLogWithEmployee = AttendanceLog & { employee: EmployeeDetails };

export type AttendanceObservationFull = AttendanceObservation & {
  createdBy: { email: string } | null;
  updatedBy: { email: string } | null;
};

// ── Input shapes ────────────────────────────────────────────────────────────

export interface KioskAuthInput {
  cedula: string;
  pin: string;
  locationId: string;
}

export interface RegisterEntryInput {
  userId: string;
  locationId: string;
  notes?: string;
}

export interface RegisterExitInput {
  userId: string;
  locationId: string;
  notes?: string;
}

export interface ListHistoryInput {
  userId?: string;
  locationId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

// ── Result shapes ───────────────────────────────────────────────────────────

export interface KioskAuthResult {
  userId: string;
  fullName: string;
  locationId: string;
  employeeId: string;
  accessToken: string;
  refreshToken: string;
}

export interface EntryResult {
  logId: string;
  employeeId: string;
  userId: string;
  workDate: Date;
  timestamp: Date;
  shift: AttendanceShift | null;
}

export interface ExitResult {
  logId: string;
  employeeId: string;
  userId: string;
  workDate: Date;
  timestamp: Date;
  totalMinutes: number;
  overtimeMinutes: number;
  isNocturno: boolean;
}

export interface WorkPair {
  entryId: string;
  exitId?: string;
  entryTimestamp: Date;
  exitTimestamp?: Date;
  durationMinutes: number;
}

export interface OvertimeSummary {
  employeeId: string;
  userId: string;
  workDate: string;
  totalMinutes: number;
  overtimeMinutes: number;
  isNocturno: boolean;
  pairs: WorkPair[];
}

export interface ActiveAttendanceEntry {
  logId: string;
  employeeId: string;
  userId: string;
  fullName: string;
  locationId: string;
  entryTimestamp: Date;
  workDate: Date;
  shift: AttendanceShift | null;
}

export type AttendanceMonitorPeriod = 'day' | 'week' | 'month' | 'year';

export interface AttendanceMonitorSummaryInput {
  locationId: string;
  period: AttendanceMonitorPeriod;
  anchorDate: string;
  clasificacion?: AttendanceClasificacion;
}

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
  clasificacion?: AttendanceClasificacion;
  clasificacionCounts: LaborClassificationCounts;
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

// ── Repository contract ─────────────────────────────────────────────────────

export interface CreateAttendanceLogData {
  tenantId: string;
  employeeId: string;
  locationId: string;
  eventType: AttendanceEventType;
  shift?: AttendanceShift | null;
  workDate: Date;
  notes?: string | null;
}

export interface AttendanceHistoryFilters {
  tenantId: string;
  employeeId?: string;
  locationId?: string;
  /** Sedes permitidas cuando el actor está acotado por rol (SUPERVISOR/MANAGER) y no pidió una sede puntual. */
  allowedLocationIds?: string[] | null;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

// ── OS-551 — Tarjeta de Asistencia (marcaciones manuales + observaciones) ──

/** Subconjunto del JwtPayload necesario para scoping de sede en escritura. */
export interface AttendanceActingUser {
  sub: string;
  roleCode: string;
  locationId?: string | null;
}

export interface AttendanceCardQuery {
  dateFrom: string;
  dateTo: string;
}

export interface AttendanceCardResult {
  logs: AttendanceLogFull[];
  observations: AttendanceObservationFull[];
  daySummaries: AttendanceCardDaySummary[];
}

export interface AttendanceCardDaySummary {
  workDate: string;
  targetMinutes: number;
  targetHours: string;
  ordinaryMinutes: number;
  unworkedMinutes: number;
  overtimeMinutes: number;
  resolvedKind: 'ASSIGNED' | 'REST' | 'NONE';
  shiftName: string | null;
  shiftRange: string | null;
}

export interface UpsertObservationInput {
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

export interface CreateManualLogData {
  tenantId: string;
  employeeId: string;
  locationId: string;
  eventType: AttendanceEventType;
  workDate: Date;
  timestamp: Date;
  createdByUserId: string;
  manualReason: string;
  manualParentLogId?: string | null;
}

/** ASIS-UNI — entrada unificada para toda marcación (app móvil, manual, legacy). */
export interface RegisterEventInput {
  tenantId: string;
  employeeId: string;
  locationId: string;
  eventType: AttendanceEventType;
  source: AttendanceLogSource;
  timestamp: Date;
  workDate?: Date;
  shift?: AttendanceShift | null;
  notes?: string | null;
  createdByUserId?: string | null;
  manualReason?: string | null;
  manualParentLogId?: string | null;
  clientLatitude?: number | null;
  clientLongitude?: number | null;
  storageObjectId?: string | null;
  photoUrl?: string | null;
  facialMatchScore?: number | null;
  facialMatchResult?: string | null;
}

export interface RegisterEventLogData extends RegisterEventInput {
  workDate: Date;
  shift?: AttendanceShift | null;
  validationStatus?: AttendanceValidationStatus | null;
  distanceMeters?: number | null;
  radiusMeters?: number | null;
  rejectionReason?: string | null;
}

export interface IAttendanceRepository {
  findUserByCedula(cedula: string, tenantId: string): Promise<User | null>;
  findEmployeeByUserAndLocation(
    userId: string,
    locationId: string,
    tenantId: string,
  ): Promise<EmployeeWithUser | null>;
  findOpenEntry(employeeId: string): Promise<AttendanceLog | null>;
  findAllForDay(employeeId: string, workDate: Date): Promise<AttendanceLog[]>;
  create(data: CreateAttendanceLogData): Promise<AttendanceLog>;
  listHistory(filters: AttendanceHistoryFilters): Promise<AttendanceLogFull[]>;
  listActiveAtLocation(locationId: string, tenantId: string): Promise<AttendanceLogFull[]>;
  findById(id: string, tenantId: string): Promise<AttendanceLogFull | null>;
  findEmployeeByUserId(userId: string, tenantId: string): Promise<EmployeeWithUser | null>;
  findLocationById(locationId: string, tenantId: string): Promise<Location | null>;
  findEmployeesAtLocation(
    locationId: string,
    tenantId: string,
    laborClassifications?: LaborClassification[],
  ): Promise<EmployeeWithUser[]>;
  countByLaborClassification(
    locationId: string,
    tenantId: string,
  ): Promise<LaborClassificationCounts>;
  findTenantLabel(tenantId: string): Promise<string>;
  listActiveLocations(tenantId: string, locationIds?: string[]): Promise<Location[]>;
  listControlPanelLogs(
    filters: AttendanceHistoryFilters & {
      locationIds?: string[];
      laborClassifications?: LaborClassification[];
    },
  ): Promise<AttendanceLogFull[]>;
  findLogById(id: string, tenantId: string): Promise<AttendanceLogWithEmployee | null>;
  findDuplicateEvent(params: {
    employeeId: string;
    eventType: AttendanceEventType;
    source: AttendanceLogSource;
    timestamp: Date;
    windowMs: number;
  }): Promise<AttendanceLog | null>;
  createEventLog(data: RegisterEventLogData): Promise<AttendanceLog>;
  createManualLog(data: CreateManualLogData): Promise<AttendanceLog>;
  deleteManualLog(id: string, tenantId: string): Promise<AttendanceLog>;
  listObservationsInRange(
    tenantId: string,
    employeeId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<AttendanceObservationFull[]>;
  findObservation(
    tenantId: string,
    employeeId: string,
    workDate: Date,
  ): Promise<AttendanceObservationFull | null>;
  upsertObservation(
    tenantId: string,
    employeeId: string,
    workDate: Date,
    note: string,
    actorUserId: string,
  ): Promise<AttendanceObservationFull>;
}

export interface ControlPanelQuery {
  anchorDate?: string;
  period?: 'day' | 'week' | 'month';
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

export interface AlertDismissalRecord {
  id: string;
  tenantId: string;
  userId: string;
  alertKey: string;
  dismissedAt: Date;
  createdAt: Date;
}

export interface ControlPanelTimelineRow {
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

export interface ControlPanelAlert {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  generatedAt: string;
  employeeId?: string;
  employeeName?: string;
}

export interface ControlPanelSummary {
  anchorDate: string;
  period: 'day' | 'week' | 'month';
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
    items: ControlPanelTimelineRow[];
    total: number;
    page: number;
    pageSize: number;
  };
  alerts: ControlPanelAlert[];
  filters: {
    areas: string[];
    contractTypes: string[];
    locations: Array<{ id: string; name: string }>;
  };
}

export interface AttendanceComparisonQuery {
  anchorDate?: string;
  period?: 'day' | 'week' | 'month';
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
  period: 'day' | 'week' | 'month';
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

// ── Service contract ────────────────────────────────────────────────────────

export interface IAttendanceService {
  kioskAuth(dto: KioskAuthInput, tenantId: string): Promise<KioskAuthResult>;
  registerEntry(dto: RegisterEntryInput, tenantId: string): Promise<EntryResult>;
  registerExit(dto: RegisterExitInput, tenantId: string): Promise<ExitResult>;
  registerEvent(input: RegisterEventInput): Promise<AttendanceLog>;
  listHistory(
    query: ListHistoryInput,
    tenantId: string,
    actor: AttendanceActingUser,
  ): Promise<AttendanceLogFull[]>;
  listActive(
    locationId: string,
    tenantId: string,
    actor: AttendanceActingUser,
  ): Promise<ActiveAttendanceEntry[]>;
  getOvertimeSummary(
    userId: string,
    tenantId: string,
    actor: AttendanceActingUser,
    date?: Date,
  ): Promise<OvertimeSummary>;
}
