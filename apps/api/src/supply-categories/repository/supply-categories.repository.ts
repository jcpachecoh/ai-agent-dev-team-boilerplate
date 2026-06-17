import { Injectable } from '@nestjs/common';
import type { SupplyCategory } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { ISupplyCategoriesRepository } from '../interfaces/supply-categories.interfaces';

@Injectable()
export class SupplyCategoriesRepository implements ISupplyCategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string, isActive?: boolean): Promise<SupplyCategory[]> {
    return this.prisma.supplyCategory.findMany({
      where: {
        tenantId,
        ...(isActive != null ? { isActive } : {}),
      },
      orderBy: { nombre: 'asc' },
    });
  }

  findOne(tenantId: string, id: string): Promise<SupplyCategory | null> {
    return this.prisma.supplyCategory.findFirst({ where: { id, tenantId } });
  }

  create(
    tenantId: string,
    data: { nombre: string; descripcion?: string },
  ): Promise<SupplyCategory> {
    return this.prisma.supplyCategory.create({
      data: {
        tenantId,
        nombre: data.nombre,
        descripcion: data.descripcion,
      },
    });
  }

  update(
    tenantId: string,
    id: string,
    data: { nombre?: string; descripcion?: string; isActive?: boolean },
  ): Promise<SupplyCategory> {
    return this.prisma.supplyCategory.update({
      where: { id },
      data,
    });
  }
}
