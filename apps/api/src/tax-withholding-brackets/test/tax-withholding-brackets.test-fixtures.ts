import type { ResolvedTaxWithholdingBracket } from '../interfaces/tax-withholding-brackets.interfaces';
import { OFFICIAL_TAX_WITHHOLDING_BRACKETS_LEY_2277 } from '../tax-withholding-brackets.constants';

export const TEST_UVT_2025 = 49799;

export function makeOfficialResolvedTaxWithholdingBrackets(): ResolvedTaxWithholdingBracket[] {
  return OFFICIAL_TAX_WITHHOLDING_BRACKETS_LEY_2277.map(
    (bracket): ResolvedTaxWithholdingBracket => ({
      fromUvtExclusive: bracket.lowerUvtBound,
      toUvtInclusive: bracket.upperUvtBound,
      rate: bracket.marginalRate,
      fixedDeductionUvt: bracket.fixedTaxUvt,
    }),
  );
}

export function uvtIncomeToCop(uvtIncome: number, uvt = TEST_UVT_2025): number {
  return uvtIncome * uvt;
}
