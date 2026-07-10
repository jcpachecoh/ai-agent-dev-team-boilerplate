export type OvertimeStatus =
  | 'PENDIENTE_ADMIN'
  | 'PENDIENTE_GERENCIA_OPERACIONES'
  | 'PENDIENTE_GERENCIA_GENERAL'
  | 'APROBADA'
  | 'OBJETADA';

export interface OvertimeRequestItem {
  id: string;
  employeeId: string;
  employeeName: string;
  locationId: string;
  locationName: string;
  accumulatedMinutes: number;
  shiftEndTime: string;
  actualEndTime: string;
  status: OvertimeStatus;
  payrollPeriod: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OvertimeInboxResult {
  items: OvertimeRequestItem[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
}

export interface OvertimePeriodSummary {
  payrollPeriod: string;
  pendingCount: number;
  approvedCount: number;
  objectedCount: number;
}

export interface OvertimeInboxFilters {
  payrollPeriod?: string;
  locationId?: string;
  employeeId?: string;
  status?: OvertimeStatus[];
  cursor?: string;
  take?: number;
}

export const OVERTIME_STATUS_LABELS: Record<OvertimeStatus, string> = {
  PENDIENTE_ADMIN: 'Pendiente administrador',
  PENDIENTE_GERENCIA_OPERACIONES: 'Pendiente gerencia operaciones',
  PENDIENTE_GERENCIA_GENERAL: 'Pendiente gerencia general',
  APROBADA: 'Aprobada',
  OBJETADA: 'Objetada',
};

export const OVERTIME_APPROVER_POSITION_IDS = {
  ADMINISTRADOR: 'pos-pdl-001',
  GERENCIA_OPERACIONES: 'pos-pdl-003',
  GERENCIA_GENERAL: 'pos-pdl-007',
} as const;

export function formatOvertimeApprovalIndicator(
  status: OvertimeStatus | null | undefined,
  accumulatedMinutes?: number,
): string {
  if (!status) return '—';
  if (status === 'APROBADA') return 'Aprobada';
  if (status === 'OBJETADA') return 'Objetada';
  const minutes = accumulatedMinutes ? ` (${accumulatedMinutes} min)` : '';
  return `Pendiente${minutes}`;
}
