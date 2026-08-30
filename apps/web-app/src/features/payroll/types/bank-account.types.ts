export type BankAccountType = 'SAVINGS' | 'CHECKING';

export interface EmployeeBankAccount {
  id: string;
  tenantId: string;
  financialProfileId: string;
  bankName: string;
  bankCode?: string | null;
  accountType: BankAccountType;
  maskedAccountNumber: string;
  accountLast4: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface FinancialProfile {
  id: string;
  tenantId: string;
  employeeDetailsId: string;
  paymentMethod: string;
  primaryBankAccountId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBankAccountInput {
  bankName: string;
  bankCode?: string;
  accountType: BankAccountType;
  accountNumber: string;
  isPrimary?: boolean;
}

export interface UpdateBankAccountInput {
  bankName?: string;
  bankCode?: string;
  accountType?: BankAccountType;
  accountNumber?: string;
}

export interface BankAccountFormValues {
  bankCode: string;
  accountType: BankAccountType;
  accountNumber: string;
  isPrimary: boolean;
}
