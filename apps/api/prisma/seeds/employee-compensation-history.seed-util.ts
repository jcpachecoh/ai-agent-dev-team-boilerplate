import { EmployeeCatalogType, Prisma, PrismaClient, SalaryType } from '@prisma/client';
import { EmployeeHistoryRepository } from '../../src/payroll/repository/employee-history.repository';
import { resolveInitialEffectiveDate } from '../../src/payroll/utils/employee-history-effective-date.util';

/**
 * OS-588 (fase infraestructura) — reutiliza el mismo repository/sync que
 * PayrollRepository/AdminUsersRepository para que ningún EmployeeDetails creado por seed
 * quede sin historial salarial/de fondos. `syncSalaryHistoryTx`/`syncFundHistoryTx` son
 * no-op si el valor no cambió, por lo que es seguro invocarlos después de cada upsert sin
 * importar si tomó la rama create o update (idempotente en reseeds).
 */
const employeeHistoryRepository = new EmployeeHistoryRepository({} as never);

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
  await employeeHistoryRepository.syncSalaryHistoryTx(prisma, {
    tenantId: employee.tenantId,
    employeeDetailsId: employee.id,
    salaryType: employee.salaryType,
    salaryAmount: employee.salaryAmount,
    effectiveFrom,
  });
  await employeeHistoryRepository.syncFundHistoryTx(prisma, {
    tenantId: employee.tenantId,
    employeeDetailsId: employee.id,
    fundType: EmployeeCatalogType.CESANTIAS_FUND,
    fundName: employee.cesantiasFundName,
    effectiveFrom,
  });
  await employeeHistoryRepository.syncFundHistoryTx(prisma, {
    tenantId: employee.tenantId,
    employeeDetailsId: employee.id,
    fundType: EmployeeCatalogType.PENSION_FUND,
    fundName: employee.pensionFundName,
    effectiveFrom,
  });
}
