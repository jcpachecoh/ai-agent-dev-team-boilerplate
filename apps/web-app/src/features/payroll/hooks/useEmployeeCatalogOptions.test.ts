import { describe, expect, it } from 'vitest';

import {
  buildCatalogSelectOptions,
  catalogSelectPlaceholder,
  groupCatalogOptionsByType,
} from './useEmployeeCatalogOptions';
import type { EmployeeCatalogOption } from '../types/employee-catalog.types';

const SAMPLE_OPTIONS: EmployeeCatalogOption[] = [
  { id: '1', type: 'EPS', name: 'Sura' },
  { id: '2', type: 'EPS', name: 'Sanitas' },
  { id: '3', type: 'AREA', name: 'Administración' },
];

describe('useEmployeeCatalogOptions helpers', () => {
  it('groups catalog options by type', () => {
    const grouped = groupCatalogOptionsByType(SAMPLE_OPTIONS);

    expect(grouped.EPS).toHaveLength(2);
    expect(grouped.AREA).toHaveLength(1);
    expect(grouped.ARL).toBeUndefined();
  });

  it('includes current value when missing from catalog', () => {
    const options = buildCatalogSelectOptions(
      [{ id: '1', type: 'EPS', name: 'Sura' }],
      'Legacy EPS',
    );

    expect(options[0]).toEqual({ value: 'Legacy EPS', label: 'Legacy EPS' });
    expect(options).toHaveLength(2);
  });

  it('returns empty-state placeholder when no options are available', () => {
    expect(catalogSelectPlaceholder(false, false)).toBe('No hay opciones configuradas');
  });
});
