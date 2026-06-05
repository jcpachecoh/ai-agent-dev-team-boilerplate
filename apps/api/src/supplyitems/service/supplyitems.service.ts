import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { SupplyItemPriceHistory } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type {
  CreateSupplyItemData,
  FindSupplyItemsOptions,
  ISupplyitemsService,
  SupplyItemSupplierRow,
  UpdateSupplyItemData,
} from '../interfaces/supplyitems.interfaces';
import type { SupplyItemWithRelations } from '../mapper/supply-item.mapper';
import { SupplyItemsRepository } from '../repository/supplyitems.repository';

@Injectable()
export class SupplyItemsService implements ISupplyitemsService {
  constructor(private readonly supplyItemsRepository: SupplyItemsRepository) {}

  async findOne(tenantId: string, id: string): Promise<SupplyItemWithRelations> {
    const item = await this.supplyItemsRepository.findOneDetailed(tenantId, id);
    if (!item) {
      throw new NotFoundException(`SupplyItem ${id} not found`);
    }
    return item;
  }

  findAll(
    tenantId: string,
    options: FindSupplyItemsOptions = {},
  ): Promise<SupplyItemWithRelations[]> {
    return this.supplyItemsRepository.findAll(tenantId, {
      ...options,
      isActive: options.isActive ?? true,
    });
  }

  async create(tenantId: string, data: CreateSupplyItemData): Promise<SupplyItemWithRelations> {
    await this.assertCategory(tenantId, data.categoriaId);
    await this.assertCodigoUnique(tenantId, data.codigoInterno);
    this.assertStockRange(data.stockMinimoBodega, data.stockMaximoBodega);
    if (data.stockActualBodega !== undefined) {
      this.assertNonNegativeStockActual(data.stockActualBodega);
    }

    try {
      return await this.supplyItemsRepository.create(tenantId, data);
    } catch (error) {
      this.rethrowUniqueConflict(error);
      throw error;
    }
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateSupplyItemData,
  ): Promise<SupplyItemWithRelations> {
    const existing = await this.findOne(tenantId, id);

    if (data.categoriaId) {
      await this.assertCategory(tenantId, data.categoriaId);
    }

    if (data.codigoInterno && data.codigoInterno !== existing.codigoInterno) {
      await this.assertCodigoUnique(tenantId, data.codigoInterno, id);
    }

    const min = data.stockMinimoBodega ?? String(existing.stockMinimoBodega);
    const max = data.stockMaximoBodega ?? String(existing.stockMaximoBodega);
    this.assertStockRange(min, max);
    if (data.stockActualBodega !== undefined) {
      this.assertNonNegativeStockActual(data.stockActualBodega);
    }

    try {
      return await this.supplyItemsRepository.update(tenantId, id, data);
    } catch (error) {
      this.rethrowUniqueConflict(error);
      throw error;
    }
  }

  deactivate(tenantId: string, id: string): Promise<SupplyItemWithRelations> {
    return this.update(tenantId, id, { isActive: false });
  }

  async findSuppliers(tenantId: string, id: string): Promise<SupplyItemSupplierRow[]> {
    await this.findOne(tenantId, id);
    return this.supplyItemsRepository.findSuppliersForItem(tenantId, id);
  }

  async findPriceHistory(
    tenantId: string,
    id: string,
    options?: { limit?: number; offset?: number },
  ): Promise<SupplyItemPriceHistory[]> {
    await this.findOne(tenantId, id);
    return this.supplyItemsRepository.findPriceHistory(tenantId, id, options);
  }

  private async assertCategory(tenantId: string, categoriaId: string): Promise<void> {
    const exists = await this.supplyItemsRepository.categoryExists(tenantId, categoriaId);
    if (!exists) {
      throw new NotFoundException(`SupplyCategory ${categoriaId} not found`);
    }
  }

  private async assertCodigoUnique(
    tenantId: string,
    codigoInterno: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.supplyItemsRepository.findByCodigoInterno(tenantId, codigoInterno);
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`codigoInterno '${codigoInterno}' already exists`);
    }
  }

  private assertStockRange(min: string, max: string): void {
    if (Number(min) > Number(max)) {
      throw new BadRequestException('stockMinimoBodega cannot exceed stockMaximoBodega');
    }
  }

  private assertNonNegativeStockActual(value: string): void {
    if (Number(value) < 0) {
      throw new BadRequestException('stockActualBodega cannot be negative');
    }
  }

  private rethrowUniqueConflict(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Supply item with this codigoInterno already exists');
    }
  }
}
