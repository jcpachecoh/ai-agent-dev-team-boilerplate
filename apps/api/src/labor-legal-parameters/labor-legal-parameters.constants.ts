/**
 * Legal parameter keys — OS-585 / NOM-06.
 * Defined as a typed TS constant (not a Prisma enum) so a new key can be seeded
 * and consumed without a schema migration; validated at the DTO/service layer.
 */
export const LABOR_LEGAL_PARAMETER_KEYS = [
  'SMLV',
  'AUXILIO_TRANSPORTE',
  'RECARGO_DOMINICAL_FESTIVO',
  'RECARGO_NOCTURNO',
  'RECARGO_HORA_EXTRA_DIURNA',
  'RECARGO_HORA_EXTRA_NOCTURNA',
  'JORNADA_MAX_SEMANAL',
  'HORARIO_NOCTURNO_INICIO',
  'INTERES_CESANTIAS',
  /** OS-588 — divisor de días para prorratear cesantías/intereses (año comercial de 360 días). */
  'DIVISOR_CESANTIAS',
  /** OS-588 (fase 4) — día/mes límite de consignación de cesantías (Decreto 1176 de 1932). */
  'CESANTIAS_PLAZO_DIA',
  'CESANTIAS_PLAZO_MES',
  'UVT',
  /** OS-591 (fase 1) — divisor de días para prorratear prima de servicios (semestre comercial de 180 días, CST art. 306). */
  'PRIMA_DIVISOR_DIAS',
  /**
   * OS-591 (fase 1) — umbral de SMLMV (CST art. 64 par. 1 num. 2) que determina qué tabla
   * de días por indemnización aplica a contrato INDEFINIDO. Parametrizado (no hardcodeado
   * "10") porque es un umbral legal que, como el resto de este motor, puede cambiar por ley.
   * NO se usa todavía en ningún cálculo en esta fase — ver tasks/OS-591.md fase 2.
   */
  'INDEMNIZACION_UMBRAL_SMLV',
  /**
   * OS-591 (fase 1) — versión activa de la fórmula PROVISIONAL de indemnización. No es un
   * valor legal en sí (no hay "Decreto X" que lo respalde) sino un mecanismo de versionado:
   * cuando Legal apruebe/corrija la fórmula, se cierra la vigencia de esta key y se abre una
   * nueva con el siguiente entero — así cada liquidación (fase 2) puede hacer snapshot de
   * QUÉ VERSIÓN de fórmula usó sin necesitar una columna nueva ni migración. Ver
   * tasks/OS-591.md "Separación entre versión legal de fórmula y estado operativo".
   */
  'INDEMNIZACION_FORMULA_VERSION',
  /**
   * OS-599 — factor post-reforma de monetización (SMLMV por aprendiz faltante).
   * Solo aplica desde 2025-06-25 (Ley 2466/2025 art. 23 → 1.5). El régimen histórico
   * art. 34 Ley 789 (5% × trabajadores × SMLMV, parcial proporcional) NO se modela con
   * este parámetro — ver `estimateMonetizationAmount` / tasks/OS-599.md.
   */
  'SENA_CUOTA_MONETIZACION_FACTOR',
] as const;

export type LaborLegalParameterKey = (typeof LABOR_LEGAL_PARAMETER_KEYS)[number];

export function isLaborLegalParameterKey(value: string): value is LaborLegalParameterKey {
  return (LABOR_LEGAL_PARAMETER_KEYS as readonly string[]).includes(value);
}

/** tenantScope value used for global (tenantId = null) parameters — see schema.prisma comment on LaborLegalParameter. */
export const GLOBAL_TENANT_SCOPE = 'GLOBAL';

export function toTenantScope(tenantId: string | null | undefined): string {
  return tenantId ?? GLOBAL_TENANT_SCOPE;
}
