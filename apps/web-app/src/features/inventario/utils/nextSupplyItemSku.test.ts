import { describe, expect, it } from 'vitest';

import {
  computeNextCodigoInterno,
  derivePrefijoFromNombre,
  resolveCategoryPrefijo,
} from './nextSupplyItemSku';
import type { SupplyCategoryApi } from '../types';

describe('nextSupplyItemSku', () => {
  it('derives prefijo from category name when prefijo is missing', () => {
    expect(derivePrefijoFromNombre('Abarrotes')).toBe('ABA');
    expect(resolveCategoryPrefijo({ id: '1', nombre: 'Abarrotes', isActive: true })).toBe('ABA');
  });

  it('uses configured prefijo when available', () => {
    const category: SupplyCategoryApi = {
      id: '1',
      nombre: 'Abarrotes',
      prefijo: 'ABR',
      isActive: true,
    };
    expect(resolveCategoryPrefijo(category)).toBe('ABR');
  });

  it('computes next consecutive SKU for category', () => {
    const next = computeNextCodigoInterno('ABR', ['ABR-000001', 'ABR-000003', 'OTR-000099']);
    expect(next).toBe('ABR-000004');
  });
});
