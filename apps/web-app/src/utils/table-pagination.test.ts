import { describe, expect, it } from 'vitest';

import { getTablePaginationRange, paginateItems, TABLE_PAGE_SIZE } from './table-pagination';

describe('getTablePaginationRange', () => {
  it('formats the standard Empleados-style summary and page label', () => {
    const range = getTablePaginationRange(3, TABLE_PAGE_SIZE, 138);

    expect(range).toEqual({
      totalPages: 18,
      pageStart: 17,
      pageEnd: 24,
      summary: '17-24 de 138',
      pageLabel: 'Pág. 3/18',
    });
  });

  it('handles empty lists', () => {
    const range = getTablePaginationRange(1, 8, 0);
    expect(range.summary).toBe('0-0 de 0');
    expect(range.pageLabel).toBe('Pág. 1/1');
  });
});

describe('paginateItems', () => {
  it('slices the current page', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(paginateItems(items, 2, 8)).toEqual([9, 10]);
  });
});
