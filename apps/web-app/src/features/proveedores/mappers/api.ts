import type { ProveedorSupplierStatus } from '@restopsiq/ui';

import type {
  SupplierApiModel,
  SupplierCatalogRow,
  SupplierProductApiModel,
  SupplierViewModel,
} from '../types';

export function toDisplayCode(id: string): string {
  return `#${id.slice(-6).toUpperCase()}`;
}

export function toSupplierStatus(isActive: boolean): ProveedorSupplierStatus {
  return isActive ? 'active' : 'inactive';
}

export function mapSupplierToViewModel(supplier: SupplierApiModel): SupplierViewModel {
  return {
    id: supplier.id,
    displayCode: toDisplayCode(supplier.id),
    razonSocial: supplier.razonSocial,
    nit: supplier.nit,
    dv: supplier.dv ?? undefined,
    tipo: supplier.tipo,
    direccion: supplier.direccion ?? undefined,
    departamento: supplier.departamento ?? undefined,
    ciudad: supplier.ciudad ?? undefined,
    telefono: supplier.telefono ?? undefined,
    email: supplier.email ?? undefined,
    contactoNombre: supplier.contactoNombre ?? undefined,
    condicionPago: supplier.condicionPago,
    cupoCredito: supplier.cupoCredito,
    calificacion: supplier.calificacion,
    isActive: supplier.isActive,
    status: toSupplierStatus(supplier.isActive),
    categoryLabel: 'Sin categoría',
    leadTimeLabel: '—',
    balanceCxp: 0,
    productCount: supplier.productCount ?? 0,
  };
}

export function mapSupplierProductToCatalogRow(
  product: SupplierProductApiModel,
): SupplierCatalogRow {
  return {
    supplierProductId: product.id,
    supplyItemId: product.supplyItemId,
    productName: product.supplyItem.nombre,
    sku: product.supplyItem.codigoInterno,
    precioUnitario: product.precioUnitario,
    precioAnterior: product.precioAnterior ?? undefined,
    unidadCompra: product.unidadCompra,
    factorConversion: product.factorConversion,
    tiempoEntregaDias: product.tiempoEntregaDias,
    esProveedorPrincipal: product.esProveedorPrincipal,
    catalogStatus: 'available',
  };
}
