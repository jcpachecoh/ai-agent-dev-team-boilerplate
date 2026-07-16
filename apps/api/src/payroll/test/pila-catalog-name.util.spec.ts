import { EmployeeCatalogType } from '@prisma/client';

import { catalogNameKey, resolveCatalogPilaCode } from '../utils/pila-catalog-name.util';

describe('pila-catalog-name.util', () => {
  it('normaliza nombre de catálogo', () => {
    expect(catalogNameKey('  EPS Sura ')).toBe('eps sura');
  });

  it('resuelve exact match y alias de seed (EPS/ARL cortos)', () => {
    const eps = new Map<string, string | null>([
      ['eps sura', 'EPS010'],
      ['eps sanitas', 'EPS005'],
      ['compensar eps', 'EPS008'],
      ['nueva eps', 'EPS037'],
    ]);
    const arl = new Map<string, string | null>([['arl sura', '14-11']]);

    expect(resolveCatalogPilaCode(eps, EmployeeCatalogType.EPS, 'EPS Sura')).toBe('EPS010');
    expect(resolveCatalogPilaCode(eps, EmployeeCatalogType.EPS, 'Sura')).toBe('EPS010');
    expect(resolveCatalogPilaCode(eps, EmployeeCatalogType.EPS, 'Sanitas')).toBe('EPS005');
    expect(resolveCatalogPilaCode(eps, EmployeeCatalogType.EPS, 'Compensar')).toBe('EPS008');
    expect(resolveCatalogPilaCode(eps, EmployeeCatalogType.EPS, 'Nueva EPS')).toBe('EPS037');
    expect(resolveCatalogPilaCode(arl, EmployeeCatalogType.ARL, 'Sura')).toBe('14-11');
    expect(resolveCatalogPilaCode(arl, EmployeeCatalogType.ARL, 'ARL Sura')).toBe('14-11');
    expect(resolveCatalogPilaCode(eps, EmployeeCatalogType.EPS, 'Desconocida')).toBeNull();
    expect(resolveCatalogPilaCode(eps, EmployeeCatalogType.EPS, null)).toBeNull();
  });
});
