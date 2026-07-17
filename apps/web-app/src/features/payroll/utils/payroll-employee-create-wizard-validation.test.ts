import { describe, expect, it } from 'vitest';

import { PAYROLL_EMPLOYEE_FORM_EMPTY_VALUES } from '../components/PayrollEmployeeForm';
import type { PayrollEmployeeCreateBankDraft } from '../types/payroll-employee-create-wizard.types';
import type { PayrollEmployeeFormValues } from '../types/payroll.types';
import {
  resolveBankDraftPayload,
  validatePayrollEmployeeBankStep,
  validatePayrollEmployeePersonalStep,
} from './payroll-employee-create-wizard-validation';

const LOADED_DRAFT: PayrollEmployeeCreateBankDraft = {
  bankAccountId: 'account-001',
  bankCode: 'bancolombia',
  accountType: 'SAVINGS',
  accountNumber: '',
  maskedAccountNumber: '**** **** 1234',
};

function validPersonalStepValues(
  overrides: Partial<PayrollEmployeeFormValues> = {},
): PayrollEmployeeFormValues {
  return {
    ...PAYROLL_EMPLOYEE_FORM_EMPTY_VALUES,
    primerNombre: 'CARLOS',
    primerApellido: 'PEREZ',
    email: 'carlos@test.com',
    cedula: '1234567890',
    costCenter: 'OPERACIONES',
    locationId: 'loc-1',
    laborClassification: 'ADMINISTRATIVO',
    positionId: 'pos-1',
    salaryAmount: '2000000',
    department: 'Cocina',
    contactoEmergenciaNombre: 'MARIA PEREZ',
    contactoEmergenciaParentesco: 'Madre',
    contactoEmergenciaTelefono: '3001234567',
    ...overrides,
  };
}

describe('validatePayrollEmployeeBankStep', () => {
  it('no exige número de cuenta al editar una cuenta existente sin tocarla', () => {
    const result = validatePayrollEmployeeBankStep(LOADED_DRAFT);
    expect(result.message).toBeNull();
    expect(result.fieldErrors).toEqual({});
  });

  it('sigue exigiendo número de cuenta válido al crear una cuenta nueva', () => {
    const result = validatePayrollEmployeeBankStep({
      bankCode: 'bancolombia',
      accountType: 'SAVINGS',
      accountNumber: '',
    });
    expect(result.message).toBeTruthy();
  });

  it('valida el nuevo número si el usuario decide reemplazarlo', () => {
    const result = validatePayrollEmployeeBankStep({ ...LOADED_DRAFT, accountNumber: '123' });
    expect(result.message).toBeTruthy();
  });
});

describe('validatePayrollEmployeePersonalStep', () => {
  it('exige contacto de emergencia al crear empleado', () => {
    const message = validatePayrollEmployeePersonalStep(
      validPersonalStepValues({
        contactoEmergenciaNombre: '',
        contactoEmergenciaParentesco: '',
        contactoEmergenciaTelefono: '',
      }),
      { hasActivePositions: true, selectedPositionArea: 'Cocina' },
    );
    expect(message).toMatch(/contacto de emergencia/i);
  });

  it('acepta el paso personal con contacto de emergencia completo', () => {
    const message = validatePayrollEmployeePersonalStep(validPersonalStepValues(), {
      hasActivePositions: true,
      selectedPositionArea: 'Cocina',
    });
    expect(message).toBeNull();
  });
});

describe('resolveBankDraftPayload', () => {
  it('no envía nada si el usuario no modifica una cuenta existente (evita duplicados)', () => {
    expect(resolveBankDraftPayload(LOADED_DRAFT, LOADED_DRAFT)).toBeUndefined();
  });

  it('envía el bankAccountId cuando el usuario reemplaza el número', () => {
    const payload = resolveBankDraftPayload(
      { ...LOADED_DRAFT, accountNumber: '12345678901' },
      LOADED_DRAFT,
    );
    expect(payload).toEqual({
      ...LOADED_DRAFT,
      accountNumber: '12345678901',
    });
  });

  it('envía el bankAccountId cuando el usuario cambia el banco sin tocar el número', () => {
    const payload = resolveBankDraftPayload(
      { ...LOADED_DRAFT, bankCode: 'davivienda' },
      LOADED_DRAFT,
    );
    expect(payload).toEqual({ ...LOADED_DRAFT, bankCode: 'davivienda', accountNumber: '' });
  });

  it('no envía nada en creación si no hay banco ni número', () => {
    expect(
      resolveBankDraftPayload({ bankCode: '', accountType: 'SAVINGS', accountNumber: '' }, null),
    ).toBeUndefined();
  });

  it('crea una cuenta nueva cuando no existe bankAccountId', () => {
    const payload = resolveBankDraftPayload(
      { bankCode: 'nequi', accountType: 'SAVINGS', accountNumber: '300-123-4567' },
      null,
    );
    expect(payload).toEqual({
      bankCode: 'nequi',
      accountType: 'SAVINGS',
      accountNumber: '3001234567',
    });
  });
});
