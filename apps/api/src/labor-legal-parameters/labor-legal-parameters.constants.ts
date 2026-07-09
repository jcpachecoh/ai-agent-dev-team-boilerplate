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
  'JORNADA_MAX_SEMANAL',
  'HORARIO_NOCTURNO_INICIO',
  'INTERES_CESANTIAS',
  'UVT',
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
