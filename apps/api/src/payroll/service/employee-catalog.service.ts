import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmployeeCatalogType, Prisma } from '@prisma/client';

import type {
  CreateEmployeeCatalogOptionData,
  EmployeeCatalogOptionRecord,
  IEmployeeCatalogService,
  ListEmployeeCatalogOptions,
  UpdateEmployeeCatalogOptionData,
} from '../interfaces/employee-catalog.interfaces';
import { EmployeeCatalogRepository } from '../repository/employee-catalog.repository';

const TYPES_WITHOUT_PILA_CODE: ReadonlySet<EmployeeCatalogType> = new Set([
  EmployeeCatalogType.OVERTIME_REASON,
  EmployeeCatalogType.AREA,
  EmployeeCatalogType.DEPARTMENT,
  EmployeeCatalogType.CESANTIAS_FUND,
]);

@Injectable()
export class EmployeeCatalogService implements IEmployeeCatalogService {
  constructor(private readonly employeeCatalogRepository: EmployeeCatalogRepository) {}

  findAll(
    tenantId: string,
    options?: ListEmployeeCatalogOptions,
  ): Promise<EmployeeCatalogOptionRecord[]> {
    return this.employeeCatalogRepository.findAll(tenantId, options);
  }

  findActiveByIdAndType(
    tenantId: string,
    id: string,
    type: EmployeeCatalogType,
  ): Promise<EmployeeCatalogOptionRecord | null> {
    return this.employeeCatalogRepository.findActiveByIdAndType(tenantId, id, type);
  }

  async create(
    tenantId: string,
    data: CreateEmployeeCatalogOptionData,
  ): Promise<EmployeeCatalogOptionRecord> {
    const name = this.normalizeName(data.name);
    const pilaCode = this.resolvePilaCode(data.type, data.pilaCode);

    await this.assertNoDuplicateName(tenantId, data.type, name);

    try {
      return await this.employeeCatalogRepository.create(tenantId, {
        type: data.type,
        name,
        pilaCode,
      });
    } catch (error) {
      this.rethrowUniqueConflict(error);
      throw error;
    }
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateEmployeeCatalogOptionData,
  ): Promise<EmployeeCatalogOptionRecord> {
    const existing = await this.requireById(tenantId, id);

    const patch: UpdateEmployeeCatalogOptionData = {};

    if (data.name !== undefined) {
      const name = this.normalizeName(data.name);
      await this.assertNoDuplicateName(tenantId, existing.type, name, id);
      patch.name = name;
    }

    if (data.isActive !== undefined) {
      patch.isActive = data.isActive;
    }

    if (data.pilaCode !== undefined) {
      patch.pilaCode = this.resolvePilaCode(existing.type, data.pilaCode);
    }

    if (Object.keys(patch).length === 0) {
      return existing;
    }

    try {
      const updated = await this.employeeCatalogRepository.update(tenantId, id, patch);
      if (!updated) {
        throw new NotFoundException(`Employee catalog option "${id}" not found`);
      }
      return updated;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.rethrowUniqueConflict(error);
      throw error;
    }
  }

  /**
   * Soft-deactivate. Allowed even when referenced by OvertimeRequest (historial).
   * Physical delete is not exposed — FKs must remain.
   */
  async deactivate(tenantId: string, id: string): Promise<EmployeeCatalogOptionRecord> {
    await this.requireById(tenantId, id);
    const updated = await this.employeeCatalogRepository.update(tenantId, id, {
      isActive: false,
    });
    if (!updated) {
      throw new NotFoundException(`Employee catalog option "${id}" not found`);
    }
    return updated;
  }

  private async requireById(tenantId: string, id: string): Promise<EmployeeCatalogOptionRecord> {
    const row = await this.employeeCatalogRepository.findById(tenantId, id);
    if (!row) {
      throw new NotFoundException(`Employee catalog option "${id}" not found`);
    }
    return row;
  }

  private async assertNoDuplicateName(
    tenantId: string,
    type: EmployeeCatalogType,
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const conflict = await this.employeeCatalogRepository.findByTypeAndNameInsensitive(
      tenantId,
      type,
      name,
    );
    if (conflict && conflict.id !== excludeId) {
      throw new ConflictException(
        `Ya existe una opción de catálogo "${name}" para el tipo ${type} en este tenant`,
      );
    }
  }

  private normalizeName(name: string): string {
    const normalized = name.trim().replace(/\s+/g, ' ');
    if (!normalized) {
      throw new BadRequestException('El nombre del catálogo no puede estar vacío');
    }
    return normalized;
  }

  private resolvePilaCode(
    type: EmployeeCatalogType,
    pilaCode: string | null | undefined,
  ): string | null {
    if (TYPES_WITHOUT_PILA_CODE.has(type)) {
      return null;
    }
    if (pilaCode === undefined || pilaCode === null) {
      return null;
    }
    const trimmed = pilaCode.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private rethrowUniqueConflict(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException(
        'Ya existe una opción de catálogo con el mismo nombre o código PILA en este tenant',
      );
    }
  }
}
