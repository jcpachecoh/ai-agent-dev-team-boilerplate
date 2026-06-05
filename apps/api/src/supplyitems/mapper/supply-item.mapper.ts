import type { SupplyCategory, Supplier, SupplierProduct, SupplyItem } from '@prisma/client';
import { decimalToNumber } from '../../common/utils/decimal.util';
import type { SupplyItemResponseDto } from '../dto/supply-item-response.dto';

export type SupplyItemWithCategoria = SupplyItem & {
  categoria: SupplyCategory;
};

export type SupplyItemWithRelations = SupplyItemWithCategoria & {
  supplierProducts?: (SupplierProduct & { supplier: Supplier })[];
};

export function toSupplyItemResponse(item: SupplyItemWithRelations): SupplyItemResponseDto {
  const principal = item.supplierProducts?.find((sp) => sp.esProveedorPrincipal);

  return {
    id: item.id,
    tenantId: item.tenantId,
    nombre: item.nombre,
    codigoInterno: item.codigoInterno,
    categoriaId: item.categoriaId,
    categoria: item.categoria
      ? { id: item.categoria.id, nombre: item.categoria.nombre }
      : undefined,
    descripcion: item.descripcion,
    unidadBase: item.unidadBase,
    factorConversion: decimalToNumber(item.factorConversion),
    costoPromedioPonderado: decimalToNumber(item.costoPromedioPonderado),
    stockMinimoBodega: decimalToNumber(item.stockMinimoBodega),
    stockMaximoBodega: decimalToNumber(item.stockMaximoBodega),
    stockActualBodega: decimalToNumber(item.stockActualBodega),
    aplicaVencimiento: item.aplicaVencimiento,
    aplicaLote: item.aplicaLote,
    isActive: item.isActive,
    proveedorPrincipal: principal
      ? {
          supplierId: principal.supplierId,
          razonSocial: principal.supplier.razonSocial,
        }
      : null,
    stockDisponible: decimalToNumber(item.stockActualBodega),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}
