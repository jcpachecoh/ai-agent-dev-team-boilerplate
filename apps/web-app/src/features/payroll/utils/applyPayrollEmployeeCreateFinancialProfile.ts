import type { QueryClient } from '@tanstack/react-query';

import {
  createEmployeeBankAccount,
  updateEmployeeBankAccount,
  upsertEmployeeTaxInformation,
} from '../api/financial-profile.client';
import { createEmployeeAsset } from '../api/employee-assets.graphql';
import { uploadEmployeeDocument } from '../api/employee-assets.upload';
import { payrollKeys } from '../api/queryKeys';
import type { PayrollEmployeeCreateWizardPayload } from '../types/payroll-employee-create-wizard.types';
import { resolveBankName } from './bank-account-validation';
import { parseWithholdingRatePercent } from './financial-profile-display';

export async function applyPayrollEmployeeCreateFinancialProfile(
  employeeId: string,
  payload: Pick<
    PayrollEmployeeCreateWizardPayload,
    'bankAccount' | 'taxInformation' | 'assetDrafts'
  >,
  queryClient?: QueryClient,
): Promise<void> {
  if (payload.bankAccount) {
    if (payload.bankAccount.bankAccountId) {
      await updateEmployeeBankAccount(employeeId, payload.bankAccount.bankAccountId, {
        bankName: resolveBankName(payload.bankAccount.bankCode),
        bankCode: payload.bankAccount.bankCode,
        accountType: payload.bankAccount.accountType,
        ...(payload.bankAccount.accountNumber
          ? { accountNumber: payload.bankAccount.accountNumber }
          : {}),
      });
    } else {
      await createEmployeeBankAccount(employeeId, {
        bankName: resolveBankName(payload.bankAccount.bankCode),
        bankCode: payload.bankAccount.bankCode,
        accountType: payload.bankAccount.accountType,
        accountNumber: payload.bankAccount.accountNumber,
        isPrimary: true,
      });
    }
    await queryClient?.invalidateQueries({ queryKey: payrollKeys.bankAccounts(employeeId) });
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
    await queryClient?.invalidateQueries({ queryKey: payrollKeys.taxInformation(employeeId) });
  }

  if (payload.assetDrafts && payload.assetDrafts.length > 0) {
    await Promise.allSettled(
      payload.assetDrafts.map(async (draft) => {
        let storageObjectId: string | undefined;
        if (draft.file) {
          try {
            const uploaded = await uploadEmployeeDocument(employeeId, draft.file);
            storageObjectId = uploaded.id;
          } catch {
            // file upload failed — create asset without attachment
          }
        }
        return createEmployeeAsset({
          employeeId,
          assetName: draft.assetName.trim(),
          type: draft.type as import('../types/employee-asset.types').AssetType,
          value: Number(draft.value),
          notes: draft.notes?.trim() || undefined,
          storageObjectId,
        });
      }),
    );
    await queryClient?.invalidateQueries({ queryKey: payrollKeys.assets(employeeId) });
  }
}
