import { payrollFetch, PayrollApiError } from './payroll.client';
import type {
  CreateBankAccountInput,
  EmployeeBankAccount,
  FinancialProfile,
  UpdateBankAccountInput,
} from '../types/bank-account.types';
import type {
  EmployeeTaxInformation,
  PaymentHistoryPage,
  UpsertTaxInformationInput,
} from '../types/financial-profile.types';

export async function getFinancialProfile(employeeId: string): Promise<FinancialProfile | null> {
  try {
    return await payrollFetch<FinancialProfile>(`/employees/${employeeId}/financial-profile`);
  } catch (error) {
    if (error instanceof PayrollApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function ensureFinancialProfile(employeeId: string): Promise<FinancialProfile> {
  const existing = await getFinancialProfile(employeeId);
  if (existing) return existing;

  return payrollFetch<FinancialProfile>(`/employees/${employeeId}/financial-profile`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function listEmployeeBankAccounts(employeeId: string): Promise<EmployeeBankAccount[]> {
  try {
    return await payrollFetch<EmployeeBankAccount[]>(
      `/employees/${employeeId}/financial-profile/bank-accounts`,
    );
  } catch (error) {
    if (error instanceof PayrollApiError && error.status === 404) {
      return [];
    }
    throw error;
  }
}

export async function createEmployeeBankAccount(
  employeeId: string,
  input: CreateBankAccountInput,
): Promise<EmployeeBankAccount> {
  await ensureFinancialProfile(employeeId);
  return payrollFetch<EmployeeBankAccount>(
    `/employees/${employeeId}/financial-profile/bank-accounts`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export async function updateEmployeeBankAccount(
  employeeId: string,
  accountId: string,
  input: UpdateBankAccountInput,
): Promise<EmployeeBankAccount> {
  return payrollFetch<EmployeeBankAccount>(
    `/employees/${employeeId}/financial-profile/bank-accounts/${accountId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
}

export async function deleteEmployeeBankAccount(
  employeeId: string,
  accountId: string,
): Promise<void> {
  await payrollFetch<boolean>(
    `/employees/${employeeId}/financial-profile/bank-accounts/${accountId}`,
    { method: 'DELETE' },
  );
}

export async function setPrimaryEmployeeBankAccount(
  employeeId: string,
  accountId: string,
): Promise<FinancialProfile> {
  return payrollFetch<FinancialProfile>(
    `/employees/${employeeId}/financial-profile/bank-accounts/${accountId}/set-primary`,
    { method: 'PATCH' },
  );
}

export async function getEmployeeTaxInformation(
  employeeId: string,
): Promise<EmployeeTaxInformation | null> {
  try {
    return await payrollFetch<EmployeeTaxInformation | null>(
      `/employees/${employeeId}/financial-profile/tax-information`,
    );
  } catch (error) {
    if (error instanceof PayrollApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function upsertEmployeeTaxInformation(
  employeeId: string,
  input: UpsertTaxInformationInput,
): Promise<EmployeeTaxInformation> {
  await ensureFinancialProfile(employeeId);
  return payrollFetch<EmployeeTaxInformation>(
    `/employees/${employeeId}/financial-profile/tax-information`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  );
}

export async function listEmployeePaymentHistory(
  employeeId: string,
  params: { cursor?: string | null; take?: number } = {},
): Promise<PaymentHistoryPage> {
  const search = new URLSearchParams();
  if (params.cursor) search.set('cursor', params.cursor);
  if (params.take != null) search.set('take', String(params.take));

  const query = search.toString();
  const suffix = query ? `?${query}` : '';

  try {
    return await payrollFetch<PaymentHistoryPage>(
      `/employees/${employeeId}/financial-profile/payment-history${suffix}`,
    );
  } catch (error) {
    if (error instanceof PayrollApiError && error.status === 404) {
      return { edges: [], pageInfo: { hasNextPage: false, endCursor: null } };
    }
    throw error;
  }
}
