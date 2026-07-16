export type AssignmentSource = 'TURNO_ASIGNADO' | 'MARCACION_ASISTENCIA' | 'MANUAL';

export interface EmployeeCalendarDay {
  date: string;
  locationId: string | null;
  locationName: string | null;
  source: AssignmentSource | null;
  isPending: boolean;
}

export interface PendingAssignment {
  employeeId: string;
  employeeName: string;
  date: string;
  suggestedLocationId: string | null;
}

export interface ManualAssignment {
  id: string;
  employeeId: string;
  date: string;
  locationId: string;
  shiftId: string | null;
  source: AssignmentSource;
}

export interface ListAssignmentsRangeQuery {
  from: string;
  to: string;
}
