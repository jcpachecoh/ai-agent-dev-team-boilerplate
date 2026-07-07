import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateEmployeeAssetData,
  EmployeeAssetRecord,
  IEmployeeAssetsRepository,
  ListEmployeeAssetsOptions,
  UpdateEmployeeAssetData,
} from '../interfaces/employee-assets.interfaces';

@Injectable()
export class EmployeeAssetsRepository implements IEmployeeAssetsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, data: CreateEmployeeAssetData): Promise<EmployeeAssetRecord> {
    const row = await this.prisma.employeeAsset.create({
      data: {
        tenantId,
        employeeId: data.employeeId,
        assetName: data.assetName,
        type: data.type,
        value: data.value,
        assignmentDate: data.assignmentDate ?? new Date(),
        notes: data.notes,
        storageObjectId: data.storageObjectId ?? null,
      },
    });
    return this.map(row);
  }

  async findById(tenantId: string, id: string): Promise<EmployeeAssetRecord | null> {
    const row = await this.prisma.employeeAsset.findFirst({ where: { id, tenantId } });
    return row ? this.map(row) : null;
  }

  async findByEmployee(
    tenantId: string,
    employeeId: string,
    options: ListEmployeeAssetsOptions = {},
  ): Promise<EmployeeAssetRecord[]> {
    const where: Prisma.EmployeeAssetWhereInput = {
      tenantId,
      employeeId,
      ...(options.status ? { status: options.status } : {}),
      ...(options.type ? { type: options.type } : {}),
    };
    const rows = await this.prisma.employeeAsset.findMany({
      where,
      orderBy: { assignmentDate: 'desc' },
    });
    return rows.map((r) => this.map(r));
  }

  async findActiveByEmployeeAndName(
    tenantId: string,
    employeeId: string,
    assetName: string,
  ): Promise<EmployeeAssetRecord | null> {
    const row = await this.prisma.employeeAsset.findFirst({
      where: { tenantId, employeeId, assetName, status: 'ACTIVO' },
    });
    return row ? this.map(row) : null;
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateEmployeeAssetData,
  ): Promise<EmployeeAssetRecord> {
    const row = await this.prisma.employeeAsset.update({
      where: { id },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.value !== undefined ? { value: data.value } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.storageObjectId !== undefined ? { storageObjectId: data.storageObjectId } : {}),
      },
    });
    if (row.tenantId !== tenantId) {
      throw new Error('Tenant mismatch after update');
    }
    return this.map(row);
  }

  private map(row: {
    id: string;
    tenantId: string;
    employeeId: string;
    assetName: string;
    type: import('@prisma/client').AssetType;
    assignmentDate: Date;
    value: Prisma.Decimal;
    status: import('@prisma/client').AssetStatus;
    notes: string | null;
    storageObjectId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): EmployeeAssetRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      employeeId: row.employeeId,
      assetName: row.assetName,
      type: row.type,
      assignmentDate: row.assignmentDate,
      value: row.value.toString(),
      status: row.status,
      notes: row.notes,
      storageObjectId: row.storageObjectId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
