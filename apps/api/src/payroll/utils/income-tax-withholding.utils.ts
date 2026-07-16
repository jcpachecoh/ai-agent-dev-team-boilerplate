import type { ResolvedTaxWithholdingBracket } from '../../tax-withholding-brackets/interfaces/tax-withholding-brackets.interfaces';
import type { TaxWithholdingBreakdown } from '../interfaces/payroll-report.interfaces';

export type { TaxWithholdingBreakdown };

export interface TaxWithholdingCalculationResult {
  incomeTaxWithholding: number;
  breakdown: TaxWithholdingBreakdown;
}

function buildBaseBreakdown(
  ingresoBaseRetencion: number,
  uvt: number,
  overrides: Partial<TaxWithholdingBreakdown> = {},
): TaxWithholdingBreakdown {
  return {
    taxWithholdingBase: ingresoBaseRetencion,
    uvtValue: uvt,
    taxWithholdingBaseUvt: uvt > 0 ? ingresoBaseRetencion / uvt : 0,
    bracketLowerUvtExclusive: null,
    bracketUpperUvtInclusive: null,
    marginalRate: null,
    fixedTaxUvt: null,
    incomeTaxWithholding: 0,
    isExemptFromTax: false,
    ...overrides,
  };
}

/**
 * Retención en la fuente (RENTA) — procedimiento 1, tabla progresiva mensual.
 * Recibe tramos ya resueltos por vigencia (OS-594); no consulta Prisma.
 *
 * Redondeo: Math.round al peso entero (COP), consistente con roundCOP del motor de nómina.
 */
export function calcularRetencionFuente(
  ingresoBaseRetencion: number,
  uvt: number,
  brackets: readonly ResolvedTaxWithholdingBracket[],
): TaxWithholdingCalculationResult {
  if (ingresoBaseRetencion <= 0) {
    return {
      incomeTaxWithholding: 0,
      breakdown: buildBaseBreakdown(ingresoBaseRetencion, uvt),
    };
  }

  const uvtIncome = ingresoBaseRetencion / uvt;

  for (const bracket of brackets) {
    const inRange =
      bracket.toUvtInclusive === null
        ? uvtIncome > bracket.fromUvtExclusive
        : uvtIncome > bracket.fromUvtExclusive && uvtIncome <= bracket.toUvtInclusive;

    if (!inRange) {
      continue;
    }

    const breakdown = buildBaseBreakdown(ingresoBaseRetencion, uvt, {
      taxWithholdingBaseUvt: uvtIncome,
      bracketLowerUvtExclusive: bracket.fromUvtExclusive,
      bracketUpperUvtInclusive: bracket.toUvtInclusive,
      marginalRate: bracket.rate,
      fixedTaxUvt: bracket.fixedDeductionUvt,
    });

    if (bracket.rate === 0) {
      return { incomeTaxWithholding: 0, breakdown };
    }

    const withholdingUvt = uvtIncome * bracket.rate - bracket.fixedDeductionUvt;
    if (withholdingUvt <= 0) {
      return { incomeTaxWithholding: 0, breakdown };
    }

    const incomeTaxWithholding = Math.round(withholdingUvt * uvt);
    return {
      incomeTaxWithholding,
      breakdown: { ...breakdown, incomeTaxWithholding },
    };
  }

  return {
    incomeTaxWithholding: 0,
    breakdown: buildBaseBreakdown(ingresoBaseRetencion, uvt, { taxWithholdingBaseUvt: uvtIncome }),
  };
}

/** Breakdown para empleados exentos — retención 0 sin tramo aplicado. */
export function buildExemptTaxWithholdingBreakdown(
  ingresoBaseRetencion: number,
  uvt: number,
): TaxWithholdingBreakdown {
  return buildBaseBreakdown(ingresoBaseRetencion, uvt, { isExemptFromTax: true });
}
