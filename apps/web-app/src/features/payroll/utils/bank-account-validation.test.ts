import { describe, expect, it } from 'vitest';

import type { EmployeeBankAccount } from '../types/bank-account.types';
import {
  formatMaskedAccountNumber,
  selectPrimaryBankAccount,
  validateAccountNumberForBank,
  validateBankAccountForm,
} from './bank-account-validation';

function buildAccount(overrides: Partial<EmployeeBankAccount> = {}): EmployeeBankAccount {
  return {
    id: 'account-001',
    tenantId: 'tenant-001',
    financialProfileId: 'profile-001',
    bankName: 'Bancolombia',
    bankCode: 'bancolombia',
    accountType: 'SAVINGS',
    maskedAccountNumber: '****1234',
    accountLast4: '1234',
    isPrimary: false,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    ...overrides,
  };
}

describe('validateAccountNumberForBank', () => {
  it('valida longitud exacta para Bancolombia', () => {
    expect(validateAccountNumberForBank('bancolombia', '12345678901')).toBeNull();
    expect(validateAccountNumberForBank('bancolombia', '123')).toMatch(/11 dígitos/);
  });

  it('valida rango para Banco de Bogotá', () => {
    expect(validateAccountNumberForBank('banco_bogota', '123456789')).toBeNull();
    expect(validateAccountNumberForBank('banco_bogota', '12')).not.toBeNull();
  });

  it('rechaza caracteres no numéricos', () => {
    expect(validateAccountNumberForBank('nequi', '30012abc45')).toMatch(
      /solo puede contener dígitos/,
    );
  });
});

describe('validateBankAccountForm', () => {
  it('exige número en creación', () => {
    const errors = validateBankAccountForm(
      { bankCode: 'nequi', accountType: 'SAVINGS', accountNumber: '' },
      { requireAccountNumber: true },
    );
    expect(errors.accountNumber).toBeTruthy();
  });
});

describe('formatMaskedAccountNumber', () => {
  it('formatea con últimos 4 dígitos', () => {
    expect(formatMaskedAccountNumber('****4321', '4321')).toBe('**** **** 4321');
  });
});

describe('selectPrimaryBankAccount', () => {
  it('retorna undefined si no hay cuentas', () => {
    expect(selectPrimaryBankAccount(undefined)).toBeUndefined();
    expect(selectPrimaryBankAccount([])).toBeUndefined();
  });

  it('prioriza la cuenta primaria activa', () => {
    const secondary = buildAccount({ id: 'secondary', isPrimary: false });
    const primary = buildAccount({ id: 'primary', isPrimary: true });
    expect(selectPrimaryBankAccount([secondary, primary])?.id).toBe('primary');
  });

  it('usa la primera cuenta activa cuando no hay primaria', () => {
    const inactive = buildAccount({ id: 'inactive', isActive: false });
    const active = buildAccount({ id: 'active' });
    expect(selectPrimaryBankAccount([inactive, active])?.id).toBe('active');
  });

  it('ignora cuentas eliminadas o inactivas marcadas como primarias', () => {
    const deletedPrimary = buildAccount({
      id: 'deleted-primary',
      isPrimary: true,
      deletedAt: '2026-01-01T00:00:00.000Z',
    });
    const active = buildAccount({ id: 'active' });
    expect(selectPrimaryBankAccount([deletedPrimary, active])?.id).toBe('active');
  });
});
