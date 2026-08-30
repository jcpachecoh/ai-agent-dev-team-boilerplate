import { describe, expect, it } from 'vitest';

import { getRolColumns, getRolGridTemplate } from './rol-columns';

describe('getRolColumns', () => {
  it('includes actions column by default', () => {
    expect(getRolColumns().map((column) => column.key)).toContain('actions');
  });

  it('excludes actions column when showActions is false', () => {
    expect(getRolColumns(false).map((column) => column.key)).not.toContain('actions');
  });
});

describe('getRolGridTemplate', () => {
  it('returns shorter template without actions', () => {
    const withActions = getRolGridTemplate(true).split(' ').length;
    const withoutActions = getRolGridTemplate(false).split(' ').length;
    expect(withoutActions).toBeLessThan(withActions);
  });
});
