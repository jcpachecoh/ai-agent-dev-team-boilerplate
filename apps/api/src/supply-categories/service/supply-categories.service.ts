import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { SupplyCategory } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { ISupplyCategoriesService } from '../interfaces/supply-categories.interfaces';
import { SupplyCategoriesRepository } from '../repository/supply-categories.repository';

@Injectable()
export class SupplyCategoriesService implements ISupplyCategoriesService {
  constructor(private readonly repository: SupplyCategoriesRepository) {}

  findAll(tenantId: string, isActive?: boolean): Promise<SupplyCategory[]> {
    return this.repository.findAll(tenantId, isActive);
  }

  async create(
    tenantId: string,
    data: { nombre: string; descripcion?: string },
  ): Promise<SupplyCategory> {
    try {
      return await this.repository.create(tenantId, data);
    } catch (error) {
      this.rethrowUnique(error);
      throw error;
    }
  }

  async update(
    tenantId: string,
    id: string,
    data: { nombre?: string; descripcion?: string; isActive?: boolean },
  ): Promise<SupplyCategory> {
    const existing = await this.repository.findOne(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`SupplyCategory ${id} not found`);
    }

    try {
      return await this.repository.update(tenantId, id, data);
    } catch (error) {
      this.rethrowUnique(error);
      throw error;
    }
  }

  private rethrowUnique(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Category name already exists for this tenant');
    }
  }
}
