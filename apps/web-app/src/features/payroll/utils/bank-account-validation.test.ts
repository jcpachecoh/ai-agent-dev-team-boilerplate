import { describe, expect, it } from 'vitest';

import {
  formatMaskedAccountNumber,
  validateAccountNumberForBank,
  validateBankAccountForm,
} from './bank-account-validation';

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
