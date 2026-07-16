import {
  PILA_XLSX_EPS_BY_CODE,
  PilaXlsxSerializationError,
  resolveXlsxLabel,
} from '../pila/serializer/pila-xlsx-catalog.maps';

describe('pila-xlsx-catalog.maps', () => {
  it('resuelve etiqueta exacta sin fuzzy', () => {
    expect(resolveXlsxLabel(PILA_XLSX_EPS_BY_CODE, 'EPS010', 'epsCode')).toBe(
      'EPS SURA (ANTES SUSALUD)',
    );
  });

  it('falla con sample de catálogo en el mensaje', () => {
    try {
      resolveXlsxLabel(PILA_XLSX_EPS_BY_CODE, 'EPS999', 'epsCode', {
        employeeId: 'e1',
        employeeName: 'Ana',
        catalogSample: ['SANITAS', 'COMPENSAR'],
      });
      fail('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(PilaXlsxSerializationError);
      const e = err as PilaXlsxSerializationError;
      expect(e.details.code).toBe('ERR_PILA_XLSX_CATALOG_MISMATCH');
      expect(e.message).toContain('SANITAS');
      expect(e.details.employeeId).toBe('e1');
    }
  });

  it('falla sin sample usando hint por defecto', () => {
    try {
      resolveXlsxLabel(PILA_XLSX_EPS_BY_CODE, 'EPS999', 'epsCode');
      fail('expected throw');
    } catch (err) {
      const e = err as PilaXlsxSerializationError;
      expect(e.details.expectedHint).toContain('DatosPruebaEmp');
    }
  });

  it('constructor de error usa detalle por defecto', () => {
    const err = new PilaXlsxSerializationError('field', 'boom');
    expect(err.details.code).toBe('ERR_PILA_XLSX_SERIALIZE');
  });
});
