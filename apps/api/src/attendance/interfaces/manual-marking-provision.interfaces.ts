import { LeaveOrigin, NovedadType } from '@prisma/client';

export const CORRECCION_MARCACION_REASON = 'CORRECCION_MARCACION' as const;

export const MEDICAL_LEAVE_REASON_CODES = {
  INCAPACIDAD_COMUN: LeaveOrigin.COMUN,
  INCAPACIDAD_LABORAL: LeaveOrigin.LABORAL,
} as const;

export type MedicalLeaveReasonCode = keyof typeof MEDICAL_LEAVE_REASON_CODES;

export type ManualMarkingReasonTarget = 'ATTENDANCE_ONLY' | 'PAYROLL_NOVEDAD' | 'MEDICAL_LEAVE';

export interface ResolvedManualMarkingReason {
  target: ManualMarkingReasonTarget;
  novedadType?: NovedadType;
  leaveOrigin?: LeaveOrigin;
}

export interface ManualMarkingProvisionInput {
  tenantId: string;
  actorUserId: string;
  actorRoleCode: string;
  employeeId: string;
  attendanceLogId?: string;
  reason: string;
  workDate: Date;
  supportStorageObjectId?: string;
}

export interface ManualMarkingProvisionResult {
  provisioned: boolean;
  payrollNovedadId?: string;
  medicalLeaveId?: string;
}

export interface IManualMarkingProvisionService {
  validateBeforeManualMarking(
    tenantId: string,
    actorRoleCode: string,
    reason: string,
    supportStorageObjectId?: string,
  ): Promise<void>;

  provisionAfterManualMarking(
    input: ManualMarkingProvisionInput,
  ): Promise<ManualMarkingProvisionResult>;
}

const NOVEDAD_TYPE_VALUES = new Set<string>(Object.values(NovedadType));

export function resolveManualMarkingReason(reason: string): ResolvedManualMarkingReason | null {
  if (reason === CORRECCION_MARCACION_REASON) {
    return { target: 'ATTENDANCE_ONLY' };
  }

  if (reason in MEDICAL_LEAVE_REASON_CODES) {
    return {
      target: 'MEDICAL_LEAVE',
      leaveOrigin: MEDICAL_LEAVE_REASON_CODES[reason as MedicalLeaveReasonCode],
    };
  }

  if (NOVEDAD_TYPE_VALUES.has(reason)) {
    return { target: 'PAYROLL_NOVEDAD', novedadType: reason as NovedadType };
  }

  return null;
}
