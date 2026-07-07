import { ArlRiskLevel } from '@prisma/client';

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

// Horas teóricas por mes para cálculo de valor hora ordinaria
// 30 días × 8 h/día — base estándar Colombia para liquidación mensual
export const MONTHLY_HOURS_BASE = 240;

// Base de aportes para salario integral — CST art. 132 par. 2
export const INTEGRAL_CONTRIBUTIONS_BASE_PCT = 0.7;

// ── Descuentos empleado (% sobre base de aportes) ────────────────────────────
// Fuente: Ley 100/1993 arts. 204 (salud) y 20 (pensión)
export const EMPLOYEE_HEALTH_PCT = 0.04;
export const EMPLOYEE_PENSION_PCT = 0.04;

/** Rol bootstrap al crear usuario desde nómina; el rol definitivo se asigna en Usuarios. */
export const DEFAULT_EMPLOYEE_BOOTSTRAP_ROLE_CODE = 'OPERATOR';
// GAP(Task04): fondo de solidaridad pensional (+1% sobre base > 4 SMLV — Ley 100 art. 27)
// GAP(Task04): retención en la fuente (Ley 2277/2022 rangos UVT) — siempre 0 hasta Task04

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

// Recargos sobre valor hora ordinaria — CST arts. 168 (extras) y 179 (festivos)
// FESTIVO_NOCTURNO = 1.50: combinación CST art. 168 (recargo nocturno 75%) + art. 179 (recargo festivo 75%)
// Fuente: Concepto MinTrabajo 171671/2021; corregido de 1.10 en Task04A.
export const OVERTIME_SURCHARGE: Record<AttendanceOvertimeType, number> = {
  [AttendanceOvertimeType.REGULAR]: 0,
  [AttendanceOvertimeType.DIURNO]: 0.25,
  [AttendanceOvertimeType.NOCTURNO]: 0.75,
  [AttendanceOvertimeType.FESTIVO_DIURNO]: 0.75,
  [AttendanceOvertimeType.FESTIVO_NOCTURNO]: 1.5,
};
