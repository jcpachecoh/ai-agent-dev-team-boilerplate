import type { BankAccountType } from './bank-account.types';
import type { PayrollEmployeeFormValues } from './payroll.types';

export interface PayrollEmployeeCreateBankDraft {
  bankCode: string;
  accountType: BankAccountType;
  accountNumber: string;
}

export interface PayrollEmployeeCreateTaxDraft {
  taxId: string;
  taxRegime: string;
  withholdingApplicable: boolean;
  withholdingRatePercent: string;
}

export interface PayrollEmployeeCreateWizardPayload {
  employee: PayrollEmployeeFormValues;
  bankAccount?: PayrollEmployeeCreateBankDraft;
  taxInformation?: PayrollEmployeeCreateTaxDraft;
}
