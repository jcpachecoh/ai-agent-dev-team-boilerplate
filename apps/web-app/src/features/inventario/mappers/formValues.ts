import type { InventoryProduct, InventoryProductFormValues } from '@/types/inventory';

import type { CreateSupplyItemInput, UpdateSupplyItemInput } from '../types';

function isoToDateInput(iso?: string | null): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function trackingFieldsFromForm(
  values: InventoryProductFormValues,
): Pick<CreateSupplyItemInput, 'fechaVencimiento' | 'lote'> {
  return {
    fechaVencimiento: values.aplicaVencimiento ? values.fechaVencimiento.trim() : null,
    lote: values.aplicaLote ? values.lote.trim() : null,
  };
}

export function formValuesToCreateInput(values: InventoryProductFormValues): CreateSupplyItemInput {
  return {
    nombre: values.name.trim(),
    codigoInterno: values.sku.trim(),
    descripcion: values.descripcion.trim() || undefined,
    categoriaId: values.categoryId,
    unidadBase: values.unidadBase,
    factorConversion: values.factorConversion || '1',
    costoPromedioPonderado: values.costPrice || '0',
    stockMinimoBodega: values.minStock || '0',
    stockMaximoBodega: values.maxStock || '0',
    stockActualBodega: values.currentStock || '0',
    aplicaVencimiento: values.aplicaVencimiento,
    aplicaLote: values.aplicaLote,
    ...trackingFieldsFromForm(values),
    isActive: true,
  };
}

export function formValuesToUpdateInput(values: InventoryProductFormValues): UpdateSupplyItemInput {
  return {
    ...formValuesToCreateInput(values),
    isActive: values.isActive,
  };
}

export function productToFormValues(product: InventoryProduct): InventoryProductFormValues {
  return {
    sku: product.sku,
    name: product.name,
    descripcion: product.descripcion ?? '',
    categoryId: product.categoryId,
    costPrice: String(product.costPrice),
    minStock: String(product.minStock),
    maxStock: String(product.maxStock),
    currentStock: String(product.currentStock),
    unidadBase: product.unidadBase ?? 'UNIT',
    factorConversion: '1',
    aplicaVencimiento: product.aplicaVencimiento ?? false,
    aplicaLote: product.aplicaLote ?? false,
    fechaVencimiento: isoToDateInput(product.fechaVencimiento),
    lote: product.lote ?? '',
    isActive: product.isActive,
  };
}
