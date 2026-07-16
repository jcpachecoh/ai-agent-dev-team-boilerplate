import { PrismaClient } from '@prisma/client';

import { GLOBAL_TENANT_SCOPE } from '../../src/labor-legal-parameters/labor-legal-parameters.constants';

type LegalParameterSeed = {
  key: string;
  value: number;
  validFrom: string;
  validTo: string | null;
  source: string;
};

/**
 * Global (tenantId = null) legal parameter vigencias — OS-585 / NOM-06.
 *
 * Full known history is seeded (not just the current value) so getValueAt() resolves
 * correctly for historical dates too (e.g. a payroll re-run for a past period).
 *
 * JORNADA_MAX_SEMANAL dates use the July 15 step-down schedule of Ley 2101/2021, which
 * differs from the (now-removed) getMaxWeeklyMinutesForYear helper that used calendar-year
 * boundaries (Jan 1) — that helper was legally imprecise and was dead code (never wired into
 * any real flow); this seed is the corrected, DB-driven replacement.
 */
const LEGAL_PARAMETER_SEEDS: LegalParameterSeed[] = [
  // ── SMLV — Salario Mínimo Legal Vigente ─────────────────────────────────────
  {
    key: 'SMLV',
    value: 1423500,
    validFrom: '2025-01-01',
    validTo: '2025-12-31',
    source: 'Decreto 2481 de 2024',
  },
  {
    key: 'SMLV',
    value: 1750905,
    validFrom: '2026-01-01',
    validTo: null,
    source: 'Decreto 1469 de 2025',
  },

  // ── AUXILIO_TRANSPORTE ───────────────────────────────────────────────────────
  {
    key: 'AUXILIO_TRANSPORTE',
    value: 200000,
    validFrom: '2025-01-01',
    validTo: '2025-12-31',
    source: 'Decreto 2461 de 2024 art. 1',
  },
  {
    key: 'AUXILIO_TRANSPORTE',
    value: 249095,
    validFrom: '2026-01-01',
    validTo: null,
    source: 'Decreto 1470 de 2025',
  },

  // ── RECARGO_DOMINICAL_FESTIVO — incremento progresivo Ley 2466 de 2025 ──────
  {
    key: 'RECARGO_DOMINICAL_FESTIVO',
    value: 0.75,
    validFrom: '2020-01-01',
    validTo: '2025-06-30',
    source: 'CST art. 179 (histórico, previo a la reforma)',
  },
  {
    key: 'RECARGO_DOMINICAL_FESTIVO',
    value: 0.8,
    validFrom: '2025-07-01',
    validTo: '2026-06-30',
    source: 'Ley 2466 de 2025 — primer incremento',
  },
  {
    key: 'RECARGO_DOMINICAL_FESTIVO',
    value: 0.9,
    validFrom: '2026-07-01',
    validTo: '2027-06-30',
    source: 'Ley 2466 de 2025 — segundo incremento',
  },
  {
    key: 'RECARGO_DOMINICAL_FESTIVO',
    value: 1.0,
    validFrom: '2027-07-01',
    validTo: null,
    source: 'Ley 2466 de 2025 — recargo pleno',
  },

  // ── HORARIO_NOCTURNO_INICIO — hora (0-23) a partir de la cual aplica recargo nocturno ──
  {
    key: 'HORARIO_NOCTURNO_INICIO',
    value: 21,
    validFrom: '2020-01-01',
    validTo: '2025-12-24',
    source: 'CST art. 160 (histórico, previo a la reforma)',
  },
  {
    key: 'HORARIO_NOCTURNO_INICIO',
    value: 19,
    validFrom: '2025-12-25',
    validTo: null,
    source: 'Ley 2466 de 2025 — horario nocturno desde 7:00 p.m.',
  },

  // ── JORNADA_MAX_SEMANAL — horas, reducción progresiva Ley 2101 de 2021 ──────
  {
    key: 'JORNADA_MAX_SEMANAL',
    value: 46,
    validFrom: '2024-07-15',
    validTo: '2025-07-14',
    source: 'Ley 2101 de 2021',
  },
  {
    key: 'JORNADA_MAX_SEMANAL',
    value: 44,
    validFrom: '2025-07-15',
    validTo: '2026-07-14',
    source: 'Ley 2101 de 2021',
  },
  {
    key: 'JORNADA_MAX_SEMANAL',
    value: 42,
    validFrom: '2026-07-15',
    validTo: null,
    source: 'Ley 2101 de 2021 — jornada máxima final',
  },

  // ── RECARGO_NOCTURNO — recargo nocturno ordinario (no extra) ────────────────
  {
    key: 'RECARGO_NOCTURNO',
    value: 0.35,
    validFrom: '2020-01-01',
    validTo: null,
    source: 'CST art. 168',
  },

  // ── RECARGO_HORA_EXTRA_DIURNA / NOCTURNA — recargos de hora extra (OS-586) ──
  // Estables desde el CST original; no afectados por la Ley 2466/2025. Se versionan
  // igual que el resto de recargos (en vez de quedar hardcodeados) para tener una
  // única fuente de verdad vía LaborLegalParametersService.getValueAt(...).
  {
    key: 'RECARGO_HORA_EXTRA_DIURNA',
    value: 0.25,
    validFrom: '2020-01-01',
    validTo: null,
    source: 'CST art. 168',
  },
  {
    key: 'RECARGO_HORA_EXTRA_NOCTURNA',
    value: 0.75,
    validFrom: '2020-01-01',
    validTo: null,
    source: 'CST art. 168',
  },

  // ── INTERES_CESANTIAS — interés anual sobre cesantías ────────────────────────
  {
    key: 'INTERES_CESANTIAS',
    value: 0.12,
    validFrom: '2020-01-01',
    validTo: null,
    source: 'Ley 52 de 1975 art. 1',
  },

  // ── DIVISOR_CESANTIAS — año comercial de 360 días (30 días/mes) usado para prorratear
  // cesantías e intereses (OS-588). Convención estable del régimen de liquidación anual,
  // sin vigencias históricas distintas conocidas — se versiona igual que el resto para no
  // hardcodear "360" en el motor de cálculo.
  {
    key: 'DIVISOR_CESANTIAS',
    value: 360,
    validFrom: '2020-01-01',
    validTo: null,
    source: 'CST art. 249 / Ley 50 de 1990 — año comercial de 360 días',
  },

  // ── CESANTIAS_PLAZO_DIA / CESANTIAS_PLAZO_MES — fecha límite anual de consignación
  // (OS-588 fase 4). Se versiona en dos claves numéricas (día, mes) en vez de una fecha
  // completa porque LaborLegalParameter.value es un único Decimal — el año de la fecha
  // límite se deriva en tiempo de ejecución (año objetivo + 1), no se guarda aquí. Sin
  // vigencias históricas distintas conocidas — el 14 de febrero es estable desde el
  // Decreto 1176 de 1932, que nunca ha cambiado.
  {
    key: 'CESANTIAS_PLAZO_DIA',
    value: 14,
    validFrom: '2020-01-01',
    validTo: null,
    source: 'Decreto 1176 de 1932',
  },
  {
    key: 'CESANTIAS_PLAZO_MES',
    value: 2,
    validFrom: '2020-01-01',
    validTo: null,
    source: 'Decreto 1176 de 1932',
  },

  // ── UVT — Unidad de Valor Tributario (OS-594) ────────────────────────────────
  {
    key: 'UVT',
    value: 49799,
    validFrom: '2025-01-01',
    validTo: '2025-12-31',
    source: 'DIAN — Resolución 000187 de 2024',
  },
  {
    key: 'UVT',
    value: 52374,
    validFrom: '2026-01-01',
    validTo: null,
    source: 'DIAN — Resolución 000238 de 2025',
  },

  // UVT seed wired up in OS-594 — consumed by PayrollCalculationService via getValueAt('UVT', ...).

  // ── PRIMA_DIVISOR_DIAS — semestre comercial de 180 días (30 días/mes), OS-591 fase 1 ──
  {
    key: 'PRIMA_DIVISOR_DIAS',
    value: 180,
    validFrom: '2020-01-01',
    validTo: null,
    source: 'CST art. 306 — semestre comercial de 180 días',
  },

  // ── INDEMNIZACION_UMBRAL_SMLV — umbral de SMLMV para la tabla de días de indemnización
  // aplicable a contrato INDEFINIDO (CST art. 64 par. 1 num. 2). NO consumido todavía por
  // ningún cálculo en esta fase — sembrado para que la fase 2 (fórmula de indemnización) no
  // dependa de una migración adicional. Ver tasks/OS-591.md.
  {
    key: 'INDEMNIZACION_UMBRAL_SMLV',
    value: 10,
    validFrom: '2020-01-01',
    validTo: null,
    source: 'CST art. 64 par. 1 núm. 2 (Ley 789 de 2002)',
  },

  // ── INDEMNIZACION_FORMULA_VERSION — versión activa de la fórmula PROVISIONAL de
  // indemnización (mecanismo de versionado, no un valor legal per se). Value=1 = primera
  // versión provisional documentada en tasks/OS-591.md, pendiente de validación legal
  // explícita antes de habilitar aprobación/pago (criterio de aceptación #4 del ticket).
  {
    key: 'INDEMNIZACION_FORMULA_VERSION',
    value: 1,
    validFrom: '2020-01-01',
    validTo: null,
    source: 'OS-591 — fórmula provisional pendiente de validación legal, ver tasks/OS-591.md',
  },

  // ── SENA_CUOTA_MONETIZACION_FACTOR — OS-599 (solo régimen post Ley 2466) ─────
  // Histórico art. 34 Ley 789 (5% × trabajadores × SMLMV) se calcula en código
  // (sena-quota.calculation.ts); no cabe en un multiplicador fijo por aprendiz.
  {
    key: 'SENA_CUOTA_MONETIZACION_FACTOR',
    value: 1.5,
    validFrom: '2025-06-25',
    validTo: null,
    source: 'Ley 2466 de 2025 art. 23 — 1.5 SMLMV por aprendiz no contratado',
  },
];

export async function seedLaborLegalParameters(prisma: PrismaClient): Promise<void> {
  for (const seed of LEGAL_PARAMETER_SEEDS) {
    await prisma.laborLegalParameter.upsert({
      where: {
        tenantScope_key_validFrom: {
          tenantScope: GLOBAL_TENANT_SCOPE,
          key: seed.key,
          validFrom: new Date(`${seed.validFrom}T00:00:00.000Z`),
        },
      },
      update: {
        value: seed.value,
        validTo: seed.validTo ? new Date(`${seed.validTo}T23:59:59.999Z`) : null,
        source: seed.source,
        deletedAt: null,
      },
      create: {
        tenantId: null,
        tenantScope: GLOBAL_TENANT_SCOPE,
        key: seed.key,
        value: seed.value,
        validFrom: new Date(`${seed.validFrom}T00:00:00.000Z`),
        validTo: seed.validTo ? new Date(`${seed.validTo}T23:59:59.999Z`) : null,
        source: seed.source,
      },
    });
  }

  // OS-599 cleanup: soft-delete únicamente la vigencia GLOBAL incorrecta value=1.0
  // (validFrom 2020-01-01) creada por la aproximación pre-reforma. Idempotente:
  // - where deletedAt:null → re-ejecutar no toca filas ya eliminadas
  // - no incluye tenantScope distinto de GLOBAL → no toca overrides de tenant
  // - no incluye validFrom 2025-06-25 → no toca la vigencia canónica 1.5
  // getValueAt/findActiveAt filtran deletedAt:null, así que la fila queda ignorada.
  await prisma.laborLegalParameter.updateMany({
    where: {
      tenantScope: GLOBAL_TENANT_SCOPE,
      key: 'SENA_CUOTA_MONETIZACION_FACTOR',
      validFrom: new Date('2020-01-01T00:00:00.000Z'),
      value: 1,
      deletedAt: null,
    },
    data: { deletedAt: new Date() },
  });

  console.log(`Labor legal parameters seeded: ${LEGAL_PARAMETER_SEEDS.length} vigencias (global)`);
}
