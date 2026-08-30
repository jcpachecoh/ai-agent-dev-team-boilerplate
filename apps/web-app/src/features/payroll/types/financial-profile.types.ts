export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHECK';

export type FinancialPaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';

export interface EmployeeTaxInformation {
  id: string;
  tenantId: string;
  financialProfileId: string;
  maskedTaxId: string;
  taxIdLast4: string;
  taxRegime?: string | null;
  withholdingApplicable: boolean;
  withholdingRate?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertTaxInformationInput {
  taxId: string;
  taxRegime?: string;
  withholdingApplicable?: boolean;
  withholdingRate?: number;
}

export interface EmployeePaymentHistoryRecord {
  id: string;
  tenantId: string;
  financialProfileId: string;
  bankAccountId?: string | null;
  periodYear: number;
  periodMonth: number;
  grossAmount: number;
  totalDeductions: number;
  netAmount: number;
  paymentDate?: string | null;
  paymentMethod: PaymentMethod;
  status: FinancialPaymentStatus;
  transactionReference?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentHistoryPage {
  edges: EmployeePaymentHistoryRecord[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
}

export interface TaxInformationFormValues {
  taxId: string;
  taxRegime: string;
  withholdingApplicable: boolean;
  withholdingRatePercent: string;
}
