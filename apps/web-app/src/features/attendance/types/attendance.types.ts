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
