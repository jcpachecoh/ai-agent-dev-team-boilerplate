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
    data: { nombre: string; prefijo: string; descripcion?: string },
  ): Promise<SupplyCategory> {
    const nombre = data.nombre.trim();
    const prefijo = data.prefijo.trim().toUpperCase();

    await this.assertNombreAvailable(tenantId, nombre);
    await this.assertPrefijoAvailable(tenantId, prefijo);

    try {
      return await this.repository.create(tenantId, {
        ...data,
        nombre,
        prefijo,
      });
    } catch (error) {
      this.rethrowUnique(error);
      throw error;
    }
  }

  async update(
    tenantId: string,
    id: string,
    data: { nombre?: string; prefijo?: string; descripcion?: string; isActive?: boolean },
  ): Promise<SupplyCategory> {
    const existing = await this.repository.findOne(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`SupplyCategory ${id} not found`);
    }

    const patch: {
      nombre?: string;
      prefijo?: string;
      descripcion?: string;
      isActive?: boolean;
    } = {};

    if (data.nombre !== undefined) {
      const nombre = data.nombre.trim();
      if (nombre !== existing.nombre) {
        await this.assertNombreAvailable(tenantId, nombre, id);
        patch.nombre = nombre;
      }
    }

    if (data.prefijo !== undefined) {
      const prefijo = data.prefijo.trim().toUpperCase();
      if (prefijo !== existing.prefijo) {
        await this.assertPrefijoAvailable(tenantId, prefijo, id);
        patch.prefijo = prefijo;
      }
    }

    if (data.descripcion !== undefined) {
      patch.descripcion = data.descripcion;
    }

    if (data.isActive !== undefined) {
      patch.isActive = data.isActive;
    }

    if (Object.keys(patch).length === 0) {
      return existing;
    }

    try {
      return await this.repository.update(tenantId, id, patch);
    } catch (error) {
      this.rethrowUnique(error);
      throw error;
    }
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const existing = await this.repository.findOne(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`SupplyCategory ${id} not found`);
    }

    const itemCount = await this.repository.countItemsByCategory(tenantId, id);
    if (itemCount > 0) {
      throw new ConflictException(
        `No se puede eliminar la categoría "${existing.nombre}" porque tiene ${itemCount} insumo(s) asociado(s).`,
      );
    }

    await this.repository.remove(tenantId, id);
  }

  private async assertNombreAvailable(
    tenantId: string,
    nombre: string,
    excludeId?: string,
  ): Promise<void> {
    const conflict = await this.repository.findConflictingByNombre(tenantId, nombre, excludeId);
    if (conflict) {
      throw new ConflictException(
        `Ya existe otra categoría con el nombre "${nombre}". Elija un nombre distinto.`,
      );
    }
  }

  private async assertPrefijoAvailable(
    tenantId: string,
    prefijo: string,
    excludeId?: string,
  ): Promise<void> {
    const conflict = await this.repository.findConflictingByPrefijo(tenantId, prefijo, excludeId);
    if (conflict) {
      throw new ConflictException(
        `El prefijo "${prefijo}" ya está en uso por la categoría "${conflict.nombre}". Elija otro prefijo.`,
      );
    }
  }

  private rethrowUnique(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = error.meta?.target;
      if (Array.isArray(target) && target.some((field) => String(field).includes('prefijo'))) {
        throw new ConflictException(
          'El prefijo ya está en uso por otra categoría. Elija otro prefijo.',
        );
      }
      if (Array.isArray(target) && target.some((field) => String(field).includes('nombre'))) {
        throw new ConflictException(
          'Ya existe otra categoría con ese nombre. Elija un nombre distinto.',
        );
      }
      throw new ConflictException(
        'El nombre o el prefijo ya existe para otra categoría de este restaurante.',
      );
    }
  }
}
