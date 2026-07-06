import {
  AttendanceLog,
  AttendanceShift,
  AttendanceEventType,
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
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
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
  listMobileLogsForDay(
    tenantId: string,
    workDate: Date,
    locationIds?: string[],
    laborClassifications?: LaborClassification[],
  ): Promise<
    Array<{
      id: string;
      employeeId: string;
      locationId: string;
      status: string;
      timestamp: Date;
      clientLatitude: number;
      clientLongitude: number;
      distanceMeters: number | null;
      rejectionReason: string | null;
      employee: EmployeeWithUser;
      location: Location;
    }>
  >;
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
  listHistory(query: ListHistoryInput, tenantId: string): Promise<AttendanceLogFull[]>;
  listActive(locationId: string, tenantId: string): Promise<ActiveAttendanceEntry[]>;
  getOvertimeSummary(userId: string, tenantId: string, date?: Date): Promise<OvertimeSummary>;
}
