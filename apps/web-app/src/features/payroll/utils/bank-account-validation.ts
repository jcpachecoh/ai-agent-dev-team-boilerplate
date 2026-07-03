import {
  COLOMBIAN_BANKS,
  findColombianBank,
  GENERIC_ACCOUNT_LENGTH,
} from '../constants/colombian-banks';

export function validateAccountNumberForBank(
  bankCode: string,
  accountNumber: string,
): string | null {
  const trimmed = accountNumber.trim();
  if (!trimmed) {
    return 'El número de cuenta es obligatorio';
  }
  if (!/^\d+$/.test(trimmed)) {
    return 'El número de cuenta solo puede contener dígitos';
  }

  const bank = findColombianBank(bankCode);
  if (bank) {
    if (trimmed.length < bank.minLength || trimmed.length > bank.maxLength) {
      if (bank.minLength === bank.maxLength) {
        return `${bank.name} requiere exactamente ${bank.minLength} dígitos`;
      }
      return `${bank.name} requiere entre ${bank.minLength} y ${bank.maxLength} dígitos`;
    }
    return null;
  }

  if (trimmed.length < GENERIC_ACCOUNT_LENGTH.min || trimmed.length > GENERIC_ACCOUNT_LENGTH.max) {
    return `El número de cuenta debe tener entre ${GENERIC_ACCOUNT_LENGTH.min} y ${GENERIC_ACCOUNT_LENGTH.max} dígitos`;
  }

  return null;
}

export function validateBankAccountForm(
  values: { bankCode: string; accountType: string; accountNumber: string },
  options: { requireAccountNumber: boolean },
): Partial<Record<'bankCode' | 'accountType' | 'accountNumber', string>> {
  const errors: Partial<Record<'bankCode' | 'accountType' | 'accountNumber', string>> = {};

  if (!values.bankCode) {
    errors.bankCode = 'Selecciona un banco';
  }
  if (!values.accountType) {
    errors.accountType = 'Selecciona el tipo de cuenta';
  }
  if (options.requireAccountNumber || values.accountNumber.trim()) {
    const accountError = validateAccountNumberForBank(values.bankCode, values.accountNumber);
    if (accountError) {
      errors.accountNumber = accountError;
    }
  } else if (options.requireAccountNumber) {
    errors.accountNumber = 'El número de cuenta es obligatorio';
  }

  return errors;
}

export function resolveBankName(bankCode: string): string {
  return findColombianBank(bankCode)?.name ?? bankCode;
}

export function formatMaskedAccountNumber(masked: string, last4?: string): string {
  const suffix = last4 ?? masked.replace(/\D/g, '').slice(-4);
  if (!suffix) return masked;
  return `**** **** ${suffix}`;
}

export function accountTypeLabel(type: 'SAVINGS' | 'CHECKING'): string {
  return type === 'SAVINGS' ? 'Ahorros' : 'Corriente';
}

export const ACCOUNT_TYPE_OPTIONS = [
  { value: 'SAVINGS', label: 'Ahorros' },
  { value: 'CHECKING', label: 'Corriente' },
] as const;

export function listKnownBankCodes(): string[] {
  return COLOMBIAN_BANKS.map((bank) => bank.code);
}
