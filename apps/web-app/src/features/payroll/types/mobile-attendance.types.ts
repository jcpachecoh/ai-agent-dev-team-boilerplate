export type MobileAttendanceEventType = 'ENTRY' | 'EXIT';

export type MobileAttendanceStatus = 'VALID' | 'REJECTED' | 'PENDING';

export interface MobileAttendanceLog {
  id: string;
  employeeId: string;
  eventType: MobileAttendanceEventType;
  status: MobileAttendanceStatus;
  timestamp: string;
  workDate: string;
  distanceMeters: number | null;
  rejectionReason: string | null;
}

export interface MobileAttendanceConnection {
  edges: Array<{
    cursor: string;
    node: MobileAttendanceLog;
  }>;
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
}

export interface MarcacionesPorEmpleadoInput {
  employeeId: string;
  dateFrom: string;
  dateTo: string;
  status?: MobileAttendanceStatus | null;
  cursor?: string | null;
  take?: number;
}

export interface EmployeeMarcacionesFilters {
  dateFrom: string;
  dateTo: string;
  status?: MobileAttendanceStatus | null;
  take?: number;
}
