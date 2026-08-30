export interface ColombianBankOption {
  code: string;
  name: string;
  minLength: number;
  maxLength: number;
}

export const COLOMBIAN_BANKS: ColombianBankOption[] = [
  { code: 'bancolombia', name: 'Bancolombia', minLength: 11, maxLength: 11 },
  { code: 'davivienda', name: 'Davivienda', minLength: 12, maxLength: 12 },
  { code: 'bbva', name: 'BBVA Colombia', minLength: 10, maxLength: 10 },
  { code: 'banco_bogota', name: 'Banco de Bogotá', minLength: 9, maxLength: 11 },
  { code: 'nequi', name: 'Nequi', minLength: 10, maxLength: 10 },
  { code: 'daviplata', name: 'Daviplata', minLength: 10, maxLength: 10 },
  { code: 'banco_occidente', name: 'Banco de Occidente', minLength: 9, maxLength: 11 },
  { code: 'banco_popular', name: 'Banco Popular', minLength: 9, maxLength: 11 },
  { code: 'scotiabank', name: 'Scotiabank Colpatria', minLength: 10, maxLength: 10 },
  { code: 'av_villas', name: 'Banco AV Villas', minLength: 9, maxLength: 11 },
];

export const GENERIC_ACCOUNT_LENGTH = { min: 8, max: 16 } as const;

export function findColombianBank(code: string): ColombianBankOption | undefined {
  return COLOMBIAN_BANKS.find((bank) => bank.code === code);
}

export function buildBankSelectOptions(
  currentBankCode?: string | null,
  currentBankName?: string | null,
): Array<{ value: string; label: string }> {
  const options = COLOMBIAN_BANKS.map((bank) => ({
    value: bank.code,
    label: bank.name,
  }));

  if (currentBankCode && !options.some((option) => option.value === currentBankCode)) {
    options.unshift({
      value: currentBankCode,
      label: currentBankName ?? currentBankCode,
    });
  }

  return options;
}
