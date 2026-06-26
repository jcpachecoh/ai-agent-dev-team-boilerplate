import { describe, expect, it } from 'vitest';

import { supplyItemStatusLabel } from './inventory';

describe('supplyItemStatusLabel', () => {
  it('returns ACTIVO for active items', () => {
    expect(supplyItemStatusLabel(true)).toBe('ACTIVO');
  });

  it('returns DESCONTINUADO for inactive items', () => {
    expect(supplyItemStatusLabel(false)).toBe('DESCONTINUADO');
  });
});
