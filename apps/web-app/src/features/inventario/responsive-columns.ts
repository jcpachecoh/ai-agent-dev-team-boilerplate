import type { ResponsiveColumnDef } from '@/lib/responsive-columns';

export const INVENTARIO_PRODUCT_RESPONSIVE_COLUMNS: ResponsiveColumnDef[] = [
  { id: 'sku', label: 'SKU', priority: 1, gridTrack: 'minmax(96px, 120px)', cardLabel: 'SKU' },
  { id: 'name', label: 'Nombre', priority: 1, gridTrack: 'minmax(140px, 1.4fr)' },
  { id: 'category', label: 'Categoría', priority: 2, gridTrack: 'minmax(80px, 0.9fr)' },
  { id: 'supplier', label: 'Proveedor', priority: 2, gridTrack: 'minmax(110px, 1fr)' },
  { id: 'minStock', label: 'Stock mín.', priority: 3, gridTrack: 'minmax(88px, 100px)' },
  { id: 'stock', label: 'Stock actual', priority: 2, gridTrack: 'minmax(72px, 88px)' },
  { id: 'unit', label: 'Unidad', priority: 3, gridTrack: 'minmax(100px, 120px)' },
  { id: 'price', label: 'Precio Unit.', priority: 3, gridTrack: 'minmax(88px, 96px)' },
  { id: 'lastMovement', label: 'Último Mov.', priority: 4, gridTrack: 'minmax(96px, 108px)' },
  { id: 'actions', label: 'Acciones', priority: 1, gridTrack: 'minmax(88px, 100px)' },
];

export const INVENTARIO_CATEGORY_RESPONSIVE_COLUMNS: ResponsiveColumnDef[] = [
  { id: 'nombre', label: 'Nombre', priority: 1, gridTrack: 'minmax(140px, 1.6fr)' },
  { id: 'descripcion', label: 'Descripción', priority: 2, gridTrack: 'minmax(160px, 2fr)' },
  { id: 'estado', label: 'Estado', priority: 2, gridTrack: 'minmax(96px, 120px)' },
  { id: 'actions', label: 'Acciones', priority: 1, gridTrack: 'minmax(88px, 100px)' },
];

export const INVENTARIO_MOVEMENT_RESPONSIVE_COLUMNS: ResponsiveColumnDef[] = [
  { id: 'date', label: 'Fecha', priority: 2, gridTrack: 'minmax(100px, 116px)' },
  { id: 'product', label: 'Producto', priority: 1, gridTrack: 'minmax(140px, 1.5fr)' },
  { id: 'type', label: 'Tipo', priority: 2, gridTrack: 'minmax(96px, 110px)' },
  { id: 'quantity', label: 'Cantidad', priority: 2, gridTrack: 'minmax(72px, 84px)' },
  { id: 'user', label: 'Usuario', priority: 3, gridTrack: 'minmax(100px, 1fr)' },
  { id: 'reference', label: 'Referencia', priority: 3, gridTrack: 'minmax(96px, 110px)' },
];

export const INVENTARIO_ALERT_RESPONSIVE_COLUMNS: ResponsiveColumnDef[] = [
  { id: 'severity', label: 'Severidad', priority: 2, gridTrack: 'minmax(100px, 120px)' },
  { id: 'product', label: 'Producto', priority: 1, gridTrack: 'minmax(140px, 1.5fr)' },
  { id: 'currentStock', label: 'Stock actual', priority: 2, gridTrack: 'minmax(88px, 100px)' },
  { id: 'minStock', label: 'Stock mín.', priority: 3, gridTrack: 'minmax(88px, 100px)' },
  { id: 'supplier', label: 'Proveedor', priority: 2, gridTrack: 'minmax(110px, 1fr)' },
  { id: 'actions', label: 'Acciones', priority: 1, gridTrack: 'minmax(120px, 140px)' },
];
