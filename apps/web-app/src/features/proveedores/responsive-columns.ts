import type { ResponsiveColumnDef } from '@/lib/responsive-columns';

export const PROVEEDOR_SUPPLIER_RESPONSIVE_COLUMNS: ResponsiveColumnDef[] = [
  { id: 'id', label: 'ID', priority: 1, gridTrack: 'minmax(72px, 0.6fr)', cardLabel: 'ID' },
  { id: 'name', label: 'Proveedor', priority: 1, gridTrack: 'minmax(140px, 1.6fr)' },
  { id: 'status', label: 'Estado', priority: 2, gridTrack: 'minmax(88px, 0.7fr)' },
  { id: 'balance', label: 'Saldo CXP', priority: 2, gridTrack: 'minmax(96px, 0.8fr)' },
  { id: 'products', label: 'Productos', priority: 3, gridTrack: 'minmax(72px, 0.5fr)' },
  { id: 'category', label: 'Categoría', priority: 4, gridTrack: 'minmax(100px, 1fr)' },
  { id: 'payment', label: 'Condición pago', priority: 4, gridTrack: 'minmax(110px, 0.9fr)' },
  { id: 'leadTime', label: 'Lead time', priority: 5, gridTrack: 'minmax(80px, 0.6fr)' },
  { id: 'reliability', label: 'Confiabilidad', priority: 5, gridTrack: 'minmax(96px, 0.7fr)' },
  { id: 'lastPo', label: 'Última OC', priority: 5, gridTrack: 'minmax(88px, 0.6fr)' },
];

export const PROVEEDOR_CATALOG_RESPONSIVE_COLUMNS: ResponsiveColumnDef[] = [
  { id: 'product', label: 'Producto', priority: 1, gridTrack: 'minmax(180px, 1.6fr)' },
  { id: 'sku', label: 'SKU', priority: 1, gridTrack: '100px', cardLabel: 'SKU' },
  { id: 'unit', label: 'Unidad', priority: 3, gridTrack: '70px' },
  { id: 'currentPrice', label: 'Precio actual', priority: 2, gridTrack: '120px' },
  { id: 'previousPrice', label: 'Precio anterior', priority: 4, gridTrack: '120px' },
  { id: 'moq', label: 'MOQ', priority: 3, gridTrack: '70px' },
  { id: 'status', label: 'Estado', priority: 2, gridTrack: '100px' },
  { id: 'actions', label: 'Acciones', priority: 1, gridTrack: '110px' },
];
