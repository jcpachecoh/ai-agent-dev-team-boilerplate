import { Injectable } from '@nestjs/common';
import { EmployeeCatalogType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  EmployeeCatalogOptionRecord,
  IEmployeeCatalogRepository,
} from '../interfaces/employee-catalog.interfaces';

@Injectable()
export class EmployeeCatalogRepository implements IEmployeeCatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    type?: EmployeeCatalogType,
  ): Promise<EmployeeCatalogOptionRecord[]> {
    return this.prisma.employeeCatalogOption.findMany({
      where: {
        tenantId,
        isActive: true,
        ...(type ? { type } : {}),
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        tenantId: true,
        type: true,
        name: true,
        pilaCode: true,
        isActive: true,
      },
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
      select: {
        id: true,
        tenantId: true,
        type: true,
        name: true,
        pilaCode: true,
        isActive: true,
      },
    });
  }
}
