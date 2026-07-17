import { EmployeeCatalogType, Prisma, PrismaClient, SalaryType } from '@prisma/client';

import { resolveInitialEffectiveDate } from '../../src/shared/employee-history/effective-date.util';
import {
  syncFundHistoryTx,
  syncSalaryHistoryTx,
} from '../../src/shared/employee-history/sync-employee-history';

/**
 * OS-588 (fase infraestructura) — reutiliza la misma lógica de sync que
 * EmployeeHistoryRepository / PayrollRepository / AdminUsersRepository para que ningún
 * EmployeeDetails creado por seed quede sin historial salarial/de fondos.
 * `syncSalaryHistoryTx`/`syncFundHistoryTx` son no-op si el valor no cambió (idempotente).
 */
export async function syncEmployeeCompensationHistory(
  prisma: PrismaClient,
  employee: {
    id: string;
    tenantId: string;
    salaryType: SalaryType;
    salaryAmount: Prisma.Decimal | number;
    cesantiasFundName: string;
    pensionFundName: string;
    contractStart?: Date | null;
    hireDate?: Date | null;
    createdAt?: Date | null;
  },
): Promise<void> {
  const effectiveFrom = resolveInitialEffectiveDate(employee);
  await syncSalaryHistoryTx(prisma, {
    tenantId: employee.tenantId,
    employeeDetailsId: employee.id,
    salaryType: employee.salaryType,
    salaryAmount: employee.salaryAmount,
    effectiveFrom,
  });
  await syncFundHistoryTx(prisma, {
    tenantId: employee.tenantId,
    employeeDetailsId: employee.id,
    fundType: EmployeeCatalogType.CESANTIAS_FUND,
    fundName: employee.cesantiasFundName,
    effectiveFrom,
  });
  await syncFundHistoryTx(prisma, {
    tenantId: employee.tenantId,
    employeeDetailsId: employee.id,
    fundType: EmployeeCatalogType.PENSION_FUND,
    fundName: employee.pensionFundName,
    effectiveFrom,
  });
}
