import { Injectable } from '@nestjs/common';
import { EmployeeCatalogType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateEmployeeCatalogOptionData,
  EmployeeCatalogOptionRecord,
  IEmployeeCatalogRepository,
  ListEmployeeCatalogOptions,
  UpdateEmployeeCatalogOptionData,
} from '../interfaces/employee-catalog.interfaces';

const CATALOG_SELECT = {
  id: true,
  tenantId: true,
  type: true,
  name: true,
  pilaCode: true,
  isActive: true,
} as const;

@Injectable()
export class EmployeeCatalogRepository implements IEmployeeCatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    options?: ListEmployeeCatalogOptions,
  ): Promise<EmployeeCatalogOptionRecord[]> {
    const includeInactive = options?.includeInactive === true;
    return this.prisma.employeeCatalogOption.findMany({
      where: {
        tenantId,
        ...(includeInactive ? {} : { isActive: true }),
        ...(options?.type ? { type: options.type } : {}),
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
      select: CATALOG_SELECT,
    });
  }

  async findById(tenantId: string, id: string): Promise<EmployeeCatalogOptionRecord | null> {
    return this.prisma.employeeCatalogOption.findFirst({
      where: { id, tenantId },
      select: CATALOG_SELECT,
    });
  }

  async findByTypeAndNameInsensitive(
    tenantId: string,
    type: EmployeeCatalogType,
    name: string,
  ): Promise<EmployeeCatalogOptionRecord | null> {
    return this.prisma.employeeCatalogOption.findFirst({
      where: {
        tenantId,
        type,
        name: { equals: name, mode: 'insensitive' },
      },
      select: CATALOG_SELECT,
    });
  }

  async findActiveByTypeAndPilaCode(
    tenantId: string,
    type: EmployeeCatalogType,
    pilaCode: string,
  ): Promise<EmployeeCatalogOptionRecord | null> {
    return this.prisma.employeeCatalogOption.findFirst({
      where: {
        tenantId,
        type,
        pilaCode,
        isActive: true,
      },
      select: CATALOG_SELECT,
    });
  }

  async findActiveByIdAndType(
    tenantId: string,
    id: string,
    type: EmployeeCatalogType,
  ): Promise<EmployeeCatalogOptionRecord | null> {
    return this.prisma.employeeCatalogOption.findFirst({
      where: {
        id,
        tenantId,
        type,
        isActive: true,
      },
      select: CATALOG_SELECT,
    });
  }

  async countOvertimeRequestReferences(tenantId: string, reasonOptionId: string): Promise<number> {
    return this.prisma.overtimeRequest.count({
      where: {
        tenantId,
        reasonOptionId,
        deletedAt: null,
      },
    });
  }

  async create(
    tenantId: string,
    data: CreateEmployeeCatalogOptionData,
  ): Promise<EmployeeCatalogOptionRecord> {
    return this.prisma.employeeCatalogOption.create({
      data: {
        tenantId,
        type: data.type,
        name: data.name,
        pilaCode: data.pilaCode ?? null,
        isActive: true,
      },
      select: CATALOG_SELECT,
    });
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateEmployeeCatalogOptionData,
  ): Promise<EmployeeCatalogOptionRecord | null> {
    // Scoped by tenantId — never mutate tenantId/type via data.
    const result = await this.prisma.employeeCatalogOption.updateMany({
      where: { id, tenantId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.pilaCode !== undefined ? { pilaCode: data.pilaCode } : {}),
      },
    });
    if (result.count === 0) {
      return null;
    }
    return this.findById(tenantId, id);
  }
}
