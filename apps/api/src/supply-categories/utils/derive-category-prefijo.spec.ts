import { derivePrefijoFromNombre, resolveCategoryPrefijo } from './derive-category-prefijo';

describe('derive-category-prefijo', () => {
  it('derives prefix from category name', () => {
    expect(derivePrefijoFromNombre('Activo fijo')).toBe('ACT');
    expect(derivePrefijoFromNombre('AB')).toBe('AB');
  });

  it('falls back when name has no alphanumeric chars', () => {
    expect(derivePrefijoFromNombre('---')).toBe('CAT');
  });

  it('resolveCategoryPrefijo prefers stored value', () => {
    expect(resolveCategoryPrefijo('Activo fijo', 'acf')).toBe('ACF');
  });

  it('resolveCategoryPrefijo derives when stored value is missing', () => {
    expect(resolveCategoryPrefijo('Abarrotes', null)).toBe('ABA');
  });
});
