import { Injectable } from '@nestjs/common';
import type { SupplyCategory } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { ISupplyCategoriesRepository } from '../interfaces/supply-categories.interfaces';
import { derivePrefijoFromNombre } from '../utils/derive-category-prefijo';

@Injectable()
export class SupplyCategoriesRepository implements ISupplyCategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, isActive?: boolean): Promise<SupplyCategory[]> {
    const where = {
      tenantId,
      ...(isActive != null ? { isActive } : {}),
    };

    const rows = await this.prisma.supplyCategory.findMany({
      where,
      orderBy: { nombre: 'asc' },
    });

    const missing = rows.filter((row) => !row.prefijo?.trim());
    if (missing.length === 0) return rows;

    for (const row of missing) {
      const prefijo = await this.allocateUniquePrefijo(tenantId, row.nombre, row.id);
      await this.prisma.supplyCategory.update({
        where: { id: row.id },
        data: { prefijo },
      });
    }

    return this.prisma.supplyCategory.findMany({
      where,
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string): Promise<SupplyCategory | null> {
    const row = await this.prisma.supplyCategory.findFirst({ where: { id, tenantId } });
    if (!row || row.prefijo?.trim()) return row;

    const prefijo = await this.allocateUniquePrefijo(tenantId, row.nombre, row.id);
    return this.prisma.supplyCategory.update({
      where: { id: row.id },
      data: { prefijo },
    });
  }

  create(
    tenantId: string,
    data: { nombre: string; prefijo: string; descripcion?: string },
  ): Promise<SupplyCategory> {
    return this.prisma.supplyCategory.create({
      data: {
        tenantId,
        nombre: data.nombre,
        prefijo: data.prefijo,
        descripcion: data.descripcion,
      },
    });
  }

  update(
    tenantId: string,
    id: string,
    data: { nombre?: string; prefijo?: string; descripcion?: string; isActive?: boolean },
  ): Promise<SupplyCategory> {
    return this.prisma.supplyCategory.update({
      where: { id },
      data,
    });
  }

  findConflictingByNombre(
    tenantId: string,
    nombre: string,
    excludeId?: string,
  ): Promise<SupplyCategory | null> {
    return this.prisma.supplyCategory.findFirst({
      where: {
        tenantId,
        nombre,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
  }

  findConflictingByPrefijo(
    tenantId: string,
    prefijo: string,
    excludeId?: string,
  ): Promise<SupplyCategory | null> {
    return this.prisma.supplyCategory.findFirst({
      where: {
        tenantId,
        prefijo,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
  }

  countItemsByCategory(tenantId: string, categoriaId: string): Promise<number> {
    return this.prisma.supplyItem.count({
      where: { tenantId, categoriaId },
    });
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.prisma.supplyCategory.deleteMany({ where: { id, tenantId } });
  }

  private async allocateUniquePrefijo(
    tenantId: string,
    nombre: string,
    excludeId: string,
  ): Promise<string> {
    const base = derivePrefijoFromNombre(nombre);
    let candidate = base;
    let suffix = 1;

    while (true) {
      const conflict = await this.prisma.supplyCategory.findFirst({
        where: { tenantId, prefijo: candidate, NOT: { id: excludeId } },
      });
      if (!conflict) return candidate;

      suffix += 1;
      const suffixText = String(suffix);
      candidate =
        base.length + suffixText.length <= 6
          ? `${base}${suffixText}`
          : `${base.slice(0, Math.max(2, 6 - suffixText.length))}${suffixText}`;
    }
  }
}
