import { ArlRiskLevel, EmployeeContractType } from '@prisma/client';

/**
 * Mirrors schema.prisma enum AttendanceOvertimeType.
 * Defined here because Prisma only generates enums that appear in model fields;
 * AttendanceOvertimeType is schema-level-only until a model field uses it.
 */
export enum AttendanceOvertimeType {
  REGULAR = 'REGULAR',
  DIURNO = 'DIURNO',
  NOCTURNO = 'NOCTURNO',
  FESTIVO_DIURNO = 'FESTIVO_DIURNO',
  FESTIVO_NOCTURNO = 'FESTIVO_NOCTURNO',
}

export const SMLV_2025 = Number(process.env.SMLV_AMOUNT) || 1423500;
export const TRANSPORT_SUBSIDY_THRESHOLD = SMLV_2025 * 2;

// Auxilio de transporte 2025 — Decreto 2461 de 2024 (art. 1)
// GAP(Task04): verificar y actualizar para 2026 cuando se publique el decreto anual
export const TRANSPORT_SUBSIDY_2025 = Number(process.env.TRANSPORT_SUBSIDY_AMOUNT) || 162000;

// MONTHLY_HOURS_BASE (240 = 30 días × 8h/día) removido (OS-586) — el divisor de la hora
// ordinaria ahora se deriva de JORNADA_MAX_SEMANAL(fecha) × 5, resuelto por
// LaborLegalParametersService.getValueAt(...) por cada día de asistencia (ver
// OvertimeMinutesEntry.monthlyHoursBase en payroll-report.interfaces.ts).

// Base de aportes para salario integral — CST art. 132 par. 2
export const INTEGRAL_CONTRIBUTIONS_BASE_PCT = 0.7;

// ── Descuentos empleado (% sobre base de aportes) ────────────────────────────
// Fuente: Ley 100/1993 arts. 204 (salud) y 20 (pensión)
export const EMPLOYEE_HEALTH_PCT = 0.04;
export const EMPLOYEE_PENSION_PCT = 0.04;

/** Rol bootstrap al crear usuario desde nómina; el rol definitivo se asigna en Usuarios. */
export const DEFAULT_EMPLOYEE_BOOTSTRAP_ROLE_CODE = 'OPERATOR';
// GAP(Task04): fondo de solidaridad pensional (+1% sobre base > 4 SMLV — Ley 100 art. 27)

// ── Aportes patronales (% sobre base de aportes) ─────────────────────────────
// Fuente: Ley 100/1993 art. 204 (salud 8.5%), Ley 100/1993 art. 20 (pensión 12%),
//         Ley 119/1994 (SENA 2%), Ley 89/1988 (ICBF 3%), Ley 21/1982 (caja 4%)
// GAP(Task04): exención SENA/ICBF para empresas con salario ≤ 10 SMLV (Ley 590/2000)
export const EMPLOYER_HEALTH_PCT = 0.085;
export const EMPLOYER_PENSION_PCT = 0.12;
export const EMPLOYER_SENA_PCT = 0.02;
export const EMPLOYER_ICBF_PCT = 0.03;
export const EMPLOYER_CAJA_PCT = 0.04;

// Tasas ARL por nivel de riesgo — Decreto 1607/2002, tabla de clasificación
export const ARL_RATES: Record<ArlRiskLevel, number> = {
  [ArlRiskLevel.RIESGO_I]: 0.00522,
  [ArlRiskLevel.RIESGO_II]: 0.01044,
  [ArlRiskLevel.RIESGO_III]: 0.02436,
  [ArlRiskLevel.RIESGO_IV]: 0.0435,
  [ArlRiskLevel.RIESGO_V]: 0.0696,
};

// ── OS-599 — Cuota de aprendizaje SENA (estimación) ───────────────────────────
/**
 * Única fuente de verdad de contratos que entran en la base estimada de trabajadores
 * (denominador art. 33/34 Ley 789/2002). En el schema el tipo de prestación de servicios
 * es `PRESTACION` (no existe `PRESTACION_SERVICIOS`).
 */
export const SENA_QUOTA_ELIGIBLE_CONTRACT_TYPES: ReadonlySet<EmployeeContractType> = new Set([
  EmployeeContractType.FIJO,
  EmployeeContractType.INDEFINIDO,
  EmployeeContractType.OBRA,
]);

/** Exclusiones explícitas del denominador (independientes + aprendices). */
export const SENA_QUOTA_EXCLUDED_FROM_ELIGIBLE_BASE: ReadonlySet<EmployeeContractType> = new Set([
  EmployeeContractType.PRESTACION,
  EmployeeContractType.APRENDIZAJE,
]);

/** Umbral de obligatoriedad — Ley 789/2002 art. 33. */
export const SENA_QUOTA_OBLIGATION_THRESHOLD = 15;

/**
 * Entrada en vigencia de Ley 2466/2025 art. 23 (modifica monetización art. 34 Ley 789).
 * Fuente operativa: Circular SENA 197 de 2025 — aplicación desde 2025-06-25.
 */
export const SENA_CUOTA_LEY_2466_EFFECTIVE_FROM = new Date('2025-06-25T00:00:00.000Z');

/**
 * Régimen histórico (antes de 2025-06-25): art. 34 Ley 789/2002 —
 * monetización total = 5% × trabajadores (sin independientes/transitorios) × SMLMV;
 * parcial = proporcional a aprendices no vinculados.
 */
export const SENA_CUOTA_HISTORICAL_WORKFORCE_PCT = 0.05;

/**
 * Fallback del factor post-reforma (1.5 SMLMV por aprendiz faltante) si NOM-06 no
 * resuelve `SENA_CUOTA_MONETIZACION_FACTOR`. El valor canónico vive en LaborLegalParameter.
 */
export const SENA_CUOTA_POST_REFORM_PER_MISSING_SMLV = 1.5;
