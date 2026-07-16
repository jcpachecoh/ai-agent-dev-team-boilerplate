import { ConflictException, Injectable } from '@nestjs/common';
import { EmploymentContract, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateInitialContractData,
  EmploymentContractRecord,
  IEmployeeContractRepository,
  StartNewContractData,
  SyncActiveContractData,
  TerminateContractData,
} from '../interfaces/employee-contract.interfaces';

@Injectable()
export class EmployeeContractRepository implements IEmployeeContractRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveContract(
    tenantId: string,
    employeeDetailsId: string,
  ): Promise<EmploymentContractRecord | null> {
    const row = await this.prisma.employmentContract.findFirst({
      where: { tenantId, employeeDetailsId, status: 'ACTIVO' },
    });
    return row ? this.map(row) : null;
  }

  async findAllByEmployee(
    tenantId: string,
    employeeDetailsId: string,
  ): Promise<EmploymentContractRecord[]> {
    const rows = await this.prisma.employmentContract.findMany({
      where: { tenantId, employeeDetailsId },
      orderBy: { startDate: 'asc' },
    });
    return rows.map((row): EmploymentContractRecord => this.map(row));
  }

  async findById(tenantId: string, id: string): Promise<EmploymentContractRecord | null> {
    const row = await this.prisma.employmentContract.findFirst({ where: { tenantId, id } });
    return row ? this.map(row) : null;
  }

  async findContractAt(
    tenantId: string,
    employeeDetailsId: string,
    asOfDate: Date,
  ): Promise<EmploymentContractRecord | null> {
    const row = await this.prisma.employmentContract.findFirst({
      where: {
        tenantId,
        employeeDetailsId,
        startDate: { lte: asOfDate },
        OR: [{ status: 'ACTIVO' }, { terminationDate: { gte: asOfDate } }],
      },
      orderBy: { startDate: 'desc' },
    });
    return row ? this.map(row) : null;
  }

  async findContractsAsOfForTenant(
    tenantId: string,
    asOfDate: Date,
  ): Promise<EmploymentContractRecord[]> {
    // Una sola query tenant-wide; misma ventana temporal que findContractAt.
    // Deduplicación en memoria: orderBy startDate desc → primer hit por empleado gana.
    const rows = await this.prisma.employmentContract.findMany({
      where: {
        tenantId,
        startDate: { lte: asOfDate },
        OR: [{ status: 'ACTIVO' }, { terminationDate: { gte: asOfDate } }],
      },
      orderBy: { startDate: 'desc' },
    });

    const byEmployee = new Map<string, EmploymentContract>();
    for (const row of rows) {
      if (!byEmployee.has(row.employeeDetailsId)) {
        byEmployee.set(row.employeeDetailsId, row);
      }
    }

    return [...byEmployee.values()].map((row): EmploymentContractRecord => this.map(row));
  }

  async createInitialContractTx(
    tx: Prisma.TransactionClient,
    data: CreateInitialContractData,
  ): Promise<EmploymentContractRecord> {
    const row = await tx.employmentContract.create({
      data: {
        tenantId: data.tenantId,
        employeeDetailsId: data.employeeDetailsId,
        contractType: data.contractType,
        startDate: data.startDate,
        agreedEndDate: data.agreedEndDate,
        status: 'ACTIVO',
        activeSlot: true,
        changedBy: data.changedBy ?? null,
      },
    });
    return this.map(row);
  }

  async syncActiveContractTx(
    tx: Prisma.TransactionClient,
    data: SyncActiveContractData,
  ): Promise<void> {
    if (
      data.contractType === undefined &&
      data.startDate === undefined &&
      data.agreedEndDate === undefined
    ) {
      return;
    }

    const active = await tx.employmentContract.findFirst({
      where: {
        tenantId: data.tenantId,
        employeeDetailsId: data.employeeDetailsId,
        status: 'ACTIVO',
      },
    });

    // Self-heal: un EmployeeDetails legado (creado antes de esta migración/feature) sin
    // contrato ACTIVO todavía. No debería ocurrir tras el backfill de la migración, pero se
    // cubre defensivamente en vez de fallar el update genérico del empleado por esto.
    if (!active) {
      await tx.employmentContract.create({
        data: {
          tenantId: data.tenantId,
          employeeDetailsId: data.employeeDetailsId,
          contractType: data.contractType!,
          startDate: data.startDate ?? new Date(),
          agreedEndDate: data.agreedEndDate ?? null,
          status: 'ACTIVO',
          activeSlot: true,
          changedBy: data.changedBy ?? null,
        },
      });
      return;
    }

    await tx.employmentContract.update({
      where: { id: active.id },
      data: {
        ...(data.contractType !== undefined ? { contractType: data.contractType } : {}),
        ...(data.startDate !== undefined ? { startDate: data.startDate } : {}),
        ...(data.agreedEndDate !== undefined ? { agreedEndDate: data.agreedEndDate } : {}),
        changedBy: data.changedBy ?? active.changedBy,
      },
    });
  }

  async terminateActiveContractTx(
    tx: Prisma.TransactionClient,
    data: TerminateContractData,
  ): Promise<EmploymentContractRecord> {
    const active = await tx.employmentContract.findFirst({
      where: {
        tenantId: data.tenantId,
        employeeDetailsId: data.employeeDetailsId,
        status: 'ACTIVO',
      },
    });
    if (!active) {
      throw new ConflictException(
        `El empleado ${data.employeeDetailsId} no tiene un contrato ACTIVO para terminar`,
      );
    }

    const row = await tx.employmentContract.update({
      where: { id: active.id },
      data: {
        status: 'TERMINADO',
        activeSlot: null,
        terminationDate: data.terminationDate,
        terminationReason: data.terminationReason,
        terminationNotes: data.terminationNotes ?? null,
        changedBy: data.changedBy ?? active.changedBy,
      },
    });

    // OS-591 (fase 3) — `isActive` es una CONSECUENCIA del estado del contrato, nunca se
    // escribe de forma independiente (ver tasks/OS-591.md §15.4). Terminar el contrato
    // ACTIVO es el único camino legítimo para que un empleado quede inactivo.
    await tx.employeeDetails.update({
      where: { id: data.employeeDetailsId },
      data: { isActive: false, deletedAt: new Date() },
    });

    return this.map(row);
  }

  async startNewContractTx(
    tx: Prisma.TransactionClient,
    data: StartNewContractData,
  ): Promise<EmploymentContractRecord> {
    const active = await tx.employmentContract.findFirst({
      where: {
        tenantId: data.tenantId,
        employeeDetailsId: data.employeeDetailsId,
        status: 'ACTIVO',
      },
    });
    if (active) {
      throw new ConflictException(
        `El empleado ${data.employeeDetailsId} ya tiene un contrato ACTIVO — termínelo antes de iniciar uno nuevo`,
      );
    }

    try {
      const row = await tx.employmentContract.create({
        data: {
          tenantId: data.tenantId,
          employeeDetailsId: data.employeeDetailsId,
          contractType: data.contractType,
          startDate: data.startDate,
          agreedEndDate: data.agreedEndDate ?? null,
          status: 'ACTIVO',
          activeSlot: true,
          changedBy: data.changedBy ?? null,
        },
      });

      // OS-591 (fase 3) — contraparte de terminateActiveContractTx: recontratar reactiva
      // al empleado. Nunca se reactiva "a mano" sin un contrato ACTIVO nuevo detrás.
      await tx.employeeDetails.update({
        where: { id: data.employeeDetailsId },
        data: { isActive: true, deletedAt: null },
      });

      return this.map(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(
          `El empleado ${data.employeeDetailsId} ya tiene un contrato ACTIVO — termínelo antes de iniciar uno nuevo`,
        );
      }
      throw error;
    }
  }

  private map(row: EmploymentContract): EmploymentContractRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      employeeDetailsId: row.employeeDetailsId,
      contractType: row.contractType,
      startDate: row.startDate,
      agreedEndDate: row.agreedEndDate,
      status: row.status,
      terminationDate: row.terminationDate,
      terminationReason: row.terminationReason,
      terminationNotes: row.terminationNotes,
      activeSlot: row.activeSlot,
      changedBy: row.changedBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
