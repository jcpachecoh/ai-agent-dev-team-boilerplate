import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateEmployeePositionData,
  EmployeePositionHistoryRecord,
  EmployeePositionRecord,
  IEmployeePositionsRepository,
  ListEmployeePositionsOptions,
  UpdateEmployeePositionData,
} from '../interfaces/employee-positions.interfaces';

@Injectable()
export class EmployeePositionsRepository implements IEmployeePositionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    options: ListEmployeePositionsOptions = {},
  ): Promise<EmployeePositionRecord[]> {
    const where: Prisma.EmployeePositionWhereInput = {
      tenantId,
      ...(options.includeInactive ? {} : { isActive: true }),
      ...(options.area ? { area: options.area } : {}),
      ...(options.search
        ? {
            OR: [
              { title: { contains: options.search, mode: 'insensitive' } },
              { area: { contains: options.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const rows = await this.prisma.employeePosition.findMany({
      where,
      orderBy: [{ area: 'asc' }, { title: 'asc' }],
    });

    return rows.map((row) => this.mapPosition(row));
  }

  async findById(tenantId: string, id: string): Promise<EmployeePositionRecord | null> {
    const row = await this.prisma.employeePosition.findFirst({
      where: { id, tenantId },
    });
    return row ? this.mapPosition(row) : null;
  }

  async findByTitle(tenantId: string, title: string): Promise<EmployeePositionRecord | null> {
    const row = await this.prisma.employeePosition.findFirst({
      where: { tenantId, title },
    });
    return row ? this.mapPosition(row) : null;
  }

  async countActiveEmployeesByPosition(tenantId: string, positionId: string): Promise<number> {
    return this.prisma.employeeDetails.count({
      where: {
        tenantId,
        positionId,
        isActive: true,
        deletedAt: null,
      },
    });
  }

  async create(
    tenantId: string,
    data: CreateEmployeePositionData,
  ): Promise<EmployeePositionRecord> {
    const row = await this.prisma.employeePosition.create({
      data: {
        tenantId,
        title: data.title,
        area: data.area,
        baseSalaryRange: data.baseSalaryRange,
      },
    });
    return this.mapPosition(row);
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateEmployeePositionData,
  ): Promise<EmployeePositionRecord> {
    const row = await this.prisma.employeePosition.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.area !== undefined ? { area: data.area } : {}),
        ...(data.baseSalaryRange !== undefined ? { baseSalaryRange: data.baseSalaryRange } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });

    if (row.tenantId !== tenantId) {
      throw new Error('Tenant mismatch after update');
    }

    return this.mapPosition(row);
  }

  async deactivate(tenantId: string, id: string): Promise<EmployeePositionRecord> {
    return this.update(tenantId, id, { isActive: false });
  }

  async findHistoryByEmployee(
    tenantId: string,
    employeeDetailsId: string,
  ): Promise<EmployeePositionHistoryRecord[]> {
    const rows = await this.prisma.employeePositionHistory.findMany({
      where: { tenantId, employeeDetailsId },
      orderBy: { effectiveFrom: 'desc' },
    });
    return rows.map((row) => this.mapHistory(row));
  }

  async closeOpenHistory(
    tenantId: string,
    employeeDetailsId: string,
    effectiveTo: Date,
  ): Promise<void> {
    await this.prisma.employeePositionHistory.updateMany({
      where: {
        tenantId,
        employeeDetailsId,
        effectiveTo: null,
      },
      data: { effectiveTo },
    });
  }

  async createHistoryEntry(data: {
    tenantId: string;
    employeeDetailsId: string;
    positionId: string;
    effectiveFrom: Date;
    changedBy?: string;
  }): Promise<EmployeePositionHistoryRecord> {
    const row = await this.prisma.employeePositionHistory.create({
      data: {
        tenantId: data.tenantId,
        employeeDetailsId: data.employeeDetailsId,
        positionId: data.positionId,
        effectiveFrom: data.effectiveFrom,
        changedBy: data.changedBy ?? null,
      },
    });
    return this.mapHistory(row);
  }

  private mapPosition(row: {
    id: string;
    tenantId: string;
    title: string;
    area: string;
    baseSalaryRange: Prisma.Decimal;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): EmployeePositionRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      title: row.title,
      area: row.area,
      baseSalaryRange: row.baseSalaryRange.toString(),
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private mapHistory(row: {
    id: string;
    tenantId: string;
    employeeDetailsId: string;
    positionId: string;
    effectiveFrom: Date;
    effectiveTo: Date | null;
    changedBy: string | null;
    createdAt: Date;
  }): EmployeePositionHistoryRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      employeeDetailsId: row.employeeDetailsId,
      positionId: row.positionId,
      effectiveFrom: row.effectiveFrom,
      effectiveTo: row.effectiveTo,
      changedBy: row.changedBy,
      createdAt: row.createdAt,
    };
  }
}
