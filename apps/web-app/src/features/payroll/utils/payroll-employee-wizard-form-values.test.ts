import { describe, expect, it } from 'vitest';

import type { EmployeeBankAccount } from '../types/bank-account.types';
import { bankAccountToWizardDraft } from './payroll-employee-wizard-form-values';

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
    isPrimary: true,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    ...overrides,
  };
}

describe('bankAccountToWizardDraft', () => {
  it('retorna un borrador vacío cuando no hay cuentas', () => {
    expect(bankAccountToWizardDraft(undefined)).toEqual({
      bankCode: '',
      accountType: 'SAVINGS',
      accountNumber: '',
    });
    expect(bankAccountToWizardDraft([])).toEqual({
      bankCode: '',
      accountType: 'SAVINGS',
      accountNumber: '',
    });
  });

  it('mapea la cuenta primaria preservando el id para permitir PATCH', () => {
    const account = buildAccount();

    const draft = bankAccountToWizardDraft([account]);

    expect(draft).toEqual({
      bankAccountId: 'account-001',
      bankCode: 'bancolombia',
      accountType: 'SAVINGS',
      accountNumber: '',
      maskedAccountNumber: '**** **** 1234',
    });
  });

  it('nunca coloca el número real de cuenta en el campo editable', () => {
    const account = buildAccount({ accountLast4: '9999' });

    const draft = bankAccountToWizardDraft([account]);

    expect(draft.accountNumber).toBe('');
    expect(draft.maskedAccountNumber).toContain('9999');
  });
});
