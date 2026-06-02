import type { InventarioStockTone } from '@restopsiq/ui';

import type { InventoryMovement, InventoryProduct } from '@/types/inventory';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

export function stockToneForProduct(product: InventoryProduct): InventarioStockTone {
  if (product.currentStock < product.minStock) return 'danger';
  if (product.currentStock < product.minStock * 1.2) return 'warning';
  return 'success';
}

export function formatMovementQuantity(quantity: number): string {
  if (quantity > 0) return `↑ ${quantity}`;
  return `↓ ${Math.abs(quantity)}`;
}

export function downloadCsv(filename: string, headers: string[], rows: string[][]): void {
  const escape = (cell: string) => `"${cell.replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(','), ...rows.map((row) => row.map(escape).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function movementsToCsv(movements: InventoryMovement[]): void {
  const date = new Date().toISOString().slice(0, 10);
  downloadCsv(
    `movements_${date}.csv`,
    ['Fecha', 'Tipo', 'Producto', 'Cantidad', 'Sede', 'Usuario', 'Razón'],
    movements.map((m) => [
      m.date,
      m.movementType,
      m.product,
      String(m.quantity),
      m.site,
      m.user,
      m.reason,
    ]),
  );
}

export function reportToCsv(rows: { category: string; quantity: number; percent: string }[]): void {
  const date = new Date().toISOString().slice(0, 10);
  downloadCsv(
    `report_${date}.csv`,
    ['Categoría', 'Cantidad', '%'],
    rows.map((r) => [r.category, String(r.quantity), r.percent]),
  );
}

export function filterProducts(
  products: InventoryProduct[],
  query: {
    search?: string;
    categoryId?: string;
    supplierId?: string;
    lowStockOnly?: boolean;
  },
): InventoryProduct[] {
  const search = query.search?.trim().toLowerCase() ?? '';

  return products.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search) && !p.sku.toLowerCase().includes(search)) {
      return false;
    }
    if (query.categoryId && query.categoryId !== 'all' && p.categoryId !== query.categoryId) {
      return false;
    }
    if (query.supplierId && query.supplierId !== 'all') {
      const supplierNeedle: Record<string, string> = {
        agrosuper: 'agrosuper',
        frigorifico: 'frigorífico',
        'arroz-diana': 'arroz diana',
        lloreda: 'lloreda',
        'agro-boyaca': 'agro boyacá',
      };
      const needle = supplierNeedle[query.supplierId] ?? query.supplierId;
      if (!p.supplier.toLowerCase().includes(needle)) return false;
    }
    if (query.lowStockOnly && p.currentStock >= p.minStock) {
      return false;
    }
    return true;
  });
}
