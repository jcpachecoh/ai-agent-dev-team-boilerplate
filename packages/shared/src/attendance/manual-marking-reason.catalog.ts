/**
 * Catálogo unificado de motivos para marcación manual (OS-553 / CONN-05).
 * Fuente única consumida por API y packages/ui.
 */

export type NovedadType =
  | 'AUSENCIA_INJUSTIFICADA'
  | 'LICENCIA_LUTO'
  | 'LICENCIA_PATERNIDAD'
  | 'LICENCIA_MATERNIDAD'
  | 'LICENCIA_NO_REMUNERADA'
  | 'PERMISO_REMUNERADO'
  | 'CALAMIDAD_DOMESTICA'
  | 'DIA_FAMILIA';

export type MedicalLeaveReasonCode = 'INCAPACIDAD_COMUN' | 'INCAPACIDAD_LABORAL';

export type AttendanceOnlyReasonCode = 'CORRECCION_MARCACION';

/** Unión: NovedadType | incapacidades NOM-13 | corrección pura */
export type ManualMarkingReasonCode =
  | AttendanceOnlyReasonCode
  | NovedadType
  | MedicalLeaveReasonCode;

export type ManualMarkingReasonTarget = 'ATTENDANCE_ONLY' | 'PAYROLL_NOVEDAD' | 'MEDICAL_LEAVE';

export type MedicalLeaveOrigin = 'COMUN' | 'LABORAL';

export interface ManualMarkingReasonOption {
  code: ManualMarkingReasonCode;
  label: string;
  target: ManualMarkingReasonTarget;
  novedadType?: NovedadType;
  leaveOrigin?: MedicalLeaveOrigin;
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

const MEDICAL_LEAVE_REASON_LABELS: Record<MedicalLeaveReasonCode, string> = {
  INCAPACIDAD_COMUN: 'Incapacidad médica (común)',
  INCAPACIDAD_LABORAL: 'Incapacidad médica (laboral)',
};

const ATTENDANCE_ONLY_REASON_LABELS: Record<AttendanceOnlyReasonCode, string> = {
  CORRECCION_MARCACION: 'Corrección de marcación',
};

const NOVEDAD_TYPE_CODES = Object.keys(NOVEDAD_TYPE_LABELS) as NovedadType[];

const NOVEDAD_REASON_OPTIONS: ManualMarkingReasonOption[] = NOVEDAD_TYPE_CODES.map((type) => ({
  code: type,
  label: NOVEDAD_TYPE_LABELS[type],
  target: 'PAYROLL_NOVEDAD' as const,
  novedadType: type,
}));

const MEDICAL_LEAVE_REASON_OPTIONS: ManualMarkingReasonOption[] = [
  {
    code: 'INCAPACIDAD_COMUN',
    label: MEDICAL_LEAVE_REASON_LABELS.INCAPACIDAD_COMUN,
    target: 'MEDICAL_LEAVE',
    leaveOrigin: 'COMUN',
  },
  {
    code: 'INCAPACIDAD_LABORAL',
    label: MEDICAL_LEAVE_REASON_LABELS.INCAPACIDAD_LABORAL,
    target: 'MEDICAL_LEAVE',
    leaveOrigin: 'LABORAL',
  },
];

const ATTENDANCE_ONLY_REASON_OPTIONS: ManualMarkingReasonOption[] = [
  {
    code: 'CORRECCION_MARCACION',
    label: ATTENDANCE_ONLY_REASON_LABELS.CORRECCION_MARCACION,
    target: 'ATTENDANCE_ONLY',
  },
];

/** Orden UI: corrección, incapacidades, luego novedades de nómina. */
export const MANUAL_MARKING_REASON_CATALOG: ManualMarkingReasonOption[] = [
  ...ATTENDANCE_ONLY_REASON_OPTIONS,
  ...MEDICAL_LEAVE_REASON_OPTIONS,
  ...NOVEDAD_REASON_OPTIONS,
];

/** Códigos válidos para validación `@IsIn` en DTOs. */
export const MANUAL_MARKING_REASON_CODES: ManualMarkingReasonCode[] =
  MANUAL_MARKING_REASON_CATALOG.map((option) => option.code);

const REASON_BY_CODE = new Map<ManualMarkingReasonCode, ManualMarkingReasonOption>(
  MANUAL_MARKING_REASON_CATALOG.map((option) => [option.code, option]),
);

export function getManualMarkingReasonOption(
  code: ManualMarkingReasonCode,
): ManualMarkingReasonOption | undefined {
  return REASON_BY_CODE.get(code);
}

export function isPayrollNovedadReason(code: ManualMarkingReasonCode): code is NovedadType {
  return getManualMarkingReasonOption(code)?.target === 'PAYROLL_NOVEDAD';
}

export function isMedicalLeaveReason(
  code: ManualMarkingReasonCode,
): code is MedicalLeaveReasonCode {
  return getManualMarkingReasonOption(code)?.target === 'MEDICAL_LEAVE';
}

export function isAttendanceOnlyReason(
  code: ManualMarkingReasonCode,
): code is AttendanceOnlyReasonCode {
  return getManualMarkingReasonOption(code)?.target === 'ATTENDANCE_ONLY';
}
