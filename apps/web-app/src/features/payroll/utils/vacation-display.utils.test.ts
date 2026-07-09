import { describe, expect, it } from 'vitest';

import { monthToIsoDateRange } from './vacation-display.utils';

describe('vacation month filter', () => {
  it('converts a selected month to inclusive ISO dates', () => {
    expect(monthToIsoDateRange('2026-08')).toEqual({
      dateFrom: '2026-08-01',
      dateTo: '2026-08-31',
    });
  });

  it('handles February in a leap year', () => {
    expect(monthToIsoDateRange('2028-02')).toEqual({
      dateFrom: '2028-02-01',
      dateTo: '2028-02-29',
    });
  });

  it('returns empty range when month is blank', () => {
    expect(monthToIsoDateRange('')).toEqual({});
  });
});
