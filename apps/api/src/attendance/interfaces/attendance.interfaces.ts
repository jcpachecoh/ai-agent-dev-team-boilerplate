import {
  AttendanceLog,
  AttendanceShift,
  AttendanceEventType,
  EmployeeDetails,
  Location,
  User,
} from '@prisma/client';

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
