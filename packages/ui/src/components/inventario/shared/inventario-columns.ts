import type { InventarioTableColumn } from './inventario-types';

export const inventarioProductGridTemplate =
  'minmax(96px, 120px) minmax(140px, 1.4fr) minmax(80px, 0.9fr) minmax(110px, 1fr) minmax(72px, 88px) minmax(88px, 96px) minmax(96px, 108px) minmax(88px, 100px)';

export const inventarioMovementGridTemplate =
  'minmax(100px, 116px) minmax(140px, 1.5fr) minmax(96px, 110px) minmax(72px, 84px) minmax(100px, 1fr) minmax(96px, 110px)';

export const inventarioAlertGridTemplate =
  'minmax(100px, 120px) minmax(140px, 1.5fr) minmax(88px, 100px) minmax(88px, 100px) minmax(110px, 1fr) minmax(120px, 140px)';

export const inventarioReportGridTemplate =
  'minmax(140px, 1fr) minmax(88px, 120px) minmax(56px, 72px)';

export const defaultProductColumns: InventarioTableColumn[] = [
  { key: 'sku', label: 'SKU', width: 'minmax(96px, 120px)' },
  { key: 'name', label: 'Nombre', width: 'minmax(140px, 1.4fr)' },
  { key: 'category', label: 'Categoría', width: 'minmax(80px, 0.9fr)' },
  { key: 'supplier', label: 'Proveedor', width: 'minmax(110px, 1fr)' },
  { key: 'stock', label: 'Stock Total', align: 'center', width: 'minmax(72px, 88px)' },
  { key: 'price', label: 'Precio Unit.', align: 'right', width: 'minmax(88px, 96px)' },
  { key: 'lastMovement', label: 'Último Mov.', width: 'minmax(96px, 108px)' },
  { key: 'actions', label: 'Acciones', align: 'center', width: 'minmax(88px, 100px)' },
];

export const defaultMovementColumns: InventarioTableColumn[] = [
  { key: 'date', label: 'Fecha', width: 'minmax(100px, 116px)' },
  { key: 'product', label: 'Producto', width: 'minmax(140px, 1.5fr)' },
  { key: 'type', label: 'Tipo', align: 'center', width: 'minmax(96px, 110px)' },
  { key: 'quantity', label: 'Cantidad', align: 'center', width: 'minmax(72px, 84px)' },
  { key: 'user', label: 'Usuario', width: 'minmax(100px, 1fr)' },
  { key: 'reference', label: 'Referencia', width: 'minmax(96px, 110px)' },
];

export const defaultAlertColumns: InventarioTableColumn[] = [
  { key: 'severity', label: 'Severidad', width: 'minmax(100px, 120px)' },
  { key: 'product', label: 'Producto', width: 'minmax(140px, 1.5fr)' },
  { key: 'currentStock', label: 'Stock Actual', align: 'center', width: 'minmax(88px, 100px)' },
  { key: 'minStock', label: 'Stock Mín.', align: 'center', width: 'minmax(88px, 100px)' },
  { key: 'supplier', label: 'Proveedor', width: 'minmax(110px, 1fr)' },
  { key: 'actions', label: 'Acciones', align: 'center', width: 'minmax(120px, 140px)' },
];
