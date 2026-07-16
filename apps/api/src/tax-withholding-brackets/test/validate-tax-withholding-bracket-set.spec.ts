import { BadRequestException } from '@nestjs/common';

import { makeOfficialResolvedTaxWithholdingBrackets } from './tax-withholding-brackets.test-fixtures';
import type { ResolvedTaxWithholdingBracket } from '../interfaces/tax-withholding-brackets.interfaces';
import {
  validateTaxWithholdingBracketSet,
  mapToResolvedTaxWithholdingBracket,
} from '../utils/validate-tax-withholding-bracket-set';

describe('validateTaxWithholdingBracketSet', (): void => {
  it('accepts the official 7-bracket table', (): void => {
    expect((): void =>
      validateTaxWithholdingBracketSet(makeOfficialResolvedTaxWithholdingBrackets()),
    ).not.toThrow();
  });

  it('throws when table is empty', (): void => {
    expect((): void => validateTaxWithholdingBracketSet([])).toThrow(BadRequestException);
  });

  it('throws when table is incomplete', (): void => {
    const incomplete = makeOfficialResolvedTaxWithholdingBrackets().slice(0, 3);
    expect((): void => validateTaxWithholdingBracketSet(incomplete)).toThrow(
      /Tabla de retención incompleta/,
    );
  });

  it('throws when more than one open-ended bracket exists', (): void => {
    const brackets = makeOfficialResolvedTaxWithholdingBrackets().map(
      (b): ResolvedTaxWithholdingBracket => ({ ...b }),
    );
    const second = brackets[1];
    if (second) {
      brackets[1] = { ...second, toUvtInclusive: null };
    }
    expect((): void => validateTaxWithholdingBracketSet(brackets)).toThrow(/más de un tramo/);
  });

  it('throws when ranges overlap', (): void => {
    const brackets = makeOfficialResolvedTaxWithholdingBrackets().map(
      (b): ResolvedTaxWithholdingBracket => ({ ...b }),
    );
    const third = brackets[2];
    if (third) {
      brackets[2] = { ...third, fromUvtExclusive: 140 };
    }
    expect((): void => validateTaxWithholdingBracketSet(brackets)).toThrow(/superpuestos/);
  });

  it('throws when no open-ended bracket exists', (): void => {
    const brackets = makeOfficialResolvedTaxWithholdingBrackets().map(
      (b): ResolvedTaxWithholdingBracket => ({
        ...b,
        toUvtInclusive: b.toUvtInclusive === null ? 5000 : b.toUvtInclusive,
      }),
    );
    expect(() => validateTaxWithholdingBracketSet(brackets)).toThrow(
      /falta el tramo con límite superior abierto/,
    );
  });

  it('throws when open-ended bracket is not the last one', (): void => {
    const brackets = makeOfficialResolvedTaxWithholdingBrackets().map(
      (b): ResolvedTaxWithholdingBracket => ({ ...b }),
    );
    const fifth = brackets[4];
    const last = brackets[6];
    if (fifth && last) {
      brackets[4] = { ...fifth, toUvtInclusive: null };
      brackets[6] = { ...last, toUvtInclusive: 5000 };
    }
    expect(() => validateTaxWithholdingBracketSet(brackets)).toThrow(
      /el tramo abierto debe ser el último/,
    );
  });

  it('throws when ranges have gaps', (): void => {
    const brackets = makeOfficialResolvedTaxWithholdingBrackets().map(
      (b): ResolvedTaxWithholdingBracket => ({ ...b }),
    );
    const third = brackets[2];
    if (third) {
      brackets[2] = { ...third, fromUvtExclusive: 160 };
    }
    expect(() => validateTaxWithholdingBracketSet(brackets)).toThrow(/huecos/);
  });
});

describe('mapToResolvedTaxWithholdingBracket', (): void => {
  it('maps prisma decimals to numbers', (): void => {
    const resolved = mapToResolvedTaxWithholdingBracket({
      lowerUvtBound: { toNumber: (): number => 95 },
      upperUvtBound: { toNumber: (): number => 150 },
      marginalRate: { toNumber: (): number => 0.19 },
      fixedTaxUvt: { toNumber: (): number => 18.05 },
    });
    expect(resolved).toEqual({
      fromUvtExclusive: 95,
      toUvtInclusive: 150,
      rate: 0.19,
      fixedDeductionUvt: 18.05,
    });
  });

  it('maps plain numbers and strings', (): void => {
    expect(
      mapToResolvedTaxWithholdingBracket({
        lowerUvtBound: 95,
        upperUvtBound: '150',
        marginalRate: 0.19,
        fixedTaxUvt: '18.05',
      }),
    ).toEqual({
      fromUvtExclusive: 95,
      toUvtInclusive: 150,
      rate: 0.19,
      fixedDeductionUvt: 18.05,
    });
  });

  it('maps null upper bound to open-ended bracket', (): void => {
    expect(
      mapToResolvedTaxWithholdingBracket({
        lowerUvtBound: 2300,
        upperUvtBound: null,
        marginalRate: 0.39,
        fixedTaxUvt: 126.95,
      }),
    ).toEqual({
      fromUvtExclusive: 2300,
      toUvtInclusive: null,
      rate: 0.39,
      fixedDeductionUvt: 126.95,
    });
  });
});
