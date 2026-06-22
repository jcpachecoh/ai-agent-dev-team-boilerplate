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
    return this.supplyItemsRepository.findAll(tenantId, options);
  }

  async create(tenantId: string, data: CreateSupplyItemData): Promise<SupplyItemWithRelations> {
    await this.assertCategory(tenantId, data.categoriaId);
    const codigoInterno =
      data.codigoInterno?.trim() || (await this.getNextCodigoInterno(tenantId, data.categoriaId));
    await this.assertCodigoUnique(tenantId, codigoInterno);
    this.assertStockRange(data.stockMinimoBodega, data.stockMaximoBodega);
    if (data.stockActualBodega !== undefined) {
      this.assertNonNegativeStockActual(data.stockActualBodega);
    }

    const tracking = this.resolveTrackingFields(data);

    try {
      return await this.supplyItemsRepository.create(tenantId, {
        ...data,
        codigoInterno,
        ...tracking,
      });
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

    const tracking = this.resolveTrackingFields({
      aplicaVencimiento: data.aplicaVencimiento ?? existing.aplicaVencimiento,
      aplicaLote: data.aplicaLote ?? existing.aplicaLote,
      fechaVencimiento:
        data.fechaVencimiento !== undefined
          ? data.fechaVencimiento
          : (existing.fechaVencimiento?.toISOString().slice(0, 10) ?? null),
      lote: data.lote !== undefined ? data.lote : existing.lote,
    });

    try {
      return await this.supplyItemsRepository.update(tenantId, id, { ...data, ...tracking });
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

  async getNextCodigoInterno(tenantId: string, categoriaId: string): Promise<string> {
    const prefijo = await this.supplyItemsRepository.findCategoryPrefijo(tenantId, categoriaId);
    if (!prefijo) {
      throw new NotFoundException(`SupplyCategory ${categoriaId} not found`);
    }

    const codigos = await this.supplyItemsRepository.findCodigosInternosByCategory(
      tenantId,
      categoriaId,
    );
    const pattern = new RegExp(`^${prefijo}-(\\d{6})$`);
    let maxSequence = 0;

    for (const codigo of codigos) {
      const match = codigo.match(pattern);
      if (match) {
        maxSequence = Math.max(maxSequence, Number.parseInt(match[1], 10));
      }
    }

    const nextSequence = maxSequence + 1;
    if (nextSequence > 999999) {
      throw new BadRequestException(
        `No more sequential codes available for category prefix ${prefijo}`,
      );
    }

    return `${prefijo}-${String(nextSequence).padStart(6, '0')}`;
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

  private resolveTrackingFields(data: {
    aplicaVencimiento?: boolean;
    aplicaLote?: boolean;
    fechaVencimiento?: string | Date | null;
    lote?: string | null;
  }): { fechaVencimiento: Date | null; lote: string | null } {
    const aplicaVencimiento = data.aplicaVencimiento ?? false;
    const aplicaLote = data.aplicaLote ?? false;
    const fechaVencimiento = this.normalizeFechaVencimientoInput(data.fechaVencimiento);

    if (aplicaVencimiento && !fechaVencimiento?.trim()) {
      throw new BadRequestException(
        'La fecha de vencimiento es obligatoria cuando aplica vencimiento.',
      );
    }

    if (aplicaLote && !data.lote?.trim()) {
      throw new BadRequestException('El lote es obligatorio cuando aplica lote.');
    }

    return {
      fechaVencimiento: aplicaVencimiento
        ? this.parseFechaVencimiento(fechaVencimiento!.trim())
        : null,
      lote: aplicaLote ? data.lote!.trim() : null,
    };
  }

  private normalizeFechaVencimientoInput(value?: string | Date | null): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }

    return value;
  }

  private parseFechaVencimiento(value: string): Date {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('fechaVencimiento is invalid');
    }
    return parsed;
  }

  private rethrowUniqueConflict(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Supply item with this codigoInterno already exists');
    }
  }
}
