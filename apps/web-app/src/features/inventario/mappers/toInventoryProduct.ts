import type { InventoryProduct } from '@/types/inventory';

import type { SupplyItemApi } from '../types';

export function toInventoryProduct(item: SupplyItemApi): InventoryProduct {
  const stock = item.stockDisponible ?? 0;

  return {
    id: item.id,
    sku: item.codigoInterno,
    name: item.nombre,
    descripcion: item.descripcion ?? undefined,
    category: item.categoria?.nombre ?? '—',
    categoryId: item.categoriaId,
    supplier: item.proveedorPrincipal?.razonSocial ?? '—',
    supplierId: item.proveedorPrincipal?.supplierId,
    costPrice: item.costoPromedioPonderado,
    sellingPrice: 0,
    currentStock: stock,
    minStock: item.stockMinimoBodega,
    maxStock: item.stockMaximoBodega,
    lastMovement: '—',
    isActive: item.isActive,
    itemType: 'supply',
    unidadBase: item.unidadBase,
    aplicaVencimiento: item.aplicaVencimiento,
    aplicaLote: item.aplicaLote,
  };
}
