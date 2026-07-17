import {
  OS380_CONCEPT_FIELDS,
  OS380_FIELD_TO_CONCEPT_CODE,
  getOs380ConceptCode,
  getOs380ConceptDisplayName,
  listOs380ConceptFieldCoverage,
  resolvePayrollExportConceptHeaders,
} from '../adapters/os380-payroll-concept.adapter';
import { isPayrollConceptCode } from '../payroll-concepts.constants';

describe('os380-payroll-concept.adapter (OS-612 Fase 4)', (): void => {
  it('cubre exactamente los 15 campos aprobados en el SDD', (): void => {
    expect(OS380_CONCEPT_FIELDS).toHaveLength(15);
    expect(Object.keys(OS380_FIELD_TO_CONCEPT_CODE)).toHaveLength(15);
  });

  it('cada campo mapea a un code del registry con displayName', (): void => {
    for (const field of OS380_CONCEPT_FIELDS) {
      const code = getOs380ConceptCode(field);
      expect(isPayrollConceptCode(code)).toBe(true);
      expect(getOs380ConceptDisplayName(field).length).toBeGreaterThan(0);
    }
  });

  it('listOs380ConceptFieldCoverage es exhaustivo y estable', (): void => {
    const coverage = listOs380ConceptFieldCoverage();
    expect(coverage).toHaveLength(15);
    expect(coverage.map((c) => c.field).sort()).toEqual([...OS380_CONCEPT_FIELDS].sort());
  });

  it('headers de export de nómina usan displayName del registry para campos concepto', (): void => {
    const headers = resolvePayrollExportConceptHeaders();
    expect(headers.salaryBase).toBe(getOs380ConceptDisplayName('salaryBase'));
    expect(headers.transportSubsidy).toBe(getOs380ConceptDisplayName('transportSubsidy'));
    expect(headers.overtimePay).toBe(getOs380ConceptDisplayName('overtimePay'));
    expect(headers.salaryBase).toBe('Salario base');
    expect(headers.overtimePay).toBe('Horas extra');
  });

  it('no incluye FSP ni Ley 1607 ni HE_*', (): void => {
    const codes = Object.values(OS380_FIELD_TO_CONCEPT_CODE);
    expect(codes.some((c) => c.startsWith('HE_'))).toBe(false);
    expect(codes).not.toContain('FSP_SOLIDARIDAD');
  });
});
