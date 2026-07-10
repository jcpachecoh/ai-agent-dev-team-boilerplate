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

  // UVT (Unidad de Valor Tributario) — NO seeded. Value changes yearly via resolución DIAN
  // and nothing in this PR consumes it yet (GAP(Task04) — retención en la fuente still pending).
  // getValueAt('UVT', ...) will throw NotFoundException until a real vigencia is added; that is
  // intentional — a wrong guessed UVT is worse than a loud failure. TODO(Task04): seed once wired up.
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
  console.log(`Labor legal parameters seeded: ${LEGAL_PARAMETER_SEEDS.length} vigencias (global)`);
}
