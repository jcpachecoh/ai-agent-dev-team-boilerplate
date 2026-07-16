import { formatPayrollCurrency } from './financial-profile-display';
import type { TaxWithholdingBreakdown } from '../types/payroll-reports.types';

export function formatTaxBracketRange(breakdown: TaxWithholdingBreakdown): string {
  if (breakdown.isExemptFromTax) {
    return 'No aplica — empleado exento';
  }

  if (breakdown.marginalRate === null) {
    return 'Sin tramo aplicable';
  }

  if (breakdown.marginalRate === 0) {
    return 'Sin tramo gravado (hasta 95 UVT)';
  }

  const lower = breakdown.bracketLowerUvtExclusive ?? 0;
  const upper =
    breakdown.bracketUpperUvtInclusive === null
      ? 'abierto'
      : breakdown.bracketUpperUvtInclusive.toLocaleString('es-CO', {
          maximumFractionDigits: 4,
        });

  return `>${lower.toLocaleString('es-CO', { maximumFractionDigits: 4 })} hasta ${upper} UVT`;
}

export function formatTaxWithholdingSummary(breakdown: TaxWithholdingBreakdown): {
  baseCop: string;
  uvtValue: string;
  bracket: string;
  withholdingCop: string;
} {
  return {
    baseCop: formatPayrollCurrency(breakdown.taxWithholdingBase),
    uvtValue: formatPayrollCurrency(breakdown.uvtValue),
    bracket: formatTaxBracketRange(breakdown),
    withholdingCop: formatPayrollCurrency(breakdown.incomeTaxWithholding),
  };
}
