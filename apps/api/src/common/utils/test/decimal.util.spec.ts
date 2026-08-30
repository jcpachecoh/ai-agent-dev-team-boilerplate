import { Decimal } from '@prisma/client/runtime/library';
import { decimalToNumber } from '../decimal.util';

describe('decimalToNumber', () => {
  it('returns 0 for null and undefined', () => {
    expect(decimalToNumber(null)).toBe(0);
    expect(decimalToNumber(undefined)).toBe(0);
  });

  it('returns numbers unchanged', () => {
    expect(decimalToNumber(12.5)).toBe(12.5);
  });

  it('converts Decimal and string values', () => {
    expect(decimalToNumber(new Decimal('3.25'))).toBe(3.25);
    expect(decimalToNumber('7')).toBe(7);
  });
});
