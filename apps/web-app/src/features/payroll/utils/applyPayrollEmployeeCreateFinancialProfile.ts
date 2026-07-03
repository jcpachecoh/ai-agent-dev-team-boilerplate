import {
  createEmployeeBankAccount,
  upsertEmployeeTaxInformation,
} from '../api/financial-profile.client';
import type { PayrollEmployeeCreateWizardPayload } from '../types/payroll-employee-create-wizard.types';
import { resolveBankName } from './bank-account-validation';
import { parseWithholdingRatePercent } from './financial-profile-display';

export async function applyPayrollEmployeeCreateFinancialProfile(
  employeeId: string,
  payload: Pick<PayrollEmployeeCreateWizardPayload, 'bankAccount' | 'taxInformation'>,
): Promise<void> {
  if (payload.bankAccount) {
    await createEmployeeBankAccount(employeeId, {
      bankName: resolveBankName(payload.bankAccount.bankCode),
      bankCode: payload.bankAccount.bankCode,
      accountType: payload.bankAccount.accountType,
      accountNumber: payload.bankAccount.accountNumber,
      isPrimary: true,
    });
  }

  if (payload.taxInformation) {
    const withholdingRate = payload.taxInformation.withholdingApplicable
      ? parseWithholdingRatePercent(payload.taxInformation.withholdingRatePercent)
      : undefined;

    await upsertEmployeeTaxInformation(employeeId, {
      taxId: payload.taxInformation.taxId,
      taxRegime: payload.taxInformation.taxRegime.trim() || undefined,
      withholdingApplicable: payload.taxInformation.withholdingApplicable,
      withholdingRate,
    });
  }
}
