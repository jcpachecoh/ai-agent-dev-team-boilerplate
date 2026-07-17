import { Prisma, type EmployeeCatalogType, type SalaryType } from '@prisma/client';

/** OS-588 — subconjunto de EmployeeCatalogType válido para EmployeeFundHistory.fundType. */
export type EmployeeFundHistoryType = Extract<
  EmployeeCatalogType,
  'CESANTIAS_FUND' | 'PENSION_FUND'
>;

export type SyncSalaryHistoryData = {
  tenantId: string;
  employeeDetailsId: string;
  salaryType: SalaryType;
  salaryAmount: Prisma.Decimal | number;
  effectiveFrom: Date;
  changedBy?: string;
};

export type SyncFundHistoryData = {
  tenantId: string;
  employeeDetailsId: string;
  fundType: EmployeeFundHistoryType;
  fundName: string;
  effectiveFrom: Date;
  changedBy?: string;
};

/**
 * Cierra (si existe) el registro salarial abierto y crea uno nuevo, únicamente si el
 * valor efectivo cambió. Debe ejecutarse dentro de la misma transacción Prisma que el
 * `employeeDetails.update`/`create` que la origina.
 *
 * Shared seed/runtime (OS-588 / OS-612) — sin Nest DI.
 */
export async function syncSalaryHistoryTx(
  tx: Prisma.TransactionClient,
  data: SyncSalaryHistoryData,
): Promise<void> {
  const current = await tx.employeeSalaryHistory.findFirst({
    where: {
      tenantId: data.tenantId,
      employeeDetailsId: data.employeeDetailsId,
      effectiveTo: null,
    },
  });

  const nextAmount = new Prisma.Decimal(data.salaryAmount);
  const unchanged =
    current !== null &&
    current.salaryType === data.salaryType &&
    current.salaryAmount.equals(nextAmount);

  if (unchanged) {
    return;
  }

  if (current) {
    await tx.employeeSalaryHistory.update({
      where: { id: current.id },
      data: { effectiveTo: data.effectiveFrom },
    });
  }

  await tx.employeeSalaryHistory.create({
    data: {
      tenantId: data.tenantId,
      employeeDetailsId: data.employeeDetailsId,
      salaryType: data.salaryType,
      salaryAmount: nextAmount,
      effectiveFrom: data.effectiveFrom,
      changedBy: data.changedBy ?? null,
    },
  });
}

/**
 * Igual que `syncSalaryHistoryTx`, para un `fundType` puntual (CESANTIAS_FUND | PENSION_FUND).
 */
export async function syncFundHistoryTx(
  tx: Prisma.TransactionClient,
  data: SyncFundHistoryData,
): Promise<void> {
  const current = await tx.employeeFundHistory.findFirst({
    where: {
      tenantId: data.tenantId,
      employeeDetailsId: data.employeeDetailsId,
      fundType: data.fundType,
      effectiveTo: null,
    },
  });

  if (current !== null && current.fundName === data.fundName) {
    return;
  }

  if (current) {
    await tx.employeeFundHistory.update({
      where: { id: current.id },
      data: { effectiveTo: data.effectiveFrom },
    });
  }

  await tx.employeeFundHistory.create({
    data: {
      tenantId: data.tenantId,
      employeeDetailsId: data.employeeDetailsId,
      fundType: data.fundType,
      fundName: data.fundName,
      effectiveFrom: data.effectiveFrom,
      changedBy: data.changedBy ?? null,
    },
  });
}
