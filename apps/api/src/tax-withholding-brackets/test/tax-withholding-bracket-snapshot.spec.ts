import { NotFoundException } from '@nestjs/common';
import type { TaxWithholdingBracket } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { TaxWithholdingBracketSnapshot } from '../service/tax-withholding-bracket-snapshot';
import {
  OFFICIAL_TAX_WITHHOLDING_BRACKETS_LEY_2277,
  PROVISIONAL_TAX_WITHHOLDING_VALID_FROM,
} from '../tax-withholding-brackets.constants';

function makeDbRows(validFrom: Date, validTo: Date | null): TaxWithholdingBracket[] {
  return OFFICIAL_TAX_WITHHOLDING_BRACKETS_LEY_2277.map(
    (bracket): TaxWithholdingBracket => ({
      id: `bracket-${bracket.sortOrder}`,
      tenantId: null,
      tenantScope: 'GLOBAL',
      sortOrder: bracket.sortOrder,
      lowerUvtBound: new Decimal(bracket.lowerUvtBound),
      upperUvtBound: bracket.upperUvtBound === null ? null : new Decimal(bracket.upperUvtBound),
      marginalRate: new Decimal(bracket.marginalRate),
      fixedTaxUvt: new Decimal(bracket.fixedTaxUvt),
      validFrom,
      validTo,
      source: 'test',
      deletedAt: null,
      createdAt: validFrom,
      updatedAt: validFrom,
    }),
  );
}

describe('TaxWithholdingBracketSnapshot', (): void => {
  const validFrom = new Date(`${PROVISIONAL_TAX_WITHHOLDING_VALID_FROM}T00:00:00.000Z`);

  it('returns validated brackets for an active date', (): void => {
    const snapshot = new TaxWithholdingBracketSnapshot(makeDbRows(validFrom, null), null);
    const brackets = snapshot.bracketsAt(new Date('2025-06-30T12:00:00.000Z'));
    expect(brackets).toHaveLength(7);
    expect(brackets[0]).toEqual({
      fromUvtExclusive: 0,
      toUvtInclusive: 95,
      rate: 0,
      fixedDeductionUvt: 0,
    });
  });

  it('throws NotFoundException when no vigencia matches date before provisional validFrom', (): void => {
    const snapshot = new TaxWithholdingBracketSnapshot(makeDbRows(validFrom, null), null);
    expect(() => snapshot.bracketsAt(new Date('2024-12-31T23:59:59.999Z'))).toThrow(
      NotFoundException,
    );
  });

  it('throws when active vigencia is incomplete', (): void => {
    const incompleteRows = makeDbRows(validFrom, null).slice(0, 3);
    const snapshot = new TaxWithholdingBracketSnapshot(incompleteRows, null);
    expect(() => snapshot.bracketsAt(new Date('2025-06-30T00:00:00.000Z'))).toThrow(
      /Tabla de retención incompleta/,
    );
  });

  it('falls back to global brackets when tenant has no override rows', (): void => {
    const tenantId = 'tenant-001';
    const snapshot = new TaxWithholdingBracketSnapshot(makeDbRows(validFrom, null), tenantId);
    const brackets = snapshot.bracketsAt(new Date('2025-06-30T12:00:00.000Z'));

    expect(brackets).toHaveLength(7);
    expect(brackets[1]?.rate).toBe(0.19);
  });

  it('prefers tenant-scoped brackets when tenantId is provided', (): void => {
    const tenantId = 'tenant-001';
    const tenantRows = makeDbRows(validFrom, null).map(
      (row): TaxWithholdingBracket =>
        row.sortOrder === 2
          ? { ...row, tenantScope: tenantId, tenantId, marginalRate: new Decimal(0.25) }
          : { ...row, tenantScope: tenantId, tenantId },
    );
    const globalRows = makeDbRows(validFrom, null);
    const snapshot = new TaxWithholdingBracketSnapshot([...tenantRows, ...globalRows], tenantId);
    const brackets = snapshot.bracketsAt(new Date('2025-06-30T12:00:00.000Z'));

    expect(brackets).toHaveLength(7);
    expect(brackets[1]?.rate).toBe(0.25);
  });

  it('selects the latest tenant vigencia when multiple overlap', (): void => {
    const tenantId = 'tenant-001';
    const olderFrom = new Date('2025-01-01T00:00:00.000Z');
    const newerFrom = new Date('2025-06-01T00:00:00.000Z');
    const olderRows = makeDbRows(olderFrom, null).map(
      (row): TaxWithholdingBracket => ({ ...row, tenantScope: tenantId, tenantId }),
    );
    const newerRows = makeDbRows(newerFrom, null).map(
      (row): TaxWithholdingBracket =>
        row.sortOrder === 2
          ? { ...row, tenantScope: tenantId, tenantId, marginalRate: new Decimal(0.21) }
          : { ...row, tenantScope: tenantId, tenantId },
    );
    const snapshot = new TaxWithholdingBracketSnapshot([...olderRows, ...newerRows], tenantId);
    const brackets = snapshot.bracketsAt(new Date('2025-06-30T00:00:00.000Z'));

    expect(brackets[1]?.rate).toBe(0.21);
  });

  it('ignores expired vigencias outside the requested date', (): void => {
    const expiredTo = new Date('2025-05-31T23:59:59.999Z');
    const snapshot = new TaxWithholdingBracketSnapshot(makeDbRows(validFrom, expiredTo), null);
    expect(() => snapshot.bracketsAt(new Date('2025-06-30T00:00:00.000Z'))).toThrow(
      NotFoundException,
    );
  });
});
