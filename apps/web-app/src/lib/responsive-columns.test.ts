import { describe, expect, it } from 'vitest';

import {
  columnsForBreakpoint,
  gridTemplateFromColumns,
  isCardMode,
  type ResponsiveColumnDef,
} from './responsive-columns';

const DEMO_COLUMNS: ResponsiveColumnDef[] = [
  { id: 'code', label: 'Código', priority: 1, gridTrack: 'minmax(5rem, 0.7fr)' },
  { id: 'name', label: 'Nombre', priority: 1, gridTrack: 'minmax(8rem, 1.2fr)' },
  { id: 'status', label: 'Estado', priority: 2, gridTrack: 'minmax(5rem, 0.7fr)' },
  { id: 'category', label: 'Categoría', priority: 3, gridTrack: 'minmax(6rem, 0.8fr)' },
  { id: 'updated', label: 'Actualizado', priority: 4, gridTrack: 'minmax(6rem, 0.8fr)' },
  { id: 'notes', label: 'Notas', priority: 5, gridTrack: 'minmax(4rem, 0.5fr)' },
];

describe('responsive-columns', () => {
  it('isCardMode is true only on mobile by default', () => {
    expect(isCardMode('mobile')).toBe(true);
    expect(isCardMode('tablet')).toBe(false);
    expect(isCardMode('laptop')).toBe(false);
    expect(isCardMode('desktop')).toBe(false);
  });

  it('isCardMode respects cardBelow threshold', () => {
    expect(isCardMode('laptop', 'laptop')).toBe(true);
    expect(isCardMode('desktop', 'laptop')).toBe(false);
    expect(isCardMode('tablet', 'tablet')).toBe(true);
    expect(isCardMode('laptop', 'tablet')).toBe(false);
  });

  it('columnsForBreakpoint filters by priority', () => {
    expect(columnsForBreakpoint(DEMO_COLUMNS, 'mobile')).toHaveLength(0);
    expect(columnsForBreakpoint(DEMO_COLUMNS, 'tablet').map((c) => c.id)).toEqual([
      'code',
      'name',
      'status',
      'category',
    ]);
    expect(columnsForBreakpoint(DEMO_COLUMNS, 'laptop').map((c) => c.id)).toEqual([
      'code',
      'name',
      'status',
      'category',
      'updated',
    ]);
    expect(columnsForBreakpoint(DEMO_COLUMNS, 'desktop')).toHaveLength(6);
  });

  it('gridTemplateFromColumns joins grid tracks', () => {
    const visible = columnsForBreakpoint(DEMO_COLUMNS, 'laptop');
    expect(gridTemplateFromColumns(visible)).toBe(
      'minmax(5rem, 0.7fr) minmax(8rem, 1.2fr) minmax(5rem, 0.7fr) minmax(6rem, 0.8fr) minmax(6rem, 0.8fr)',
    );
  });
});
