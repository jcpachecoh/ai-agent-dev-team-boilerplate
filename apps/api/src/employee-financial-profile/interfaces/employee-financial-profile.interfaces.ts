import type {
  BankAccountType,
  EmployeeBankAccount,
  EmployeeFinancialProfile,
  EmployeePaymentHistory,
  EmployeeTaxInformation,
  FinancialPaymentStatus,
  PaymentMethod,
} from '@prisma/client';

// ── Employee resolution ───────────────────────────────────────────────────────

export interface EmployeeRecord {
  id: string;
  tenantId: string;
  isActive: boolean;
  deletedAt: Date | null;
}

// ── Financial Profile ─────────────────────────────────────────────────────────

export interface CreateFinancialProfileData {
  paymentMethod?: PaymentMethod;
}

export interface UpdateFinancialProfileData {
  paymentMethod?: PaymentMethod;
  primaryBankAccountId?: string | null;
}

// ── Bank Account ──────────────────────────────────────────────────────────────

export interface CreateBankAccountData {
  bankName: string;
  bankCode?: string;
  accountType: BankAccountType;
  /** Plain account number — will be encrypted by the service before persisting. */
  accountNumber: string;
  isPrimary?: boolean;
}

export interface UpdateBankAccountData {
  bankName?: string;
  bankCode?: string;
  accountType?: BankAccountType;
  /** Plain account number — will be encrypted by the service before persisting. */
  accountNumber?: string;
}

// ── Tax Information ───────────────────────────────────────────────────────────

export interface UpsertTaxInformationData {
  /** Plain tax ID — will be encrypted by the service before persisting. */
  taxId: string;
  taxRegime?: string;
  withholdingApplicable?: boolean;
  withholdingRate?: number;
}

// ── Payment History (internal write only) ────────────────────────────────────

export interface CreatePaymentHistoryData {
  bankAccountId?: string;
  periodYear: number;
  periodMonth: number;
  grossAmount: number;
  totalDeductions: number;
  netAmount: number;
  deductionBreakdown?: Record<string, unknown>;
  paymentDate?: Date;
  paymentMethod: PaymentMethod;
  status?: FinancialPaymentStatus;
  transactionReference?: string;
}

// ── Cursor pagination ─────────────────────────────────────────────────────────

export interface PaymentHistoryPage {
  edges: EmployeePaymentHistory[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
}

// ── Repository interface ──────────────────────────────────────────────────────

export interface IEmployeeFinancialProfileRepository {
  findEmployee(employeeDetailsId: string): Promise<EmployeeRecord | null>;
  findProfileByEmployee(
    tenantId: string,
    employeeDetailsId: string,
  ): Promise<EmployeeFinancialProfile | null>;
  findProfileById(tenantId: string, id: string): Promise<EmployeeFinancialProfile | null>;
  createProfile(
    tenantId: string,
    employeeDetailsId: string,
    data: CreateFinancialProfileData,
  ): Promise<EmployeeFinancialProfile>;
  updateProfile(
    tenantId: string,
    id: string,
    data: UpdateFinancialProfileData,
  ): Promise<EmployeeFinancialProfile>;
  softDeleteProfile(tenantId: string, id: string): Promise<void>;

  findBankAccounts(tenantId: string, financialProfileId: string): Promise<EmployeeBankAccount[]>;
  findBankAccountById(
    tenantId: string,
    id: string,
    financialProfileId: string,
  ): Promise<EmployeeBankAccount | null>;
  createBankAccount(
    tenantId: string,
    financialProfileId: string,
    data: {
      bankName: string;
      bankCode?: string;
      accountType: BankAccountType;
      accountNumberEncrypted: string;
      accountLast4: string;
      isPrimary: boolean;
    },
  ): Promise<EmployeeBankAccount>;
  updateBankAccount(
    tenantId: string,
    id: string,
    data: {
      bankName?: string;
      bankCode?: string;
      accountType?: BankAccountType;
      accountNumberEncrypted?: string;
      accountLast4?: string;
    },
  ): Promise<EmployeeBankAccount>;
  softDeleteBankAccount(tenantId: string, id: string): Promise<void>;
  clearPrimaryBankAccounts(tenantId: string, financialProfileId: string): Promise<void>;
  setBankAccountPrimary(tenantId: string, id: string): Promise<void>;

  findTaxInformation(
    tenantId: string,
    financialProfileId: string,
  ): Promise<EmployeeTaxInformation | null>;
  upsertTaxInformation(
    tenantId: string,
    financialProfileId: string,
    data: {
      taxIdEncrypted: string;
      taxIdLast4: string;
      taxRegime?: string;
      withholdingApplicable: boolean;
      withholdingRate?: number;
    },
  ): Promise<EmployeeTaxInformation>;

  findPaymentHistory(
    tenantId: string,
    financialProfileId: string,
    cursor?: string,
    take?: number,
  ): Promise<PaymentHistoryPage>;
}

// ── Service interface ─────────────────────────────────────────────────────────

export interface IEmployeeFinancialProfileService {
  getOrCreateProfile(
    tenantId: string,
    employeeDetailsId: string,
    actorUserId: string,
    data?: CreateFinancialProfileData,
  ): Promise<EmployeeFinancialProfile>;
  updateProfile(
    tenantId: string,
    employeeDetailsId: string,
    actorUserId: string,
    data: UpdateFinancialProfileData,
  ): Promise<EmployeeFinancialProfile>;
  getProfile(tenantId: string, employeeDetailsId: string): Promise<EmployeeFinancialProfile>;

  createBankAccount(
    tenantId: string,
    employeeDetailsId: string,
    actorUserId: string,
    data: CreateBankAccountData,
  ): Promise<EmployeeBankAccount>;
  updateBankAccount(
    tenantId: string,
    id: string,
    employeeDetailsId: string,
    actorUserId: string,
    data: UpdateBankAccountData,
  ): Promise<EmployeeBankAccount>;
  softDeleteBankAccount(
    tenantId: string,
    id: string,
    employeeDetailsId: string,
    actorUserId: string,
  ): Promise<void>;
  setPrimaryBankAccount(
    tenantId: string,
    id: string,
    employeeDetailsId: string,
    actorUserId: string,
  ): Promise<EmployeeFinancialProfile>;
  getBankAccounts(tenantId: string, employeeDetailsId: string): Promise<EmployeeBankAccount[]>;

  upsertTaxInformation(
    tenantId: string,
    employeeDetailsId: string,
    actorUserId: string,
    data: UpsertTaxInformationData,
  ): Promise<EmployeeTaxInformation>;
  getTaxInformation(
    tenantId: string,
    employeeDetailsId: string,
  ): Promise<EmployeeTaxInformation | null>;

  getPaymentHistory(
    tenantId: string,
    employeeDetailsId: string,
    cursor?: string,
    take?: number,
  ): Promise<PaymentHistoryPage>;
}
