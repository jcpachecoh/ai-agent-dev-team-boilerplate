import { ContractTerminationReason, EmployeeContractType, PrismaClient } from '@prisma/client';

import { resolveInitialEffectiveDate } from '../../src/payroll/utils/employee-history-effective-date.util';

/**
 * OS-591 (fase 1) — mismo espíritu que `syncEmployeeCompensationHistory`
 * (employee-compensation-history.seed-util.ts): ningún `EmployeeDetails` sembrado vía
 * `prisma.employeeDetails.upsert` directo (que no pasa por `PayrollRepository.create`, así
 * que no dispara `EmployeeContractRepository.createInitialContractTx`) debe quedar sin su
 * contrato ACTIVO correspondiente. Idempotente: si ya existe un contrato ACTIVO para el
 * empleado, solo actualiza sus campos (no crea uno nuevo — evitaría violar
 * `@@unique([tenantId, employeeDetailsId, activeSlot])`).
 */
export async function syncEmployeeContractHistory(
  prisma: PrismaClient,
  employee: {
    id: string;
    tenantId: string;
    contractType: EmployeeContractType;
    contractStart?: Date | null;
    contractEnd?: Date | null;
    hireDate?: Date | null;
    createdAt?: Date | null;
  },
): Promise<void> {
  const startDate = resolveInitialEffectiveDate(employee);
  const existing = await prisma.employmentContract.findFirst({
    where: { tenantId: employee.tenantId, employeeDetailsId: employee.id, status: 'ACTIVO' },
  });

  if (existing) {
    await prisma.employmentContract.update({
      where: { id: existing.id },
      data: {
        contractType: employee.contractType,
        startDate,
        agreedEndDate: employee.contractEnd ?? null,
      },
    });
    return;
  }

  await prisma.employmentContract.create({
    data: {
      tenantId: employee.tenantId,
      employeeDetailsId: employee.id,
      contractType: employee.contractType,
      startDate,
      agreedEndDate: employee.contractEnd ?? null,
      status: 'ACTIVO',
      activeSlot: true,
    },
  });
}

/**
 * OS-591 (fase 1) — fixture de "recontratación histórica": termina el contrato ACTIVO
 * actual (si existe) con la causal/fecha dadas y crea uno nuevo ACTIVO a continuación.
 * Idempotente: si el contrato ACTIVO ya tiene exactamente `newContract.contractType` y
 * `newContract.startDate`, no hace nada (evita duplicar en reseeds).
 */
export async function seedRehireHistory(
  prisma: PrismaClient,
  params: {
    tenantId: string;
    employeeDetailsId: string;
    previousTerminationDate: Date;
    previousTerminationReason: ContractTerminationReason;
    newContract: {
      contractType: EmployeeContractType;
      startDate: Date;
      agreedEndDate?: Date | null;
    };
  },
): Promise<void> {
  const currentActive = await prisma.employmentContract.findFirst({
    where: {
      tenantId: params.tenantId,
      employeeDetailsId: params.employeeDetailsId,
      status: 'ACTIVO',
    },
  });

  if (
    currentActive &&
    currentActive.contractType === params.newContract.contractType &&
    currentActive.startDate.getTime() === params.newContract.startDate.getTime()
  ) {
    return; // ya sembrado en una corrida anterior
  }

  if (currentActive) {
    await prisma.employmentContract.update({
      where: { id: currentActive.id },
      data: {
        status: 'TERMINADO',
        activeSlot: null,
        terminationDate: params.previousTerminationDate,
        terminationReason: params.previousTerminationReason,
        terminationNotes: 'Seed OS-591: cierre del contrato previo para fixture de recontratación',
      },
    });
  }

  await prisma.employmentContract.create({
    data: {
      tenantId: params.tenantId,
      employeeDetailsId: params.employeeDetailsId,
      contractType: params.newContract.contractType,
      startDate: params.newContract.startDate,
      agreedEndDate: params.newContract.agreedEndDate ?? null,
      status: 'ACTIVO',
      activeSlot: true,
    },
  });
}
