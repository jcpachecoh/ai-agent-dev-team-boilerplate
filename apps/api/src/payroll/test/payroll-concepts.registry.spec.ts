import {
  OS380_FIELD_TO_CONCEPT_CODE,
  PAYROLL_CONCEPT_DEFINITIONS,
  getPayrollConceptDefinition,
  isPayrollConceptCode,
  listPayrollConceptCodes,
} from '../payroll-concepts.constants';

describe('PAYROLL_CONCEPT_DEFINITIONS registry (OS-612 PR1)', (): void => {
  it('no tiene códigos duplicados', (): void => {
    const codes = PAYROLL_CONCEPT_DEFINITIONS.map((d) => d.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('incluye codes OS-591 conservados y AJUSTE_MANUAL', (): void => {
    for (const code of [
      'SAL_PENDIENTE',
      'CESANTIAS',
      'INTERESES_CESANTIAS',
      'PRIMA',
      'VACACIONES',
      'INDEMNIZACION',
      'AJUSTE_MANUAL',
    ] as const) {
      expect(isPayrollConceptCode(code)).toBe(true);
    }
  });

  it('incluye HORAS_EXTRA agregado y no incluye HE_* / FSP / Ley 1607', (): void => {
    const codes = listPayrollConceptCodes();
    expect(codes).toContain('HORAS_EXTRA');
    expect(codes.some((c) => c.startsWith('HE_'))).toBe(false);
    expect(codes).not.toContain('FSP_SOLIDARIDAD');
    expect(codes).not.toContain('FSP_SUBSISTENCIA');
  });

  it('todo campo OS-380 mapeado apunta a un code del registry', (): void => {
    for (const [field, code] of Object.entries(OS380_FIELD_TO_CONCEPT_CODE)) {
      expect(isPayrollConceptCode(code)).toBe(true);
      expect(getPayrollConceptDefinition(code)).toBeDefined();
      expect(field.length).toBeGreaterThan(0);
    }
  });

  it('conserva PRIMA (no PRIMA_SERVICIOS)', (): void => {
    expect(isPayrollConceptCode('PRIMA')).toBe(true);
    expect(isPayrollConceptCode('PRIMA_SERVICIOS')).toBe(false);
  });
});
