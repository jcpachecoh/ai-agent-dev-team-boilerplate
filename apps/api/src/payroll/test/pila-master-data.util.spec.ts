import {
  catalogSeedPilaCodeUpdate,
  computeDianVerificationDigit,
  isNitVerificationDigitCoherent,
  isValidVerificationDigit,
  normalizeNitDigits,
} from '../utils/pila-master-data.util';
import { PILA_ADMIN_CODES_SOURCE, PILA_CATALOG_SEED_ROWS } from '../constants/pila-admin-codes';
import { EmployeeCatalogType } from '@prisma/client';
import { isValidActividadEconomicaArl, isValidPilaCode } from '../utils/pila-master-data.util';

describe('pila-master-data.util', () => {
  it('valida verificationDigit 0–9', () => {
    expect(isValidVerificationDigit('1')).toBe(true);
    expect(isValidVerificationDigit('10')).toBe(false);
    expect(isValidVerificationDigit('A')).toBe(false);
  });

  it('normaliza NIT a solo dígitos', () => {
    expect(normalizeNitDigits('900.000.000-5')).toBe('9000000005');
    expect(normalizeNitDigits('900000000')).toBe('900000000');
  });

  it('calcula DV DIAN coherente para NIT demo 900000000', () => {
    expect(computeDianVerificationDigit('900000000')).toBe('5');
    expect(isNitVerificationDigitCoherent('900000000', '5')).toBe(true);
    expect(isNitVerificationDigitCoherent('900000000', '1')).toBe(false);
    expect(isNitVerificationDigitCoherent('12', '1')).toBe(false);
    expect(() => computeDianVerificationDigit('12')).toThrow(/NIT base inválido/);
  });

  it('valida DIVIPOLA y campos de aportante', () => {
    const {
      isValidDepartmentCode,
      isValidMunicipalityCode,
      isValidNitBase,
      isValidClaseAportante,
      isValidNaturalezaJuridica,
      isValidFormaPresentacion,
      isValidTipoAportante,
      isValidPilaDocumentType,
      isValidArlCode,
    } =
      require('../utils/pila-master-data.util') as typeof import('../utils/pila-master-data.util');
    expect(isValidDepartmentCode('11')).toBe(true);
    expect(isValidDepartmentCode('1')).toBe(false);
    expect(isValidMunicipalityCode('001')).toBe(true);
    expect(isValidMunicipalityCode('01')).toBe(false);
    expect(isValidNitBase('900000000')).toBe(true);
    expect(isValidNitBase('12')).toBe(false);
    expect(isValidClaseAportante('B')).toBe(true);
    expect(isValidClaseAportante('Z')).toBe(false);
    expect(isValidNaturalezaJuridica('2')).toBe(true);
    expect(isValidNaturalezaJuridica('9')).toBe(false);
    expect(isValidFormaPresentacion('S')).toBe(true);
    expect(isValidFormaPresentacion('X')).toBe(false);
    expect(isValidTipoAportante('01')).toBe(true);
    expect(isValidTipoAportante('1')).toBe(false);
    expect(isValidPilaDocumentType('CC')).toBe(true);
    expect(isValidPilaDocumentType('XX')).toBe(false);
    expect(isValidArlCode('14-11')).toBe(true);
  });

  it('valida pilaCode y actividad económica ARL', () => {
    expect(isValidPilaCode('14-11')).toBe(true);
    expect(isValidPilaCode('EPS037')).toBe(true);
    expect(isValidActividadEconomicaArl('5611001')).toBe(true);
    expect(isValidActividadEconomicaArl('5611')).toBe(false);
  });

  it('catalogSeedPilaCodeUpdate no incluye pilaCode cuando el seed trae null', () => {
    expect(catalogSeedPilaCodeUpdate(null)).toEqual({});
    expect(catalogSeedPilaCodeUpdate('EPS037')).toEqual({ pilaCode: 'EPS037' });
  });

  it('documenta fuente de códigos PILA', () => {
    expect(PILA_ADMIN_CODES_SOURCE.ticket).toBe('OS-595');
    expect(PILA_ADMIN_CODES_SOURCE.primary).toContain('UGPP');
  });

  it('no asigna el mismo pilaCode dos veces dentro del mismo type', () => {
    const seen = new Set<string>();
    for (const row of PILA_CATALOG_SEED_ROWS) {
      if (!row.pilaCode) continue;
      const key = `${row.type}:${row.pilaCode}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it('deja pilaCode null en AREA y DEPARTMENT', () => {
    for (const row of PILA_CATALOG_SEED_ROWS) {
      if (row.type === EmployeeCatalogType.AREA || row.type === EmployeeCatalogType.DEPARTMENT) {
        expect(row.pilaCode).toBeNull();
      }
    }
  });

  it('tiene al menos un código oficial para EPS, AFP, ARL y CCF', () => {
    for (const type of [
      EmployeeCatalogType.EPS,
      EmployeeCatalogType.PENSION_FUND,
      EmployeeCatalogType.ARL,
      EmployeeCatalogType.CAJA_COMPENSACION,
    ]) {
      expect(PILA_CATALOG_SEED_ROWS.some((r) => r.type === type && r.pilaCode != null)).toBe(true);
    }
  });
});
