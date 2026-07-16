import type { TaxWithholdingBracketSnapshot } from '../service/tax-withholding-bracket-snapshot';

/** Tramo resuelto listo para el motor de nómina (sin acceso a Prisma). */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface ResolvedTaxWithholdingBracket {
  fromUvtExclusive: number;
  toUvtInclusive: number | null;
  rate: number;
  fixedDeductionUvt: number;
}

export interface ITaxWithholdingBracketsRepository {
  findRowsForRange(
    tenantScopes: string[],
    from: Date,
    to: Date | null,
  ): Promise<import('@prisma/client').TaxWithholdingBracket[]>;
}

export interface ITaxWithholdingBracketsService {
  preload(
    from: Date,
    to: Date | null,
    tenantId?: string | null,
  ): Promise<TaxWithholdingBracketSnapshot>;
}
