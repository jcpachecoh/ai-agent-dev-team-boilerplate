import {
  makeOfficialResolvedTaxWithholdingBrackets,
  TEST_UVT_2025,
  uvtIncomeToCop,
} from '../../tax-withholding-brackets/test/tax-withholding-brackets.test-fixtures';
import {
  buildExemptTaxWithholdingBreakdown,
  calcularRetencionFuente,
} from '../utils/income-tax-withholding.utils';

const BRACKETS = makeOfficialResolvedTaxWithholdingBrackets();

function expectedWithholding(uvtIncome: number, uvt = TEST_UVT_2025): number {
  return calcularRetencionFuente(uvtIncomeToCop(uvtIncome), uvt, BRACKETS).incomeTaxWithholding;
}

describe('calcularRetencionFuente (OS-594)', (): void => {
  describe('all seven marginal rates', (): void => {
    it.each([
      ['0%', 60, 0],
      ['19%', 120, expectedWithholding(120)],
      ['28%', 200, expectedWithholding(200)],
      ['33%', 400, expectedWithholding(400)],
      ['35%', 700, expectedWithholding(700)],
      ['37%', 1500, expectedWithholding(1500)],
      ['39%', 2500, expectedWithholding(2500)],
    ] as const)('applies %s bracket at %s UVT', (_label, uvtIncome, expected): void => {
      expect(
        calcularRetencionFuente(uvtIncomeToCop(uvtIncome), TEST_UVT_2025, BRACKETS)
          .incomeTaxWithholding,
      ).toBe(expected);
    });
  });

  describe('exact boundaries and immediately above', (): void => {
    it('95 UVT inclusive → 0%; just above → 19% bracket', (): void => {
      expect(
        calcularRetencionFuente(uvtIncomeToCop(95), TEST_UVT_2025, BRACKETS).incomeTaxWithholding,
      ).toBe(0);
      expect(
        calcularRetencionFuente(uvtIncomeToCop(95.0001), TEST_UVT_2025, BRACKETS)
          .incomeTaxWithholding,
      ).toBe(expectedWithholding(95.0001));
    });

    it('150 UVT inclusive stays in 19%; just above → 28%', (): void => {
      expect(
        calcularRetencionFuente(uvtIncomeToCop(150), TEST_UVT_2025, BRACKETS).incomeTaxWithholding,
      ).toBe(expectedWithholding(150));
      expect(
        calcularRetencionFuente(uvtIncomeToCop(150.0001), TEST_UVT_2025, BRACKETS)
          .incomeTaxWithholding,
      ).toBe(expectedWithholding(150.0001));
    });

    it('360 UVT boundary transitions to 33%', (): void => {
      expect(
        calcularRetencionFuente(uvtIncomeToCop(360), TEST_UVT_2025, BRACKETS).incomeTaxWithholding,
      ).toBe(expectedWithholding(360));
      expect(
        calcularRetencionFuente(uvtIncomeToCop(360.0001), TEST_UVT_2025, BRACKETS)
          .incomeTaxWithholding,
      ).toBe(expectedWithholding(360.0001));
    });

    it('2300 UVT boundary transitions to 39%', (): void => {
      expect(
        calcularRetencionFuente(uvtIncomeToCop(2300), TEST_UVT_2025, BRACKETS).incomeTaxWithholding,
      ).toBe(expectedWithholding(2300));
      expect(
        calcularRetencionFuente(uvtIncomeToCop(2300.0001), TEST_UVT_2025, BRACKETS)
          .incomeTaxWithholding,
      ).toBe(expectedWithholding(2300.0001));
    });
  });

  it('returns 0 when ingreso base is zero or negative', (): void => {
    expect(calcularRetencionFuente(0, TEST_UVT_2025, BRACKETS).incomeTaxWithholding).toBe(0);
    expect(calcularRetencionFuente(-1000, TEST_UVT_2025, BRACKETS).incomeTaxWithholding).toBe(0);
  });

  it('returns 0 when formula yields non-positive withholding in a taxable bracket', (): void => {
    const brackets = [
      { fromUvtExclusive: 0, toUvtInclusive: 100, rate: 0.19, fixedDeductionUvt: 50 },
    ];
    expect(
      calcularRetencionFuente(uvtIncomeToCop(10), TEST_UVT_2025, brackets).incomeTaxWithholding,
    ).toBe(0);
  });

  it('returns 0 when no bracket matches the income', (): void => {
    expect(
      calcularRetencionFuente(uvtIncomeToCop(500), TEST_UVT_2025, []).incomeTaxWithholding,
    ).toBe(0);
  });

  describe('breakdown', (): void => {
    it('includes base and 0% bracket for income below first taxable threshold', (): void => {
      const result = calcularRetencionFuente(uvtIncomeToCop(60), TEST_UVT_2025, BRACKETS);

      expect(result.incomeTaxWithholding).toBe(0);
      expect(result.breakdown).toMatchObject({
        taxWithholdingBase: uvtIncomeToCop(60),
        uvtValue: TEST_UVT_2025,
        taxWithholdingBaseUvt: 60,
        bracketLowerUvtExclusive: 0,
        bracketUpperUvtInclusive: 95,
        marginalRate: 0,
        fixedTaxUvt: 0,
        incomeTaxWithholding: 0,
        isExemptFromTax: false,
      });
    });

    it('includes open-ended upper bound for top bracket', (): void => {
      const result = calcularRetencionFuente(uvtIncomeToCop(2500), TEST_UVT_2025, BRACKETS);

      expect(result.breakdown.bracketLowerUvtExclusive).toBe(2300);
      expect(result.breakdown.bracketUpperUvtInclusive).toBeNull();
      expect(result.breakdown.marginalRate).toBe(0.39);
      expect(result.breakdown.fixedTaxUvt).toBe(126.95);
      expect(result.incomeTaxWithholding).toBeGreaterThan(0);
    });

    it('includes taxable bracket fields for 19% range', (): void => {
      const result = calcularRetencionFuente(uvtIncomeToCop(120), TEST_UVT_2025, BRACKETS);

      expect(result.breakdown).toMatchObject({
        bracketLowerUvtExclusive: 95,
        bracketUpperUvtInclusive: 150,
        marginalRate: 0.19,
        fixedTaxUvt: 18.05,
      });
      expect(result.breakdown.incomeTaxWithholding).toBe(result.incomeTaxWithholding);
    });
  });

  describe('buildExemptTaxWithholdingBreakdown', (): void => {
    it('returns exempt breakdown without bracket assignment', (): void => {
      const breakdown = buildExemptTaxWithholdingBreakdown(3_000_000, TEST_UVT_2025);

      expect(breakdown).toEqual({
        taxWithholdingBase: 3_000_000,
        uvtValue: TEST_UVT_2025,
        taxWithholdingBaseUvt: 3_000_000 / TEST_UVT_2025,
        bracketLowerUvtExclusive: null,
        bracketUpperUvtInclusive: null,
        marginalRate: null,
        fixedTaxUvt: null,
        incomeTaxWithholding: 0,
        isExemptFromTax: true,
      });
    });

    it('uses zero base UVT when uvt value is non-positive', (): void => {
      const breakdown = buildExemptTaxWithholdingBreakdown(3_000_000, 0);

      expect(breakdown.taxWithholdingBaseUvt).toBe(0);
    });
  });
});
