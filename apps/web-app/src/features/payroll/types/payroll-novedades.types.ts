export type NovedadType =
  | 'AUSENCIA_INJUSTIFICADA'
  | 'LICENCIA_LUTO'
  | 'LICENCIA_PATERNIDAD'
  | 'LICENCIA_MATERNIDAD'
  | 'LICENCIA_NO_REMUNERADA'
  | 'PERMISO_REMUNERADO'
  | 'CALAMIDAD_DOMESTICA'
  | 'DIA_FAMILIA';

export type NovedadRequestSource = 'EMPLEADO' | 'RRHH';

export type NovedadStatus =
  | 'SOLICITADA'
  | 'PENDIENTE_SUPERVISOR'
  | 'PENDIENTE_RRHH'
  | 'APROBADA'
  | 'RECHAZADA';

export interface PayrollNovedadRecord {
  id: string;
  employeeId: string;
  type: NovedadType;
  startDate: string;
  endDate: string;
  isPaid: boolean;
  linkedLeaveId?: string | null;
  supportStorageObjectId?: string | null;
  notes?: string | null;
  requestedBy: NovedadRequestSource;
  status: NovedadStatus;
  supervisorApproverId?: string | null;
  supervisorDecisionAt?: string | null;
  supervisorComment?: string | null;
  rrhhApproverId?: string | null;
  rrhhDecisionAt?: string | null;
  rejectionReason?: string | null;
  overlapWarningAck: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollNovedadSummary extends PayrollNovedadRecord {
  employeeName: string;
  locationId?: string | null;
  locationName?: string | null;
}

export interface ListPayrollNovedadesFilters {
  employeeId?: string;
  locationId?: string;
  type?: NovedadType;
  startDateFrom?: string;
  startDateTo?: string;
  supervisorInbox?: boolean;
  rrhhInbox?: boolean;
  cursor?: string;
  take?: number;
}

export interface ListMyPayrollNovedadesFilters {
  type?: NovedadType;
  startDateFrom?: string;
  startDateTo?: string;
  cursor?: string;
  take?: number;
}

export interface SubmitPayrollNovedadInput {
  employeeId: string;
  type: NovedadType;
  startDate: string;
  endDate: string;
  isPaid?: boolean;
  notes?: string;
  supportStorageObjectId?: string;
  requestedBy: NovedadRequestSource;
  overlapWarningAck?: boolean;
  autoApprove?: boolean;
}

export interface SubmitPayrollNovedadResult {
  novedad: PayrollNovedadRecord;
  warnings?: string[];
}

export interface RejectPayrollNovedadInput {
  rejectionReason: string;
  comment?: string;
}

export interface NovedadTypeConfig {
  id: string;
  type: NovedadType;
  requiresSupervisorApproval: boolean;
  requiresSupportDocument: boolean;
  isPaidDefault: boolean;
}

export const NOVEDAD_TYPE_LABELS: Record<NovedadType, string> = {
  AUSENCIA_INJUSTIFICADA: 'Ausencia injustificada',
  LICENCIA_LUTO: 'Licencia de luto',
  LICENCIA_PATERNIDAD: 'Licencia de paternidad',
  LICENCIA_MATERNIDAD: 'Licencia de maternidad',
  LICENCIA_NO_REMUNERADA: 'Licencia no remunerada',
  PERMISO_REMUNERADO: 'Permiso remunerado',
  CALAMIDAD_DOMESTICA: 'Calamidad doméstica',
  DIA_FAMILIA: 'Día de la familia',
};

export const NOVEDAD_STATUS_LABELS: Record<NovedadStatus, string> = {
  SOLICITADA: 'Solicitada',
  PENDIENTE_SUPERVISOR: 'Pendiente supervisor',
  PENDIENTE_RRHH: 'Pendiente RRHH',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
};
