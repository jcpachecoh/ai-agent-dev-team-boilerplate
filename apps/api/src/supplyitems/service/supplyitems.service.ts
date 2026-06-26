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
import {
  DOTACION_CATEGORY_NOMBRE,
  DOTACION_SUBCATEGORIAS,
  getAllowedGeneros,
  getAllowedTallas,
  type DotacionSubcategoria,
} from '../constants/dotacion.constants';

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
    if (data.locationId) {
      await this.assertLocation(tenantId, data.locationId);
    }
    const codigoInterno =
      data.codigoInterno?.trim() || (await this.getNextCodigoInterno(tenantId, data.categoriaId));
    await this.assertCodigoUnique(tenantId, codigoInterno);
    this.assertStockRange(data.stockMinimoBodega, data.stockMaximoBodega);
    if (data.stockActualBodega !== undefined) {
      this.assertNonNegativeStockActual(data.stockActualBodega);
    }

    const normalizedData = await this.normalizeDotacionFields(tenantId, data.categoriaId, data);
    const tracking = this.resolveTrackingFields(normalizedData);

    try {
      return await this.supplyItemsRepository.create(tenantId, {
        ...normalizedData,
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

    if (data.locationId !== undefined && data.locationId !== null) {
      await this.assertLocation(tenantId, data.locationId);
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

    const effectiveCategoriaId = data.categoriaId ?? existing.categoriaId;
    const normalizedData = await this.normalizeDotacionFields(tenantId, effectiveCategoriaId, data);

    const tracking = this.resolveTrackingFields({
      aplicaVencimiento: normalizedData.aplicaVencimiento ?? existing.aplicaVencimiento,
      aplicaLote: normalizedData.aplicaLote ?? existing.aplicaLote,
      fechaVencimiento:
        normalizedData.fechaVencimiento !== undefined
          ? normalizedData.fechaVencimiento
          : (existing.fechaVencimiento?.toISOString().slice(0, 10) ?? null),
      lote: normalizedData.lote !== undefined ? normalizedData.lote : existing.lote,
    });

    try {
      return await this.supplyItemsRepository.update(tenantId, id, {
        ...normalizedData,
        ...tracking,
      });
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

  private async normalizeDotacionFields<
    T extends { subcategoria?: string | null; genero?: string | null; talla?: string | null },
  >(tenantId: string, categoriaId: string, data: T): Promise<T> {
    const nombre = await this.supplyItemsRepository.findCategoryNombre(tenantId, categoriaId);

    if (nombre !== DOTACION_CATEGORY_NOMBRE) {
      return { ...data, subcategoria: null, genero: null, talla: null };
    }

    if (!data.subcategoria) {
      throw new BadRequestException('subcategoria es requerida para la categoría Dotación');
    }
    if (!(DOTACION_SUBCATEGORIAS as readonly string[]).includes(data.subcategoria)) {
      throw new BadRequestException(
        `subcategoria '${data.subcategoria}' no es válida para Dotación`,
      );
    }

    const subcatKey = data.subcategoria as DotacionSubcategoria;
    const allowedGeneros = getAllowedGeneros(subcatKey);

    if (!data.genero) {
      throw new BadRequestException('genero es requerido para la categoría Dotación');
    }
    if (!allowedGeneros.includes(data.genero)) {
      throw new BadRequestException(
        `genero '${data.genero}' no es válido para subcategoria '${data.subcategoria}'. Valores permitidos: ${allowedGeneros.join(', ')}`,
      );
    }

    const allowedTallas = getAllowedTallas(subcatKey, data.genero);

    if (!data.talla) {
      throw new BadRequestException('talla es requerida para la categoría Dotación');
    }
    if (!allowedTallas.includes(data.talla)) {
      throw new BadRequestException(
        `talla '${data.talla}' no es válida para subcategoria '${data.subcategoria}' y genero '${data.genero}'. Valores permitidos: ${allowedTallas.join(', ')}`,
      );
    }

    return data;
  }

  private async assertCategory(tenantId: string, categoriaId: string): Promise<void> {
    const exists = await this.supplyItemsRepository.categoryExists(tenantId, categoriaId);
    if (!exists) {
      throw new NotFoundException(`SupplyCategory ${categoriaId} not found`);
    }
  }

  private async assertLocation(tenantId: string, locationId: string): Promise<void> {
    const exists = await this.supplyItemsRepository.locationExists(tenantId, locationId);
    if (!exists) {
      throw new NotFoundException(`Location ${locationId} not found`);
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

    return {
      fechaVencimiento:
        aplicaVencimiento && fechaVencimiento?.trim()
          ? this.parseFechaVencimiento(fechaVencimiento.trim())
          : null,
      lote: aplicaLote && data.lote?.trim() ? data.lote.trim() : null,
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
