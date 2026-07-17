import { Injectable } from '@nestjs/common';
import { AuditAction, LeaveStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateMedicalLeaveData,
  IMedicalLeavesRepository,
  ListMedicalLeavesOptions,
  MedicalLeavePayrollPeriodRange,
  MedicalLeaveRecord,
  MedicalLeaveRejectionAudit,
  MedicalLeaveSummary,
  UpdateMedicalLeaveData,
} from '../interfaces/medical-leaves.interfaces';

type MedicalLeaveRow = {
  id: string;
  tenantId: string;
  employeeId: string;
  origin: MedicalLeaveRecord['origin'];
  startDate: Date;
  endDate: Date;
  totalDays: number;
  employerPaidDays: number;
  epsArlPaidDays: number;
  epsArlAmount: MedicalLeaveRecord['epsArlAmount'];
  employerAmount: MedicalLeaveRecord['employerAmount'];
  supportStorageObjectId: string | null;
  status: MedicalLeaveRecord['status'];
  radicatedAt: Date | null;
  recoveredAt: Date | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

@Injectable()
export class MedicalLeavesRepository implements IMedicalLeavesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(tenantId: string, id: string): Promise<MedicalLeaveRecord | null> {
    const row = await this.prisma.medicalLeave.findFirst({
      where: { tenantId, id, deletedAt: null },
    });
    return row ? this.mapLeave(row) : null;
  }

  async create(tenantId: string, data: CreateMedicalLeaveData): Promise<MedicalLeaveRecord> {
    const row = await this.prisma.medicalLeave.create({
      data: {
        tenantId,
        employeeId: data.employeeId,
        origin: data.origin,
        startDate: data.startDate,
        endDate: data.endDate,
        totalDays: data.totalDays,
        employerPaidDays: data.employerPaidDays,
        epsArlPaidDays: data.epsArlPaidDays,
        epsArlAmount: data.epsArlAmount,
        employerAmount: data.employerAmount,
        supportStorageObjectId: data.supportStorageObjectId ?? null,
        status: data.status ?? LeaveStatus.REGISTRADA,
      },
    });
    return this.mapLeave(row);
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateMedicalLeaveData,
  ): Promise<MedicalLeaveRecord> {
    const row = await this.prisma.medicalLeave.update({
      where: { id },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.radicatedAt !== undefined ? { radicatedAt: data.radicatedAt } : {}),
        ...(data.recoveredAt !== undefined ? { recoveredAt: data.recoveredAt } : {}),
        ...(data.rejectedAt !== undefined ? { rejectedAt: data.rejectedAt } : {}),
        ...(data.rejectionReason !== undefined ? { rejectionReason: data.rejectionReason } : {}),
        ...(data.supportStorageObjectId !== undefined
          ? { supportStorageObjectId: data.supportStorageObjectId }
          : {}),
        ...(data.totalDays !== undefined ? { totalDays: data.totalDays } : {}),
        ...(data.employerPaidDays !== undefined ? { employerPaidDays: data.employerPaidDays } : {}),
        ...(data.epsArlPaidDays !== undefined ? { epsArlPaidDays: data.epsArlPaidDays } : {}),
        ...(data.epsArlAmount !== undefined ? { epsArlAmount: data.epsArlAmount } : {}),
        ...(data.employerAmount !== undefined ? { employerAmount: data.employerAmount } : {}),
      },
    });

    if (row.tenantId !== tenantId) {
      throw new Error(`MedicalLeave ${id} does not belong to tenant ${tenantId}`);
    }

    return this.mapLeave(row);
  }

  /**
   * Cambia el estado a RECHAZADA y registra la acción en AuditLog dentro de la
   * misma transacción (NOM-13 / OS-324): quién, cuándo y motivo del rechazo.
   */
  async updateWithRejectionAudit(
    tenantId: string,
    id: string,
    data: UpdateMedicalLeaveData,
    audit: MedicalLeaveRejectionAudit,
  ): Promise<MedicalLeaveRecord> {
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.medicalLeave.update({
        where: { id },
        data: {
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.rejectedAt !== undefined ? { rejectedAt: data.rejectedAt } : {}),
          ...(data.rejectionReason !== undefined ? { rejectionReason: data.rejectionReason } : {}),
        },
      });

      if (row.tenantId !== tenantId) {
        throw new Error(`MedicalLeave ${id} does not belong to tenant ${tenantId}`);
      }

      await tx.auditLog.create({
        data: {
          tenantId,
          action: AuditAction.REJECT,
          entityType: 'MedicalLeave',
          entityId: row.id,
          actorUserId: audit.actorUserId,
          oldValue: audit.oldValue as Prisma.InputJsonValue,
          newValue: audit.newValue as Prisma.InputJsonValue,
        },
      });

      return this.mapLeave(row);
    });
  }

  async softDelete(tenantId: string, id: string): Promise<MedicalLeaveRecord> {
    const row = await this.prisma.medicalLeave.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    if (row.tenantId !== tenantId) {
      throw new Error(`MedicalLeave ${id} does not belong to tenant ${tenantId}`);
    }

    return this.mapLeave(row);
  }

  async listSummaries(
    tenantId: string,
    options: ListMedicalLeavesOptions,
  ): Promise<MedicalLeaveSummary[]> {
    const rows = await this.prisma.medicalLeave.findMany({
      where: this.buildListWhere(tenantId, options),
      orderBy: { startDate: 'desc' },
      take: options.take,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
      include: {
        employee: {
          select: {
            name: true,
            locationId: true,
            location: { select: { name: true } },
          },
        },
      },
    });

    return rows.map((row) => ({
      ...this.mapLeave(row),
      employeeName: row.employee?.name ?? '',
      locationId: row.employee?.locationId ?? null,
      locationName: row.employee?.location?.name ?? null,
    }));
  }

  async sumActiveDaysInCalendarYear(
    tenantId: string,
    employeeId: string,
    year: number,
  ): Promise<number> {
    const result = await this.prisma.medicalLeave.aggregate({
      where: {
        tenantId,
        employeeId,
        deletedAt: null,
        status: { not: LeaveStatus.RECHAZADA },
        startDate: {
          gte: new Date(Date.UTC(year, 0, 1)),
          lte: new Date(Date.UTC(year, 11, 31)),
        },
      },
      _sum: { totalDays: true },
    });

    return result._sum.totalDays ?? 0;
  }

  async findOverlappingForPayrollPeriod(
    tenantId: string,
    employeeId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<MedicalLeavePayrollPeriodRange[]> {
    const rows = await this.prisma.medicalLeave.findMany({
      where: {
        tenantId,
        employeeId,
        deletedAt: null,
        status: { not: LeaveStatus.RECHAZADA },
        startDate: { lte: periodEnd },
        endDate: { gte: periodStart },
      },
      orderBy: { startDate: 'asc' },
    });

    return rows.map((row) => ({
      id: row.id,
      employeeId: row.employeeId,
      origin: row.origin,
      startDate: row.startDate,
      endDate: row.endDate,
      totalDays: row.totalDays,
      employerPaidDays: row.employerPaidDays,
      epsArlPaidDays: row.epsArlPaidDays,
      employerAmount: row.employerAmount,
      epsArlAmount: row.epsArlAmount,
    }));
  }

  async findOverlappingForPayrollPeriodByEmployeeIds(
    tenantId: string,
    employeeIds: string[],
    periodStart: Date,
    periodEnd: Date,
  ): Promise<MedicalLeavePayrollPeriodRange[]> {
    if (employeeIds.length === 0) {
      return [];
    }

    const rows = await this.prisma.medicalLeave.findMany({
      where: {
        tenantId,
        employeeId: { in: employeeIds },
        deletedAt: null,
        status: { not: LeaveStatus.RECHAZADA },
        startDate: { lte: periodEnd },
        endDate: { gte: periodStart },
      },
      orderBy: [{ employeeId: 'asc' }, { startDate: 'asc' }],
    });

    return rows.map((row) => ({
      id: row.id,
      employeeId: row.employeeId,
      origin: row.origin,
      startDate: row.startDate,
      endDate: row.endDate,
      totalDays: row.totalDays,
      employerPaidDays: row.employerPaidDays,
      epsArlPaidDays: row.epsArlPaidDays,
      employerAmount: row.employerAmount,
      epsArlAmount: row.epsArlAmount,
    }));
  }

  private buildListWhere(
    tenantId: string,
    options: ListMedicalLeavesOptions,
  ): Prisma.MedicalLeaveWhereInput {
    const where: Prisma.MedicalLeaveWhereInput = {
      tenantId,
      deletedAt: null,
      ...(options.employeeId ? { employeeId: options.employeeId } : {}),
      ...(options.status ? { status: options.status } : {}),
      ...(options.origin ? { origin: options.origin } : {}),
    };

    if (options.locationId) {
      where.employee = {
        locationId: options.locationId,
        tenantId,
      };
    }

    const dateFilters: Prisma.MedicalLeaveWhereInput[] = [];

    if (options.month) {
      const [yearPart, monthPart] = options.month.split('-');
      const year = Number(yearPart);
      const month = Number(monthPart);
      dateFilters.push(
        { endDate: { gte: new Date(Date.UTC(year, month - 1, 1)) } },
        { startDate: { lte: new Date(Date.UTC(year, month, 0)) } },
      );
    } else {
      if (options.dateFrom) {
        dateFilters.push({ endDate: { gte: options.dateFrom } });
      }
      if (options.dateTo) {
        dateFilters.push({ startDate: { lte: options.dateTo } });
      }
    }

    if (dateFilters.length > 0) {
      where.AND = dateFilters;
    }

    return where;
  }

  private mapLeave(row: MedicalLeaveRow): MedicalLeaveRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      employeeId: row.employeeId,
      origin: row.origin,
      startDate: row.startDate,
      endDate: row.endDate,
      totalDays: row.totalDays,
      employerPaidDays: row.employerPaidDays,
      epsArlPaidDays: row.epsArlPaidDays,
      epsArlAmount: row.epsArlAmount,
      employerAmount: row.employerAmount,
      supportStorageObjectId: row.supportStorageObjectId,
      status: row.status,
      radicatedAt: row.radicatedAt,
      recoveredAt: row.recoveredAt,
      rejectedAt: row.rejectedAt,
      rejectionReason: row.rejectionReason,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    };
  }
}
