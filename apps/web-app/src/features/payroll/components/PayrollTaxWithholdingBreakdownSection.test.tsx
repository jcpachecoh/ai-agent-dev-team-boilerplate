import { render, screen } from '@testing-library/react';

import { PayrollTaxWithholdingBreakdownSection } from './PayrollTaxWithholdingBreakdownSection';
import type { TaxWithholdingBreakdown } from '../types/payroll-reports.types';
import { formatTaxWithholdingSummary } from '../utils/payroll-tax-withholding-display';

function buildBreakdown(overrides: Partial<TaxWithholdingBreakdown> = {}): TaxWithholdingBreakdown {
  return {
    taxWithholdingBase: 4_730_400,
    uvtValue: 49_799,
    taxWithholdingBaseUvt: 95.0001,
    bracketLowerUvtExclusive: 95,
    bracketUpperUvtInclusive: 150,
    marginalRate: 0.19,
    fixedTaxUvt: 18.05,
    incomeTaxWithholding: 450_123,
    isExemptFromTax: false,
    ...overrides,
  };
}

function expectDefinition(label: string, expected: string): void {
  const term = screen.getByText(label);
  const definition = term.nextElementSibling;
  expect(definition?.textContent?.replace(/\u00a0/g, ' ').trim()).toBe(
    expected.replace(/\u00a0/g, ' ').trim(),
  );
}

describe('PayrollTaxWithholdingBreakdownSection', (): void => {
  it('renders taxable employee withholding breakdown from API values', (): void => {
    const breakdown = buildBreakdown();
    const summary = formatTaxWithholdingSummary(breakdown);

    render(<PayrollTaxWithholdingBreakdownSection breakdown={breakdown} />);

    expect(screen.getByRole('heading', { name: 'Retención en la fuente' })).toBeInTheDocument();
    expectDefinition('Base gravable', summary.baseCop);
    expectDefinition('UVT aplicadas', summary.uvtValue);
    expectDefinition('Tramo aplicado', summary.bracket);
    expectDefinition('Retención calculada', summary.withholdingCop);
  });

  it('renders exempt employee without invented bracket', (): void => {
    const breakdown = buildBreakdown({
      incomeTaxWithholding: 0,
      isExemptFromTax: true,
      bracketLowerUvtExclusive: null,
      bracketUpperUvtInclusive: null,
      marginalRate: null,
      fixedTaxUvt: null,
    });
    const summary = formatTaxWithholdingSummary(breakdown);

    render(<PayrollTaxWithholdingBreakdownSection breakdown={breakdown} />);

    expectDefinition('Tramo aplicado', summary.bracket);
    expectDefinition('Retención calculada', summary.withholdingCop);
  });

  it('renders zero withholding below first taxable threshold', (): void => {
    const breakdown = buildBreakdown({
      taxWithholdingBase: 2_980_000,
      taxWithholdingBaseUvt: 60,
      bracketLowerUvtExclusive: 0,
      bracketUpperUvtInclusive: 95,
      marginalRate: 0,
      fixedTaxUvt: 0,
      incomeTaxWithholding: 0,
    });
    const summary = formatTaxWithholdingSummary(breakdown);

    render(<PayrollTaxWithholdingBreakdownSection breakdown={breakdown} />);

    expectDefinition('Tramo aplicado', summary.bracket);
    expectDefinition('Retención calculada', summary.withholdingCop);
  });

  it('renders open-ended upper bound safely for top bracket', (): void => {
    const breakdown = buildBreakdown({
      taxWithholdingBaseUvt: 2500,
      bracketLowerUvtExclusive: 2300,
      bracketUpperUvtInclusive: null,
      marginalRate: 0.39,
      fixedTaxUvt: 126.95,
      incomeTaxWithholding: 1_250_000,
    });
    const summary = formatTaxWithholdingSummary(breakdown);

    render(<PayrollTaxWithholdingBreakdownSection breakdown={breakdown} />);

    expectDefinition('Tramo aplicado', summary.bracket);
    expectDefinition('Retención calculada', summary.withholdingCop);
  });
});
