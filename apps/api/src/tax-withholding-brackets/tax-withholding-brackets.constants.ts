/**
 * Tabla progresiva mensual Ley 2277/2022 — fuente única para seed y tests (OS-594).
 * Ver tasks/nom-04-payroll-attendance-reports/task-04-legal-hardening.md §4.2.
 */
export const TAX_WITHHOLDING_BRACKET_COUNT = 7;

/**
 * Vigencia provisional de la tabla en seed — NO es fecha legal validada.
 * Ver tasks/OS-594.md §Vigencia de la tabla progresiva.
 */
export const PROVISIONAL_TAX_WITHHOLDING_VALID_FROM = '2025-01-01';

export type OfficialTaxWithholdingBracketSeed = {
  sortOrder: number;
  lowerUvtBound: number;
  upperUvtBound: number | null;
  marginalRate: number;
  fixedTaxUvt: number;
};

export const OFFICIAL_TAX_WITHHOLDING_BRACKETS_LEY_2277: readonly OfficialTaxWithholdingBracketSeed[] =
  [
    { sortOrder: 1, lowerUvtBound: 0, upperUvtBound: 95, marginalRate: 0, fixedTaxUvt: 0 },
    { sortOrder: 2, lowerUvtBound: 95, upperUvtBound: 150, marginalRate: 0.19, fixedTaxUvt: 18.05 },
    {
      sortOrder: 3,
      lowerUvtBound: 150,
      upperUvtBound: 360,
      marginalRate: 0.28,
      fixedTaxUvt: 32.05,
    },
    {
      sortOrder: 4,
      lowerUvtBound: 360,
      upperUvtBound: 640,
      marginalRate: 0.33,
      fixedTaxUvt: 50.05,
    },
    {
      sortOrder: 5,
      lowerUvtBound: 640,
      upperUvtBound: 945,
      marginalRate: 0.35,
      fixedTaxUvt: 62.05,
    },
    {
      sortOrder: 6,
      lowerUvtBound: 945,
      upperUvtBound: 2300,
      marginalRate: 0.37,
      fixedTaxUvt: 80.95,
    },
    {
      sortOrder: 7,
      lowerUvtBound: 2300,
      upperUvtBound: null,
      marginalRate: 0.39,
      fixedTaxUvt: 126.95,
    },
  ] as const;
