import type { BankAccountType } from './bank-account.types';
import type { EmployeeAssetDraft } from './employee-asset.types';
import type { PayrollEmployeeFormValues } from './payroll.types';

export interface PayrollEmployeeCreateBankDraft {
  bankCode: string;
  accountType: BankAccountType;
  accountNumber: string;
  /** Present only when editing an existing account — signals PATCH instead of POST. */
  bankAccountId?: string;
  /** Display-only masked value preloaded from the backend, e.g. "**** **** 1234". */
  maskedAccountNumber?: string;
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
  assetDrafts?: EmployeeAssetDraft[];
}
